#!/usr/bin/env python3
"""
transcriber.py — EditFlow Pro
Cloud transcription via Groq Whisper API (whisper-large-v3).
No local model. Works on any machine with internet.
"""
import sys, os, json, argparse, subprocess, shutil, math, re

import platform
if platform.system() == "Windows":
    TOOLS_DIR = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "EditFlowPro", "tools")
else:
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
    is_win = (platform.system() == "Windows")
    ext = ".exe" if is_win else ""
    
    # Check bundled paths and environment
    bundled = _BUNDLED_FFMPEG + ext
    tools_path = os.path.join(TOOLS_DIR, "ffmpeg" + ext)
    
    paths = [
        bundled,
        tools_path,
        shutil.which("ffmpeg") or ""
    ]
    if not is_win:
        paths += ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"]
        
    for p in paths:
        if p and os.path.isfile(p):
            if is_win or os.access(p, os.X_OK):
                return p
    return None


def download_ffmpeg():
    import urllib.request, zipfile
    is_win = (platform.system() == "Windows")
    ext = ".exe" if is_win else ""
    arch = platform.machine()
    
    if is_win:
        sources = [("https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64", "bin")]
    else:
        sources = {
            "arm64":  [("https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-arm64", "bin")],
            "x86_64": [("https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-x64",  "bin")],
        }.get(arch, [])
        
    os.makedirs(TOOLS_DIR, exist_ok=True)
    out = os.path.join(TOOLS_DIR, "ffmpeg" + ext)
    
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
            
            if not is_win:
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
def groq_call(path, api_key, language, _attempt=1):
    import urllib.request
    import urllib.error
    import uuid
    import time
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
        body_txt = e.read().decode("utf-8", errors="replace")
        # Transient errors (rate limit / server) → back off and retry a few times.
        if e.code in (429, 500, 502, 503, 529) and _attempt < 5:
            time.sleep(min(2 ** _attempt, 20))
            return groq_call(path, api_key, language, _attempt + 1)
        raise Exception(f"Groq {e.code}: {body_txt[:300]}")
    except urllib.error.URLError as e:
        # Network blip → retry a couple of times before giving up.
        if _attempt < 3:
            time.sleep(2 * _attempt)
            return groq_call(path, api_key, language, _attempt + 1)
        raise Exception(f"Groq request failed: {str(e)}")


def detect_language(ffmpeg, mp3, api_key):
    """Probe the real spoken language from a short sample.

    Forcing the wrong `language` is far more damaging than leaving it unset:
    Whisper will dutifully render the audio in the requested script, producing
    fluent-looking nonsense (German speech written in Arabic letters gave us
    "الديسكورس" for Diskurs and "جروبات" for Gruppen). A 60s probe costs one
    cheap call and removes that entire failure mode.
    """
    probe = None
    try:
        base, ext = os.path.splitext(mp3)
        probe = f"{base}_probe{ext}"
        subprocess.run([ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
                        "-i", mp3, "-t", "60", "-c", "copy", probe], check=True)
        res = groq_call(probe, api_key, "auto")   # "auto" omits the language field
        return (res.get("language") or "").strip().lower()
    except Exception as e:
        log(f"language probe failed ({e}); continuing without it")
        return ""
    finally:
        if probe and os.path.exists(probe):
            try: os.unlink(probe)
            except Exception: pass


# Whisper reports languages by English name; map the ones we expose to their codes.
LANG_NAME_TO_CODE = {
    "afrikaans": "af",
    "amharic": "am",
    "arabic": "ar",
    "assamese": "as",
    "azerbaijani": "az",
    "bashkir": "ba",
    "belarusian": "be",
    "bulgarian": "bg",
    "bengali": "bn",
    "tibetan": "bo",
    "breton": "br",
    "bosnian": "bs",
    "catalan": "ca",
    "czech": "cs",
    "welsh": "cy",
    "danish": "da",
    "german": "de",
    "greek": "el",
    "english": "en",
    "spanish": "es",
    "estonian": "et",
    "basque": "eu",
    "persian": "fa",
    "finnish": "fi",
    "faroese": "fo",
    "french": "fr",
    "galician": "gl",
    "gujarati": "gu",
    "hausa": "ha",
    "hawaiian": "haw",
    "hebrew": "he",
    "hindi": "hi",
    "croatian": "hr",
    "haitian creole": "ht",
    "hungarian": "hu",
    "armenian": "hy",
    "indonesian": "id",
    "icelandic": "is",
    "italian": "it",
    "japanese": "ja",
    "javanese": "jw",
    "georgian": "ka",
    "kazakh": "kk",
    "khmer": "km",
    "kannada": "kn",
    "korean": "ko",
    "latin": "la",
    "luxembourgish": "lb",
    "lingala": "ln",
    "lao": "lo",
    "lithuanian": "lt",
    "latvian": "lv",
    "malagasy": "mg",
    "maori": "mi",
    "macedonian": "mk",
    "malayalam": "ml",
    "mongolian": "mn",
    "marathi": "mr",
    "malay": "ms",
    "maltese": "mt",
    "myanmar": "my",
    "nepali": "ne",
    "dutch": "nl",
    "nynorsk": "nn",
    "norwegian": "no",
    "occitan": "oc",
    "punjabi": "pa",
    "polish": "pl",
    "pashto": "ps",
    "portuguese": "pt",
    "romanian": "ro",
    "russian": "ru",
    "sanskrit": "sa",
    "sindhi": "sd",
    "sinhala": "si",
    "slovak": "sk",
    "slovenian": "sl",
    "shona": "sn",
    "somali": "so",
    "albanian": "sq",
    "serbian": "sr",
    "sundanese": "su",
    "swedish": "sv",
    "swahili": "sw",
    "tamil": "ta",
    "telugu": "te",
    "tajik": "tg",
    "thai": "th",
    "turkmen": "tk",
    "tagalog": "tl",
    "turkish": "tr",
    "tatar": "tt",
    "ukrainian": "uk",
    "urdu": "ur",
    "uzbek": "uz",
    "vietnamese": "vi",
    "yiddish": "yi",
    "yoruba": "yo",
    "chinese": "zh",
}


