#!/usr/bin/env python3
"""
silence_detector.py — EditFlow Pro

Runs ffmpeg silencedetect on a media file and writes a JSON of silence
ranges (in seconds) plus the corresponding "keep segments". The CEP
panel reads this JSON and forwards the cut points to the JSX QE razor.

Usage:
    silence_detector.py <input> <output.json> [--noise -30] [--min 0.5]
                                              [--pad 0.05]

Output JSON:
{
  "duration": 123.456,
  "noise_db": -30,
  "min_silence": 0.5,
  "padding": 0.05,
  "silences": [{"start": 1.234, "end": 2.890}, ...],
  "keep":     [{"start": 0.0,   "end": 1.234}, ...]
}
"""
import sys
import os
import re
import json
import shutil
import argparse
import subprocess


def find_ffmpeg():
    p = shutil.which("ffmpeg")
    if p:
        return p
    for c in ("/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"):
        if os.path.exists(c):
            return c
    return None


def probe_duration(ffmpeg, path):
    proc = subprocess.run(
        [ffmpeg, "-i", path, "-hide_banner"],
        stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True
    )
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", proc.stderr)
    if not m:
        return 0.0
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)


def detect_silences(ffmpeg, path, noise_db, min_silence):
    """Run ffmpeg silencedetect and return list of (start, end) tuples."""
    cmd = [
        ffmpeg, "-hide_banner", "-nostats", "-i", path,
        "-af", "silencedetect=noise={}dB:d={}".format(noise_db, min_silence),
        "-f", "null", "-"
    ]
    proc = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    out = proc.stderr

    starts, ends = [], []
    for line in out.splitlines():
        sm = re.search(r"silence_start:\s*([-\d.]+)", line)
        em = re.search(r"silence_end:\s*([-\d.]+)", line)
        if sm:
            starts.append(float(sm.group(1)))
        if em:
            ends.append(float(em.group(1)))

    pairs = []
    for i in range(min(len(starts), len(ends))):
        s, e = starts[i], ends[i]
        if e > s:
            pairs.append((s, e))
    return pairs


def probe_volume(ffmpeg, path):
    """Run ffmpeg volumedetect to learn mean/peak dB. Returns (mean_db, max_db)
    or (None, None) on failure."""
    cmd = [ffmpeg, "-hide_banner", "-nostats", "-i", path,
           "-af", "volumedetect", "-f", "null", "-"]
    proc = subprocess.run(cmd, stderr=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    mean_db, max_db = None, None
    for line in proc.stderr.splitlines():
        m = re.search(r"mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB", line)
        if m:
            mean_db = float(m.group(1))
        m = re.search(r"max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB", line)
        if m:
            max_db = float(m.group(1))
    return mean_db, max_db


def suggest_threshold(mean_db, max_db):
    """Pick threshold 8 dB below the mean — sits in the gap between
    speech (near mean) and room-tone/pauses (much quieter than mean)."""
    if mean_db is None:
        return None
    candidate = round(mean_db - 8.0)
    # Never louder than -15 (would shred speech) or quieter than -55 (useless)
    if candidate > -15:
        candidate = -15
    if candidate < -55:
        candidate = -55
    return candidate


def apply_padding(silences, padding, duration):
    """Shrink each silence by `padding` seconds on each side so we don't
    cut into the speech that immediately neighbors it."""
    out = []
    for s, e in silences:
        s2 = max(0.0, s + padding)
        e2 = min(duration, e - padding)
        if e2 > s2 + 0.05:  # ignore <50ms slivers
            out.append((round(s2, 3), round(e2, 3)))
    return out


def build_keep_segments(silences, duration):
    """Invert silence ranges to get the "keep" segments."""
    keep = []
    cursor = 0.0
    for s, e in silences:
        if s > cursor + 0.01:
            keep.append((round(cursor, 3), round(s, 3)))
        cursor = e
    if duration > cursor + 0.01:
        keep.append((round(cursor, 3), round(duration, 3)))
    return keep


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--noise", type=float, default=-30.0,
                    help="Silence threshold in dB (default: -30)")
    ap.add_argument("--min", dest="min_silence", type=float, default=0.5,
                    help="Minimum silence duration in seconds (default: 0.5)")
    ap.add_argument("--pad", type=float, default=0.05,
                    help="Padding kept on each side of speech in seconds (default: 0.05)")
    args = ap.parse_args()

    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        json.dump({"status": "error", "message": "ffmpeg not found"}, sys.stdout)
        sys.exit(2)

    if not os.path.exists(args.input):
        json.dump({"status": "error", "message": "input not found: " + args.input}, sys.stdout)
        sys.exit(2)

    duration = probe_duration(ffmpeg, args.input)
    raw = detect_silences(ffmpeg, args.input, args.noise, args.min_silence)
    silences = apply_padding(raw, args.pad, duration)
    keep = build_keep_segments(silences, duration)

    # Always probe volume so the panel can give actionable feedback
    mean_db, max_db = probe_volume(ffmpeg, args.input)
    suggested = suggest_threshold(mean_db, max_db)

    payload = {
        "status": "success",
        "duration": round(duration, 3),
        "noise_db": args.noise,
        "min_silence": args.min_silence,
        "padding": args.pad,
        "mean_volume_db": mean_db,
        "max_volume_db": max_db,
        "suggested_noise_db": suggested,
        "silences": [{"start": s, "end": e} for s, e in silences],
        "keep": [{"start": s, "end": e} for s, e in keep],
    }

    with open(args.output, "w") as f:
        json.dump(payload, f, indent=2)

    summary = {
        "status": "success",
        "silences_count": len(silences),
        "keep_count": len(keep),
        "duration": payload["duration"],
        "mean_volume_db": mean_db,
        "max_volume_db": max_db,
        "suggested_noise_db": suggested,
        "output": args.output,
    }
    json.dump(summary, sys.stdout)


if __name__ == "__main__":
    main()
