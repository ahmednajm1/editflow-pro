#!/usr/bin/env python3
"""
caption_renderer.py — EditFlow Pro

Renders each caption group as a transparent video clip (QuickTime Animation
with alpha) so that Premiere Pro receives real font, color, and animation
without needing JSX keyframe APIs.

Pipeline:
    EFP JSON → group text by style → Pillow renders frames → ffmpeg → .mov

Dependencies: Pillow, arabic_reshaper, python-bidi (for Arabic text)
"""

import sys, os, json, argparse, subprocess, math, shutil


# ── Font lookup ─────────────────────────────────────────────────
FONT_PATHS = {
    "Arial":              "/System/Library/Fonts/Supplemental/Arial.ttf",
    "Helvetica":          "/System/Library/Fonts/Helvetica.ttc",
    "Impact":             "/System/Library/Fonts/Supplemental/Impact.ttf",
    "Makeen":             "~/Library/Fonts/EFP_Makin.otf",
    "VIP Hala Bold":      "~/Library/Fonts/EFP_VIPHalaBold.otf",
    "Digi Madasi Bold":   "~/Library/Fonts/EFP_DigiMadasiBold.ttf",
    "MadaniArabic-Bold":  "~/Library/Fonts/EFP_MadaniArabicBold.ttf",
    "MadaniArabic-Light": "~/Library/Fonts/EFP_MadaniArabicLight.ttf",
    "MadaniArabic-Thin":  "~/Library/Fonts/EFP_MadaniArabicThin.ttf",
}


def find_font(family):
    if family in FONT_PATHS:
        p = os.path.expanduser(FONT_PATHS[family])
        if os.path.exists(p):
            return p
    for d in ("~/Library/Fonts", "/Library/Fonts",
              "/System/Library/Fonts/Supplemental"):
        d = os.path.expanduser(d)
        if not os.path.isdir(d):
            continue
        key = family.lower().replace(" ", "")
        for f in os.listdir(d):
            if key in f.lower().replace(" ", "").replace("-", "").replace("_", ""):
                return os.path.join(d, f)
    fallback = "/System/Library/Fonts/Supplemental/Arial.ttf"
    return fallback if os.path.exists(fallback) else None


def find_ffmpeg():
    p = shutil.which("ffmpeg")
    if p:
        return p
    for c in ("/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"):
        if os.path.exists(c):
            return c
    return None


# ── Arabic text shaping ─────────────────────────────────────────
def _has_arabic(text):
    for ch in text:
        if ('؀' <= ch <= 'ۿ' or 'ݐ' <= ch <= 'ݿ'
                or 'ﭐ' <= ch <= '﷿' or 'ﹰ' <= ch <= '﻿'):
            return True
    return False


def shape_text(text):
    if not _has_arabic(text):
        return text
    try:
        import arabic_reshaper
        from bidi.algorithm import get_display
        return get_display(arabic_reshaper.reshape(text))
    except ImportError:
        return text


# ── Helpers ──────────────────────────────────────────────────────
def hex_to_rgba(h):
    h = h.lstrip('#')
    if len(h) >= 6:
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)
    return (255, 255, 255, 255)


def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


def ease_out(t):
    return 1.0 - (1.0 - clamp(t)) ** 3


def ease_out_elastic(t):
    t = clamp(t)
    if t == 0 or t == 1:
        return t
    return pow(2, -10 * t) * math.sin((t * 10 - 0.75) * (2 * math.pi) / 3) + 1


