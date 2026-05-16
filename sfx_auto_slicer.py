import os
import glob
import subprocess
import re

SOURCE_DIR = os.path.expanduser("~/Downloads/sound effect")
OUTPUT_DIR = os.path.expanduser("~/Downloads/Split_SFX")

def get_silence_points(filepath):
    # Run ffmpeg silence detection
    # noise=-35dB means anything quieter than -35dB is silence
    # d=0.4 means it must be silent for at least 0.4 seconds to be considered a split point
    command = [
        "ffmpeg", "-i", filepath,
        "-af", "silencedetect=noise=-35dB:d=0.4",
        "-f", "null", "-"
    ]
    
    result = subprocess.run(command, capture_output=True, text=True)
    output = result.stderr # ffmpeg writes to stderr
    
    # Parse silence_start and silence_end
    starts = [float(match.group(1)) for match in re.finditer(r'silence_start:\s*([0-9\.]+)', output)]
    ends = [float(match.group(1)) for match in re.finditer(r'silence_end:\s*([0-9\.]+)', output)]
    
    # Get total duration to find the end of the last chunk
    duration = 0.0
    dur_match = re.search(r'Duration:\s*([0-9]{2}):([0-9]{2}):([0-9\.]+)', output)
    if dur_match:
        h, m, s = float(dur_match.group(1)), float(dur_match.group(2)), float(dur_match.group(3))
        duration = h * 3600 + m * 60 + s

    return starts, ends, duration

def slice_audio(filepath, dest_dir):
    starts, ends, duration = get_silence_points(filepath)
    
    # If no silences found or only 1, just copy the file over as v1
    if not starts or not ends:
        base, ext = os.path.splitext(os.path.basename(filepath))
        out_path = os.path.join(dest_dir, f"{base}_v1{ext}")
        subprocess.run(["ffmpeg", "-y", "-i", filepath, "-c", "copy", out_path], capture_output=True)
        print(f"  -> No splits. Copied as v1.")
        return 1
        
    chunks = []
    
    # Chunk 1: from 0 to the first silence_start
    if starts[0] > 0.1: # Must be at least 0.1s long
        chunks.append((0.0, starts[0] + 0.1)) # Added 0.1s tail buffer just in case
        
    # Middle chunks: from previous silence_end to next silence_start
    for i in range(len(ends)):
        start_time = max(0, ends[i] - 0.05) # Start slightly before silence ends
        
        if i + 1 < len(starts):
            end_time = starts[i+1] + 0.1
        else:
            end_time = duration
            
        # Only add if the chunk is longer than 0.2 seconds
        if end_time - start_time > 0.2:
            chunks.append((start_time, end_time))

    base, ext = os.path.splitext(os.path.basename(filepath))
    
    if len(chunks) <= 1:
        # If chunks logic failed, just copy
        out_path = os.path.join(dest_dir, f"{base}_v1{ext}")
        subprocess.run(["ffmpeg", "-y", "-i", filepath, "-c", "copy", out_path], capture_output=True)
        print(f"  -> Copied as v1.")
        return 1

    # Slice the chunks!
    for idx, (start, end) in enumerate(chunks):
        out_path = os.path.join(dest_dir, f"{base}_v{idx+1}{ext}")
        # -c:a libmp3lame -q:a 2 ensures clean cuts without seeking issues
        cmd = [
            "ffmpeg", "-y",
            "-i", filepath,
            "-ss", str(start),
            "-to", str(end),
            "-c:a", "libmp3lame", "-q:a", "2",
            out_path
        ]
        subprocess.run(cmd, capture_output=True)
        
    print(f"  -> Sliced into {len(chunks)} variations (v1 to v{len(chunks)}).")
    return len(chunks)


def main():
    if not os.path.exists(SOURCE_DIR):
        print(f"❌ Source folder not found: {SOURCE_DIR}")
        return
        
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    files = glob.glob(os.path.join(SOURCE_DIR, "*.mp3")) + glob.glob(os.path.join(SOURCE_DIR, "*.wav"))
    
    print(f"🔪 Found {len(files)} files to analyze and slice...")
    
    total_chunks = 0
    for i, fpath in enumerate(files):
        print(f"[{i+1}/{len(files)}] Processing: {os.path.basename(fpath)}")
        total_chunks += slice_audio(fpath, OUTPUT_DIR)
        
    print(f"\\n🎉 Done! Original 45 files turned into {total_chunks} individual sound files!")
    print(f"Files saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
