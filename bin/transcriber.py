#!/usr/bin/env python3
"""
transcriber.py — EditFlow Pro
Cloud transcription via Groq Whisper API (whisper-large-v3).
No local model. Works on any machine with internet.
"""
import sys, os, json, argparse, subprocess, shutil, math

TOOLS_DIR = os.path.expanduser("~/Library/Application Support/EditFlowPro/tools")
if getattr(sys, 'frozen', False):
    _SCRIPT_DIR = os.path.dirname(os.path.realpath(sys.executable))
else:
    _SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

_BUNDLED_FFMPEG = os.path.join(_SCRIPT_DIR, "ffmpeg")
GROQ_API_URL    = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_MODEL      = "whisper-large-v3"
MAX_BYTES       = 24 * 1024 * 1024   # 24 MB (Groq limit = 25 MB)


def log(msg):
    pass  # Silenced so we can see the actual error in the 100 chars limit


# ── ffmpeg ────────────────────────────────────────────────────────────────────
def find_ffmpeg():
    for p in [_BUNDLED_FFMPEG,
              os.path.join(TOOLS_DIR, "ffmpeg"),
              shutil.which("ffmpeg") or "",
              "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"]:
        if p and os.path.isfile(p) and os.access(p, os.X_OK):
            return p
    return None


def download_ffmpeg():
    import urllib.request, zipfile, platform
    arch = platform.machine()
    sources = {
        "arm64":  [("https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-arm64", "bin")],
        "x86_64": [("https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-x64",  "bin")],
    }.get(arch, [])
    os.makedirs(TOOLS_DIR, exist_ok=True)
    out = os.path.join(TOOLS_DIR, "ffmpeg")
    for url, fmt in sources:
        try:
            log("Downloading ffmpeg...")
            if fmt == "bin":
                urllib.request.urlretrieve(url, out)
            else:
                tmp = out + ".zip"
                urllib.request.urlretrieve(url, tmp)
                with zipfile.ZipFile(tmp) as z:
                    for m in z.namelist():
                        if os.path.basename(m) == "ffmpeg":
                            with z.open(m) as s, open(out, "wb") as d: d.write(s.read())
                os.unlink(tmp)
            os.chmod(out, 0o755)
            subprocess.run(["xattr", "-d", "com.apple.quarantine", out], stderr=subprocess.DEVNULL)
            return out
        except Exception as e:
            log("ffmpeg download failed: " + str(e))
    raise Exception("Could not download ffmpeg")


def extract_audio(ffmpeg, inp, out, start=None, end=None):
    cmd = [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-i", inp]
    if start and start > 0: cmd += ["-ss", f"{start:.3f}"]
    if end   and end   > 0: cmd += ["-to", f"{end:.3f}"]
    cmd += ["-ac", "1", "-ar", "16000", "-b:a", "64k", out]
    subprocess.run(cmd, check=True)


def audio_duration(ffmpeg, path):
    r = subprocess.run([ffmpeg, "-i", path, "-hide_banner"],
                       stderr=subprocess.PIPE, stdout=subprocess.DEVNULL)
    for line in r.stderr.decode(errors="replace").splitlines():
        if "Duration:" in line:
            t = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = t.split(":"); return float(h)*3600 + float(m)*60 + float(s)
    return 0


# ── Groq API ──────────────────────────────────────────────────────────────────
def groq_call(path, api_key, language):
    import urllib.request
    import urllib.error
    import uuid
    log(f"Groq API → {os.path.getsize(path)//1024} KB")

    boundary = uuid.uuid4().hex
    headers = {
        "Authorization": "Bearer " + api_key,
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "User-Agent": "EditFlowPro/1.0"
    }

    # All languages use the transcriptions endpoint.
    # English translation uses language=en with short chunking (see transcribe()).
    api_url = GROQ_API_URL

    data = {
        "model": GROQ_MODEL,
        "response_format": "verbose_json",
        "temperature": "0"
    }
    if language and language != "auto":
        data["language"] = language

    body = bytearray()
    for k, v in data.items():
        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode("utf-8"))

    # timestamp_granularities — request word + segment level timestamps
    body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"timestamp_granularities[]\"\r\n\r\nword\r\n".encode("utf-8"))
    body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"timestamp_granularities[]\"\r\n\r\nsegment\r\n".encode("utf-8"))

    filename = os.path.basename(path)
    body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: audio/mpeg\r\n\r\n".encode("utf-8"))

    with open(path, "rb") as f:
        body.extend(f.read())

    body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(api_url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="replace")
        raise Exception(f"Groq {e.code}: {err_msg[:300]}")
    except Exception as e:
        raise Exception(f"Groq request failed: {str(e)}")