# ── Grouping ─────────────────────────────────────────────────────
def build_groups(segments, style):
    def words(s):
        return (s or "").strip().split() if (s or "").strip() else []

    groups = []
    if style == "line":
        for seg in segments:
            t = (seg.get("text") or "").strip()
            if t:
                groups.append(dict(start=seg["start"], end=seg["end"], text=t))
    else:
        flat = []
        for seg in segments:
            ws = words(seg.get("text", ""))
            if not ws:
                continue
            dur = seg["end"] - seg["start"]
            per = dur / len(ws)
            for i, w in enumerate(ws):
                flat.append(dict(text=w,
                                 start=seg["start"] + i * per,
                                 end=seg["start"] + (i + 1) * per))
        if style == "word":
            groups = flat
        else:
            step = 4
            for k in range(0, len(flat), step):
                chunk = flat[k:k + step]
                groups.append(dict(start=chunk[0]["start"],
                                   end=chunk[-1]["end"],
                                   text=" ".join(w["text"] for w in chunk)))
    return groups


# ── Animation parameter calculator ──────────────────────────────
def anim_params(kind, t, dur):
    """Return (opacity 0-1, scale_factor, offset_x, offset_y)."""
    o, s, ox, oy = 1.0, 1.0, 0, 0

    if kind == "none":
        pass

    elif kind == "fade":
        fi, fo = 0.25, 0.25
        if t < fi:
            o = ease_out(t / fi)
        elif t > dur - fo:
            o = ease_out((dur - t) / fo)

    elif kind == "pop":
        d = 0.25
        if t < d:
            p = ease_out(t / d)
            s = p * 1.15 if t < d * 0.5 else 1.0 + 0.15 * (1.0 - (t - d * 0.5) / (d * 0.5))
            o = clamp(t / (d * 0.4))

    elif kind == "slide-up":
        d = 0.3
        if t < d:
            p = ease_out(t / d)
            oy = int(50 * (1 - p))
            o = p

    elif kind == "bounce":
        d = 0.5
        if t < d:
            p = clamp(t / d)
            s = ease_out_elastic(p)
            o = clamp(t / 0.08)

    elif kind == "karaoke":
        d = 0.18
        if t < d:
            p = ease_out(t / d)
            s = 0.5 + 0.6 * p if t < d * 0.5 else 1.1 - 0.1 * ((t - d * 0.5) / (d * 0.5))
            o = clamp(t / (d * 0.3))

    elif kind == "typewriter":
        pass  # handled in render_clip

    elif kind == "shake":
        o = clamp(t / 0.08)
        if t < 0.35:
            import random
            random.seed(int(t * 1000))
            ox = random.randint(-4, 4)
            oy = random.randint(-3, 3)

    elif kind == "glow":
        o = 0.75 + 0.25 * math.sin(t * 8)
        if t < 0.2:
            o *= ease_out(t / 0.2)

    return (clamp(o), max(0.01, s), ox, oy)