def transcribe(ffmpeg, mp3, api_key, language):
    is_english = (language == "en")
    dur = audio_duration(ffmpeg, mp3)
    size = os.path.getsize(mp3)

    # English is capped to ~5 min chunks to avoid Whisper's early-stopping on
    # long audio — but NOT smaller, or a long clip explodes into dozens of API
    # calls that hit Groq's rate limit (a 25 min clip at 25s = 60+ calls → the
    # whole job fails). 300s keeps even a 1 hr clip to ~12 calls. Other
    # languages only split when the file exceeds Groq's 24 MB limit.
    CHUNK_SECS = 300 if is_english else 9999
    need_chunk = (dur > CHUNK_SECS) or (size > MAX_BYTES)
    if not need_chunk:
        return [groq_call(mp3, api_key, language)]
    n_dur  = math.ceil(dur / CHUNK_SECS) if dur > 0 else 1
    n_size = math.ceil(size / MAX_BYTES)
    n = max(n_dur, n_size, 1)
    log(f"Splitting {dur:.1f}s / {size//1024//1024}MB into {n} chunks")

    cdur = dur / n
    results = []
    base, ext = os.path.splitext(mp3)
    for i in range(n):
        s, e  = i * cdur, min((i+1) * cdur, dur)
        chunk = f"{base}_c{i}{ext}"
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
        groups = r.get("segments") or []
        for gi, g in enumerate(groups):
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
            # Some Whisper/Groq responses contain a segment with an empty `text`
            # field even though its timestamped word list contains real speech.
            # Preserve that speech at the top level too, otherwise downstream AI
            # refinement receives an empty string and leaves this interval in the
            # source language.
            segment_text = g.get("text", "").strip()
            if not segment_text and w_list:
                fallback_words = [w["text"] for w in w_list if w.get("text")]
                # Overlapping Whisper boundaries can assign the first word of the
                # next segment to this word list too. Strip a short suffix/prefix
                # overlap so "جوب" + "جوب سنتر" does not become "Job Jobcenter".
                next_text = (groups[gi + 1].get("text", "").strip()
                             if gi + 1 < len(groups) else "")
                next_words = next_text.split()
                def token_key(token):
                    return re.sub(r'^[\s.,!?;:\u060c\u061b\u061f\"\'()\[\]{}-]+|'
                                  r'[\s.,!?;:\u060c\u061b\u061f\"\'()\[\]{}-]+$',
                                  '', token.lower())
                for overlap in range(min(3, len(fallback_words), len(next_words)), 0, -1):
                    tail = [token_key(x) for x in fallback_words[-overlap:]]
                    head = [token_key(x) for x in next_words[:overlap]]
                    if all(tail) and tail == head:
                        del fallback_words[-overlap:]
                        break
                segment_text = " ".join(fallback_words)
            segs.append({"start": round(gs,3), "end": round(ge,3),
                         "text": segment_text, "words": w_list})
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

    # Verify the requested language against what is actually spoken. Forcing the
    # wrong one makes Whisper transliterate rather than fail, which reads as a
    # working transcript full of invented words — the worst kind of silent error.
    effective_lang = args.lang
    lang_warning = ""
    lang_mismatch = None
    detected_code = ""
    detected_name = ""
    if args.lang and args.lang != "auto":
        detected_name = detect_language(ffmpeg, mp3, api_key)
        detected_code = LANG_NAME_TO_CODE.get(detected_name, "")
        if not detected_code:
            # The probe could not identify the audio. Forcing the requested language
            # here is the dangerous option: Whisper would transliterate rather than
            # fail, and downstream we could no longer tell the requested language
            # apart from the spoken one. Let Whisper decide instead.
            effective_lang = "auto"
            log("language probe inconclusive → transcribing with auto-detect")
        elif detected_code != args.lang:
            # Transcribe in the language actually spoken — forcing the requested one
            # makes Whisper transliterate and invent words. But the user picked their
            # language for a reason, so report the mismatch with BOTH codes: the panel
            # turns this into an automatic translation into what they asked for.
            effective_lang = detected_code
            lang_warning = (f"Audio is {detected_name.title()}, not the selected language.")
            lang_mismatch = {"detected": detected_code, "detectedName": detected_name.title(),
                             "requested": args.lang}
            log(f"LANGUAGE MISMATCH: requested={args.lang} detected={detected_code} → using detected")

    try:
        results = transcribe(ffmpeg, mp3, api_key, effective_lang)
    except Exception as e:
        err(str(e))
    finally:
        try: os.unlink(mp3)
        except: pass

    json_path, segs, lang, dur = build_efp(results, args.output)
    srt_path = build_srt(segs, args.output)
    total_words = sum(len(s.get("words",[])) for s in segs)

    json.dump({"status": "success", "segments": len(segs), "words": total_words,
               "language": lang, "duration": dur, "langWarning": lang_warning,
               "langMismatch": lang_mismatch,
               "requestedLang": args.lang, "detectedLang": detected_code or "",
               "detectedName": detected_name.title() if detected_name else "",
               "json": json_path, "srt": srt_path}, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    try:
        main()
    except BaseException as e:
        import traceback
        err_msg = traceback.format_exc().strip().split("\n")[-1]  # Get the actual Exception line
        json.dump({"status": "error", "message": f"CRASH: {err_msg}"}, sys.stdout, ensure_ascii=False)
        sys.exit(2)
