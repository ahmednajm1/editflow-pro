import os
import shutil
import glob
import re
import subprocess

SOURCE_DIR = os.path.expanduser("~/Downloads/Split_SFX")
SFX_DIR = os.path.expanduser("~/Downloads/Remotion/EditFlowPro/sfx")

CATEGORIES = {
    "Whoosh": ["whoosh", "swoosh", "swipe", "sweep", "wind", "swish", "pass"],
    "UI": ["ui", "click", "button", "pop", "notification", "beep", "menu", "select", "bell", "buzzer", "alarm", "error", "correct", "wrong"],
    "Impact": ["impact", "hit", "boom", "punch", "slam", "crash", "drop", "thud", "kick", "bang"],
    "Riser": ["riser", "build", "tension", "rise", "swell", "crescendo", "ascending"],
    "Cinematic": ["cinematic", "atmosphere", "drone", "pad", "sub", "bass", "braam", "stinger", "choir", "orchestral", "suspense"],
    "Foley": ["foley", "step", "foot", "cloth", "door", "paper", "typewriter", "clock", "vinyl", "siren", "helicopter", "camera", "shutter", "cellphone", "cartoon", "quack", "whistle", "funny"]
}

def clean_safe_filename(filename):
    # Make lowercase
    name = filename.lower()
    # Remove Epidemic Sound junk
    name = name.replace("es_", "").replace("- epidemic sound", "").replace("epidemic sound", "")
    name = name.replace("meme redesign", "").replace("variations", "")
    
    # Remove everything after the extension
    name = re.sub(r'\.mp3.*$', '.mp3', name)
    name = re.sub(r'\.wav.*$', '.wav', name)
    
    # Replace spaces, commas, dashes with underscores
    name = re.sub(r'[\s,\-]+', '_', name)
    
    # Remove all characters except alphanumeric, underscore, and dot
    name = re.sub(r'[^a-z0-9_\.]', '', name)
    
    # Clean up multiple underscores
    name = re.sub(r'_+', '_', name)
    name = name.strip('_')
    
    # If the name ends up empty or just extension, give it a generic name
    if name in ['.mp3', '.wav']:
        name = "sound" + name
        
    return name

def categorize_sound(filename):
    name_lower = filename.lower()
    for cat, keywords in CATEGORIES.items():
        if any(kw in name_lower for kw in keywords):
            return cat
    # Default fallback
    return "Transition"

def process_new_sfx():
    print("🧹 Cleaning old SFX...")
    for cat in CATEGORIES.keys():
        cat_path = os.path.join(SFX_DIR, cat)
        if os.path.exists(cat_path):
            shutil.rmtree(cat_path)
    if os.path.exists(os.path.join(SFX_DIR, "Transition")):
        shutil.rmtree(os.path.join(SFX_DIR, "Transition"))
        
    print("📁 Creating clean directories...")
    for cat in CATEGORIES.keys():
        os.makedirs(os.path.join(SFX_DIR, cat), exist_ok=True)
    os.makedirs(os.path.join(SFX_DIR, "Transition"), exist_ok=True)
    
    files = glob.glob(os.path.join(SOURCE_DIR, "*.mp3")) + glob.glob(os.path.join(SOURCE_DIR, "*.wav"))
    
    print(f"🔍 Found {len(files)} files to process.")
    
    moved_count = 0
    for fpath in files:
        original_fname = os.path.basename(fpath)
        cat = categorize_sound(original_fname)
        safe_name = clean_safe_filename(original_fname)
        
        dest = os.path.join(SFX_DIR, cat, safe_name)
        
        # Avoid overwriting
        counter = 1
        base, ext = os.path.splitext(dest)
        while os.path.exists(dest):
            dest = f"{base}_{counter}{ext}"
            counter += 1
            
        shutil.copy2(fpath, dest)
        moved_count += 1
        print(f"✅ {cat} / {os.path.basename(dest)}")
            
    print(f"\\n🎉 Successfully processed {moved_count} super-safe sound files!")

if __name__ == "__main__":
    process_new_sfx()