def transcribe(ffmpeg, mp3, api_key, language):
    is_english = (language == "en")
    dur = audio_duration(ffmpeg, mp3)

    # For English: chunk into ~15s segments to prevent Whisper's
    # early-stopping bug. For other languages: only chunk when >24 MB.
    CHUNK_SECS = 15 if is_english else 9999
    if is_english and dur > CHUNK_SECS:
        n = math.ceil(dur / CHUNK_SECS)
        log(f"English: splitting {dur:.1f}s into {n} chunks of ~{CHUNK_SECS}s")
    elif os.path.getsize(mp3) > MAX_BYTES:
        n = math.ceil(os.path.getsize(mp3) / MAX_BYTES)
        log(f"Audio >24 MB — splitting into {n} chunks")
    else:
        return [groq_call(mp3, api_key, language)]

    cdur = dur / n
    results = []
    for i in range(n):
        s, e  = i * cdur, min((i+1) * cdur, dur)
        chunk = mp3.replace(".mp3", f"_c{i}.mp3")
        subprocess.run([ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
                        "-i", mp3, "-ss", f"{s:.3f}", "-to", f"{e:.3f}",
                        "-c", "copy", chunk], check=True)
        res = groq_call(chunk, api_key, language)
        os.unlink(chunk)
        offset = s
        for w in (res.get("words") or []): w["start"] += offset; w["end"] += offset
        for g in (res.get("segments") or []): g["start"] += offset; g["end"] += offset
        results.append(res)
    return results


# ── Output builders ───────────────────────────────────────────────────────────
def build_efp(results, out_base):
    segs, lang, dur = [], "unknown", 0
    for r in results:
        lang = r.get("language", lang) or lang
        dur  = max(dur, r.get("duration") or 0)
        words = r.get("words") or []
        for g in (r.get("segments") or []):
            gs, ge = g.get("start",0), g.get("end",0)
            raw_wlist = [{"start": round(w["start"],3), "end": round(w["end"],3),
                       "text": w.get("word","").strip()}
                      for w in words if gs <= w.get("start",0) <= ge]
            # Split any multi-word entries into individual words.
            # Groq sometimes groups 2-3 words into one "word" field.
            w_list = []
            for entry in raw_wlist:
                parts = entry["text"].split()
                if len(parts) <= 1:
                    w_list.append(entry)
                else:
                    # Distribute duration equally among sub-words
                    sub_dur = (entry["end"] - entry["start"]) / len(parts)
                    for pi, p in enumerate(parts):
                        w_list.append({
                            "start": round(entry["start"] + pi * sub_dur, 3),
                            "end":   round(entry["start"] + (pi+1) * sub_dur, 3),
                            "text":  p
                        })
            # ── Clamp stretched words ──
            # Whisper sometimes assigns all remaining duration to the last word.
            # Cap any single word to max 3 seconds.
            MAX_WORD_DUR = 3.0
            for wi, wd in enumerate(w_list):
                if wd["end"] - wd["start"] > MAX_WORD_DUR:
                    wd["end"] = round(wd["start"] + MAX_WORD_DUR, 3)
            # Recalculate segment end based on actual last word
            if w_list:
                actual_end = max(w["end"] for w in w_list)
                ge = max(ge, actual_end)
                # If segment text has very few words but spans a long time,
                # trim segment end to match actual speech
                word_count = len(g.get("text","").split())
                if word_count <= 3 and (ge - gs) > 8.0:
                    ge = actual_end
            segs.append({"start": round(gs,3), "end": round(ge,3),
                         "text": g.get("text","").strip(), "words": w_list})
    path = out_base + ".efp.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"language": lang, "duration": round(dur,3), "segments": segs},
                  f, ensure_ascii=False, indent=2)
    return path, segs, lang, dur


def build_srt(segs, out_base):
    def ts(t):
        h,m,s,ms = int(t//3600),int(t%3600//60),int(t%60),int(t*1000%1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    lines = []
    for i, g in enumerate(segs, 1):
        lines += [str(i), f"{ts(g['start'])} --> {ts(g['end'])}", g["text"], ""]
    p = out_base + ".srt"
    with open(p, "w", encoding="utf-8") as f: f.write("\n".join(lines))
    return p


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input"); ap.add_argument("output")
    ap.add_argument("--lang",    default="auto")
    ap.add_argument("--model",   default="large")   # ignored — always large-v3
    ap.add_argument("--api-key", default="", dest="api_key")
    ap.add_argument("--start",   type=float, default=None)
    ap.add_argument("--end",     type=float, default=None)
    args = ap.parse_args()

    def err(msg):
        json.dump({"status": "error", "message": msg}, sys.stdout, ensure_ascii=False)
        sys.exit(2)

    if not os.path.exists(args.input): err("Input file not found")

    api_key = args.api_key or os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        err("Groq API key missing — open Settings and enter your free key from console.groq.com")

    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        try: ffmpeg = download_ffmpeg()
        except Exception as e: err("ffmpeg not found: " + str(e))

    os.makedirs(os.path.dirname(os.path.abspath(args.output)) or ".", exist_ok=True)
    mp3 = args.output + ".mp3"

    log("Extracting audio...")
    try: extract_audio(ffmpeg, args.input, mp3, args.start, args.end)
    except subprocess.CalledProcessError: err("Audio extraction failed")

    try:
        results = transcribe(ffmpeg, mp3, api_key, args.lang)
    except Exception as e:
        err(str(e))
    finally:
        try: os.unlink(mp3)
        except: pass

    json_path, segs, lang, dur = build_efp(results, args.output)
    srt_path = build_srt(segs, args.output)
    total_words = sum(len(s.get("words",[])) for s in segs)

    json.dump({"status": "success", "segments": len(segs), "words": total_words,
               "language": lang, "duration": dur,
               "json": json_path, "srt": srt_path}, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    try:
        main()
    except BaseException as e:
        import traceback
        err_msg = traceback.format_exc().strip().split("\n")[-1]  # Get the actual Exception line
        json.dump({"status": "error", "message": f"CRASH: {err_msg}"}, sys.stdout, ensure_ascii=False)
        sys.exit(2)
