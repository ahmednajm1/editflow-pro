#!/usr/bin/env python3
"""
transcriber.py — EditFlow Pro

Transcribes a media file using whisper.cpp (whisper-cli) and produces:
  - <output>.json  : structured timeline with segments + word-level timestamps
  - <output>.srt   : standard SubRip subtitles (importable into Premiere)

Why whisper-cpp? It is a single native binary, no Python dependency
chain to ship to end users, runs fast on Apple Silicon via Metal,
and supports the same models as openai-whisper.

Usage:
    transcriber.py <input> <output_basename> [--lang auto] [--model small]

Models (auto-downloaded on first use):
    tiny   ~75 MB  — fastest, decent for English
    base   ~140 MB — fast, good baseline
    small  ~460 MB — balanced (default)
    medium ~1.5 GB — accurate
    large  ~3 GB   — best, slow

Stdout (one-line JSON summary):
    {"status":"success","segments":N,"words":M,"language":"ar",
     "duration":12.34,"json":"...","srt":"..."}
"""
import sys
import os
import re
import json
import shutil
import argparse
import subprocess
import urllib.request

MODEL_URLS = {
    "tiny":   "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
    "base":   "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
    "small":  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
    "medium": "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin",
    "large":  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin",
}

MODELS_DIR = os.path.expanduser("~/Library/Application Support/EditFlowPro/whisper_models")


def find_whisper_cli():
    for name in ("whisper-cli", "whisper-cpp", "main"):
        p = shutil.which(name)
        if p:
            return p
    for c in (
        "/opt/homebrew/bin/whisper-cli",
        "/opt/homebrew/bin/whisper-cpp",
        "/usr/local/bin/whisper-cli",
        "/usr/local/bin/whisper-cpp",
    ):
        if os.path.exists(c):
            return c
    return None


def find_ffmpeg():
    p = shutil.which("ffmpeg")
    if p:
        return p
    for c in ("/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"):
        if os.path.exists(c):
            return c
    return None


def ensure_model(model_name):
    """Make sure the GGML model file is on disk; download once if missing."""
    if not os.path.isdir(MODELS_DIR):
        os.makedirs(MODELS_DIR, exist_ok=True)
    target = os.path.join(MODELS_DIR, "ggml-{}.bin".format(model_name))
    if os.path.exists(target) and os.path.getsize(target) > 1_000_000:
        return target
    url = MODEL_URLS.get(model_name)
    if not url:
        raise SystemExit("Unknown model: " + model_name)
    sys.stderr.write("Downloading {} model from HuggingFace...\n".format(model_name))
    tmp = target + ".part"
    urllib.request.urlretrieve(url, tmp)
    os.rename(tmp, target)
    return target


def extract_audio(ffmpeg, input_path, wav_path):
    """Whisper expects 16 kHz mono PCM. ffmpeg handles any source format."""
    cmd = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-i", input_path,
        "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le",
        wav_path,
    ]
    subprocess.run(cmd, check=True)


def run_whisper(whisper_cli, model_path, wav_path, lang, output_basename):
    """Invoke whisper-cli and ask it to emit BOTH .json (with word timestamps)
    and .srt. whisper-cli writes them next to the WAV by default; we redirect
    the basename via -of."""
    cmd = [
        whisper_cli,
        "-m", model_path,
        "-f", wav_path,
        "-of", output_basename,
        "--output-json-full",   # includes word-level timestamps + confidence
        "--output-srt",
        "--max-len", "42",      # ~42 chars per subtitle line (readable)
        "--print-progress",
    ]
    if lang and lang != "auto":
        cmd += ["-l", lang]
    proc = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise RuntimeError("whisper-cli failed: " + (proc.stderr or proc.stdout)[:500])
    return proc.stderr  # progress logs end up here