# ── Frame renderer ───────────────────────────────────────────────
def render_clip(ffmpeg, text, font_path, font_size, color_rgba,
                highlight_rgba, anim, duration, fps, width, height,
                output_path):
    from PIL import Image, ImageDraw, ImageFont

    try:
        base_font = ImageFont.truetype(font_path, font_size)
    except Exception:
        base_font = ImageFont.load_default()

    display_text = shape_text(text)
    n_frames = max(2, int(math.ceil(duration * fps)))
    use_color = highlight_rgba if anim == "karaoke" else color_rgba

    cmd = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-f", "rawvideo", "-pixel_format", "rgba",
        "-video_size", "{}x{}".format(width, height),
        "-framerate", str(fps),
        "-i", "pipe:",
        "-c:v", "qtrle", "-pix_fmt", "argb",
        "-frames:v", str(n_frames),
        output_path,
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)

    cx = width // 2
    cy = int(height * 0.82)
    shadow_offsets = [(-2, -1), (2, -1), (-2, 1), (2, 1),
                      (0, -2), (0, 2), (-2, 0), (2, 0)]

    font_cache = {}

    def get_font(sz):
        sz = max(8, sz)
        if sz not in font_cache:
            try:
                font_cache[sz] = ImageFont.truetype(font_path, sz)
            except Exception:
                font_cache[sz] = base_font
        return font_cache[sz]

    for f_idx in range(n_frames):
        t = f_idx / fps
        opacity, scale, ox, oy = anim_params(anim, t, duration)

        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        if anim == "typewriter":
            chars_total = len(display_text)
            if chars_total > 0:
                chars_per_sec = chars_total / max(0.3, duration * 0.65)
                visible = min(chars_total, int(t * chars_per_sec) + 1)
                render_text = display_text[:visible]
            else:
                render_text = ""
            if t < 0.08:
                opacity = clamp(t / 0.08)
        else:
            render_text = display_text

        if not render_text or not render_text.strip():
            proc.stdin.write(img.tobytes())
            continue

        draw_font = get_font(int(font_size * scale)) if abs(scale - 1.0) > 0.02 else base_font
        alpha = int(opacity * 255)
        x = cx + ox
        y = cy + oy

        sa = int(alpha * 0.7)
        sc = (0, 0, 0, sa)
        for sox, soy in shadow_offsets:
            draw.text((x + sox, y + soy), render_text,
                      font=draw_font, fill=sc, anchor='mm')

        tc = (use_color[0], use_color[1], use_color[2], alpha)
        draw.text((x, y), render_text, font=draw_font, fill=tc, anchor='mm')

        proc.stdin.write(img.tobytes())

    try:
        proc.stdin.flush()
    except Exception:
        pass
    proc.stdin.close()
    proc.wait()
    if proc.returncode != 0:
        stderr = proc.stderr.read() if proc.stderr else b""
        sys.stderr.write("ffmpeg error: {}\n".format(stderr.decode(errors='replace')[:200]))
    return proc.returncode == 0


# ── Main ─────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("efp_json", help="Path to .efp.json transcript")
    ap.add_argument("output_dir", help="Directory for rendered clips")
    ap.add_argument("--config", default="{}", help="JSON config string")
    args = ap.parse_args()

    try:
        cfg = json.loads(args.config)
    except Exception:
        cfg = {}

    font_family = cfg.get("font", "Arial")
    font_size   = int(cfg.get("size", 72))
    color       = hex_to_rgba(cfg.get("color", "#FFFFFF"))
    highlight   = hex_to_rgba(cfg.get("highlight", "#1F8FFF"))
    style       = cfg.get("style", "phrase")
    anim        = cfg.get("animation", "none")
    width       = int(cfg.get("width", 1920))
    height      = int(cfg.get("height", 1080))
    fps         = 20

    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        json.dump({"status": "error", "message": "ffmpeg not found"}, sys.stdout)
        return

    font_path = find_font(font_family)
    if not font_path:
        json.dump({"status": "error",
                   "message": "Font not found: " + font_family}, sys.stdout)
        return

    try:
        with open(args.efp_json, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        json.dump({"status": "error",
                   "message": "Cannot read JSON: " + str(e)}, sys.stdout)
        return

    groups = build_groups(data.get("segments", []), style)
    if not groups:
        json.dump({"status": "error", "message": "No caption groups"}, sys.stdout)
        return

    os.makedirs(args.output_dir, exist_ok=True)
    clips = []
    failed = 0

    total = len(groups)
    for i, g in enumerate(groups):
        dur = g["end"] - g["start"]
        if dur < 0.15:
            dur = 0.5
        out = os.path.join(args.output_dir, "cap_{:04d}.mov".format(i + 1))

        ok = render_clip(ffmpeg, g["text"], font_path, font_size,
                         color, highlight, anim, dur, fps,
                         width, height, out)
        if ok and os.path.exists(out):
            clips.append({"path": out,
                          "start": round(g["start"], 3),
                          "end": round(g["end"], 3),
                          "text": g["text"]})
        else:
            failed += 1

        if (i + 1) % 10 == 0 or i == total - 1:
            sys.stderr.write("Rendered {}/{}\n".format(i + 1, total))

    json.dump({
        "status": "success",
        "clips": clips,
        "total": total,
        "rendered": len(clips),
        "failed": failed,
        "font": font_family,
        "animation": anim,
    }, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
