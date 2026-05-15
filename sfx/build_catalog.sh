#!/bin/bash
# ─── SFX Catalog Builder ──────────────────────────────────────────────────
# Scans sfx/ subdirectories for audio files and rebuilds catalog.json
# Run this after adding/removing any sound files.
#
# Usage:  cd EditFlowPro && bash sfx/build_catalog.sh
# ──────────────────────────────────────────────────────────────────────────

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CATALOG="$SCRIPT_DIR/catalog.json"

# Read existing category metadata
CATEGORIES=$(python3 -c "
import json, os
cat_file = '$CATALOG'
if os.path.exists(cat_file):
    data = json.load(open(cat_file))
    cats = {c['id']: c for c in data.get('categories', [])}
else:
    cats = {}
# Default categories if not in catalog
defaults = {
    'Whoosh':     {'id':'whoosh',     'name':'Whoosh',     'icon':'💨', 'name_ar':'سووش'},
    'Impact':     {'id':'impact',     'name':'Impact',     'icon':'💥', 'name_ar':'تأثير'},
    'Riser':      {'id':'riser',      'name':'Riser',      'icon':'📈', 'name_ar':'تصاعد'},
    'Transition': {'id':'transition', 'name':'Transition', 'icon':'🔄', 'name_ar':'انتقال'},
    'UI':         {'id':'ui',         'name':'UI',         'icon':'🔔', 'name_ar':'واجهة'},
    'Foley':      {'id':'foley',      'name':'Foley',      'icon':'🎬', 'name_ar':'فولي'}
}
# Merge
for folder_name, default_cat in defaults.items():
    cid = default_cat['id']
    if cid not in cats:
        cats[cid] = default_cat
print(json.dumps(list(cats.values())))
")

# Scan directories for audio files
SOUNDS=$(python3 -c "
import json, os, subprocess

sfx_dir = '$SCRIPT_DIR'
sounds = []

# Map folder names to category IDs
folder_map = {
    'Whoosh': 'whoosh', 'Impact': 'impact', 'Riser': 'riser',
    'Transition': 'transition', 'UI': 'ui', 'Foley': 'foley'
}

audio_exts = {'.mp3', '.wav', '.aif', '.aiff', '.m4a', '.ogg', '.flac'}

for folder_name, cat_id in folder_map.items():
    folder_path = os.path.join(sfx_dir, folder_name)
    if not os.path.isdir(folder_path):
        continue
    for fname in sorted(os.listdir(folder_path)):
        _, ext = os.path.splitext(fname)
        if ext.lower() not in audio_exts:
            continue
        fpath = os.path.join(folder_path, fname)
        # Get duration via ffprobe if available
        dur = '0:00'
        try:
            result = subprocess.run(
                ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration',
                 '-of', 'csv=p=0', fpath],
                capture_output=True, text=True, timeout=5
            )
            secs = float(result.stdout.strip())
            mins = int(secs // 60)
            secs_r = int(secs % 60)
            dur = f'{mins}:{secs_r:02d}'
        except:
            pass

        display_name = os.path.splitext(fname)[0].replace('_', ' ').replace('-', ' ').title()
        sounds.append({
            'id': fname,
            'name': display_name,
            'category': cat_id,
            'file': cat_id.capitalize() + '/' + fname if cat_id != 'ui' else 'UI/' + fname,
            'duration': dur
        })

# Fix file paths to match actual folder names
for s in sounds:
    cat = s['category']
    folder_names = {'whoosh':'Whoosh','impact':'Impact','riser':'Riser','transition':'Transition','ui':'UI','foley':'Foley'}
    s['file'] = folder_names.get(cat, cat) + '/' + s['id']

print(json.dumps(sounds, indent=2))
")

# Rebuild catalog.json
python3 -c "
import json
cats = json.loads('$CATEGORIES')
sounds = json.loads('''$SOUNDS''')
catalog = {
    'version': 1,
    'categories': cats,
    'sounds': sounds
}
with open('$CATALOG', 'w') as f:
    json.dump(catalog, f, indent=2, ensure_ascii=False)
print(f'✅ Catalog rebuilt: {len(sounds)} sounds in {len(cats)} categories')
"