def normalize_json(raw_json_path, normalized_json_path):
    """whisper-cli emits a verbose schema; we flatten it into a small,
    panel-friendly shape:
        {
          "language": "ar",
          "duration": 12.34,
          "segments": [
            {"start": 0.0, "end": 1.2, "text": "...",
             "words":[{"start":0.0,"end":0.4,"text":"...","p":0.97}, ...]}
          ]
        }
    """
    with open(raw_json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # whisper-cli schema has 'transcription' as list of segments
    raw_segments = data.get("transcription", [])
    language = (data.get("result") or {}).get("language") or data.get("language") or "auto"

    segments = []
    total_words = 0
    last_end = 0.0
    for seg in raw_segments:
        # offsets are in milliseconds in whisper-cli JSON
        s = (seg.get("offsets") or {}).get("from", 0) / 1000.0
        e = (seg.get("offsets") or {}).get("to", 0) / 1000.0
        text = (seg.get("text") or "").strip()
        words_raw = seg.get("tokens") or []
        words = []
        for w in words_raw:
            wt = (w.get("text") or "").strip()
            if not wt or wt.startswith("[") or wt.startswith("<"):
                continue  # skip special tokens like [_BEG_], <|...|>
            ws = (w.get("offsets") or {}).get("from", 0) / 1000.0
            we = (w.get("offsets") or {}).get("to", 0) / 1000.0
            p = w.get("p")
            words.append({"start": round(ws, 3), "end": round(we, 3),
                          "text": wt, "p": round(p, 3) if p is not None else None})
        total_words += len(words)
        last_end = max(last_end, e)
        segments.append({"start": round(s, 3), "end": round(e, 3),
                         "text": text, "words": words})

    out = {
        "language": language,
        "duration": round(last_end, 3),
        "segments": segments,
    }
    with open(normalized_json_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    return out, total_words


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", help="Media file (any format ffmpeg reads)")
    ap.add_argument("output", help="Output basename (no extension)")
    ap.add_argument("--lang", default="auto", help="Language code or 'auto'")
    ap.add_argument("--model", default="small",
                    choices=list(MODEL_URLS.keys()),
                    help="Whisper model size (default: small)")
    args = ap.parse_args()

    if not os.path.exists(args.input):
        json.dump({"status": "error", "message": "input not found"}, sys.stdout)
        sys.exit(2)

    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        json.dump({"status": "error", "message": "ffmpeg not found"}, sys.stdout)
        sys.exit(2)

    whisper_cli = find_whisper_cli()
    if not whisper_cli:
        json.dump({"status": "error",
                   "message": "whisper-cli not found. Run: brew install whisper-cpp"},
                  sys.stdout)
        sys.exit(2)

    try:
        model_path = ensure_model(args.model)
    except Exception as e:
        json.dump({"status": "error", "message": "model fetch failed: " + str(e)}, sys.stdout)
        sys.exit(2)

    out_dir = os.path.dirname(os.path.abspath(args.output)) or "."
    os.makedirs(out_dir, exist_ok=True)

    wav_path = args.output + ".wav"
    raw_json_path = args.output + ".json"          # whisper-cli writes here
    normalized_json_path = args.output + ".efp.json"  # our flattened schema
    srt_path = args.output + ".srt"

    try:
        extract_audio(ffmpeg, args.input, wav_path)
    except subprocess.CalledProcessError as e:
        json.dump({"status": "error", "message": "audio extraction failed"}, sys.stdout)
        sys.exit(3)

    try:
        run_whisper(whisper_cli, model_path, wav_path, args.lang, args.output)
    except Exception as e:
        json.dump({"status": "error", "message": str(e)}, sys.stdout)
        sys.exit(4)
    finally:
        try: os.unlink(wav_path)
        except: pass

    if not os.path.exists(raw_json_path):
        json.dump({"status": "error", "message": "no JSON produced"}, sys.stdout)
        sys.exit(5)

    flattened, word_count = normalize_json(raw_json_path, normalized_json_path)

    summary = {
        "status": "success",
        "segments": len(flattened["segments"]),
        "words": word_count,
        "language": flattened["language"],
        "duration": flattened["duration"],
        "json": normalized_json_path,
        "srt": srt_path if os.path.exists(srt_path) else None,
        "raw_json": raw_json_path,
    }
    json.dump(summary, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
