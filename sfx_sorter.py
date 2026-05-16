import os
import shutil
import glob
import re

DOWNLOADS_DIR = os.path.expanduser("~/Downloads")
SFX_DIR = os.path.expanduser("~/Downloads/Remotion/EditFlowPro/sfx")

CATEGORIES = {
    "Whoosh": ["whoosh", "swoosh", "swipe", "sweep", "wind", "pass", "transit"],
    "Impact": ["impact", "hit", "boom", "punch", "slam", "crash", "drop", "thud", "kick", "bang"],
    "Riser": ["riser", "build", "tension", "rise", "swell", "crescendo"],
    "UI": ["ui", "click", "button", "pop", "notification", "beep", "menu", "select"],
    "Foley": ["foley", "step", "foot", "cloth", "door", "paper", "typewriter", "clock", "vinyl", "siren", "helicopter", "dungeon"],
    "Cinematic": ["cinematic", "atmosphere", "drone", "pad", "sub", "bass", "braam"]
}

def clean_filename(filename):
    # Remove pixabay ID numbers like "11325622-" or "-240257"
    name = re.sub(r'^\d+-', '', filename)
    name = re.sub(r'-\d+(\.mp3|\.wav)$', r'\1', name)
    # Remove user names like "musicmbuildings-" or "vfs_world-"
    name = re.sub(r'^.*?-(deep|cinematic|top|zoom|swoosh)', r'\1', name)
    # Remove generic words
    name = name.replace('-sound-effect', '').replace('-effect', '').replace('-royalty-free', '')
    name = name.replace('-', ' ').title().replace(' Mp3', '.mp3').replace(' Wav', '.wav')
    return name.strip()

def categorize_sound(filename):
    name_lower = filename.lower()
    
    # Check against keywords
    for cat, keywords in CATEGORIES.items():
        if any(kw in name_lower for kw in keywords):
            return cat
            
    # Default fallback
    return "Transition"

def process_downloads():
    # Ensure directories exist
    for cat in CATEGORIES.keys():
        os.makedirs(os.path.join(SFX_DIR, cat), exist_ok=True)
    os.makedirs(os.path.join(SFX_DIR, "Transition"), exist_ok=True)
    
    # Find mp3 and wav files in Downloads
    files = glob.glob(os.path.join(DOWNLOADS_DIR, "*.mp3")) + glob.glob(os.path.join(DOWNLOADS_DIR, "*.wav"))
    
    moved_count = 0
    for fpath in files:
        fname = os.path.basename(fpath)
        
        # Pixabay format detection (usually has numbers and dashes, or ends with numbers)
        # We process files if they look like SFX or have effect keywords
        if "effect" in fname.lower() or re.search(r'\d{5,}\.mp3', fname):
            cat = categorize_sound(fname)
            clean_name = clean_filename(fname)
            
            dest = os.path.join(SFX_DIR, cat, clean_name)
            
            # Avoid overwriting
            counter = 1
            base, ext = os.path.splitext(dest)
            while os.path.exists(dest):
                dest = f"{base} {counter}{ext}"
                counter += 1
                
            shutil.move(fpath, dest)
            print(f"Moved: {fname} -> {cat}/{os.path.basename(dest)}")
            moved_count += 1
            
    print(f"\\n✅ Processed and moved {moved_count} sound files!")

if __name__ == "__main__":
    process_downloads()
