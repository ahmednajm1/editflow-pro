import os
import re

SFX_DIR = os.path.dirname(os.path.abspath(__file__))
categories = ['Whoosh', 'Impact', 'Riser', 'Transition', 'UI', 'Foley', 'Cinematic']

def get_number(filename):
    # Extracts the trailing number if present, else 1
    base = os.path.splitext(filename)[0]
    match = re.search(r'\s+(\d+)$', base)
    return int(match.group(1)) if match else 1

all_files = []
for cat in categories:
    cat_path = os.path.join(SFX_DIR, cat)
    if not os.path.exists(cat_path): continue
    for f in os.listdir(cat_path):
        if f.endswith('.wav') or f.endswith('.mp3'):
            fpath = os.path.join(cat_path, f)
            all_files.append((fpath, get_number(f)))

# Sort files by the trailing number (descending) so we delete the highest variants first
all_files.sort(key=lambda x: x[1], reverse=True)

# Delete exactly 47 files (to go from 247 down to 200)
to_delete = len(all_files) - 200
if to_delete > 0:
    for i in range(to_delete):
        fpath = all_files[i][0]
        os.remove(fpath)
    print(f"Deleted {to_delete} extra files.")
else:
    print("Already at or below 200 files.")
