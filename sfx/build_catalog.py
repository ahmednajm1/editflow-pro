import os
import json
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CATALOG = os.path.join(SCRIPT_DIR, 'catalog.json')

defaults = {
    'Whoosh':     {'id':'whoosh',     'name':'Whoosh',     'icon':'💨', 'name_ar':'سووش'},
    'Impact':     {'id':'impact',     'name':'Impact',     'icon':'💥', 'name_ar':'تأثير'},
    'Riser':      {'id':'riser',      'name':'Riser',      'icon':'📈', 'name_ar':'تصاعد'},
    'Transition': {'id':'transition', 'name':'Transition', 'icon':'🔄', 'name_ar':'انتقال'},
    'UI':         {'id':'ui',         'name':'UI',         'icon':'🔔', 'name_ar':'واجهة'},
    'Foley':      {'id':'foley',      'name':'Foley',      'icon':'🎬', 'name_ar':'فولي'},
    'Cinematic':  {'id':'cinematic',  'name':'Cinematic',  'icon':'🎥', 'name_ar':'سينمائي'}
}

# Read existing or create new categories
cats = {}
if os.path.exists(CATALOG):
    try:
        with open(CATALOG, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for c in data.get('categories', []):
                cats[c['id']] = c
    except:
        pass

for cat_name, cat_data in defaults.items():
    if cat_data['id'] not in cats:
        cats[cat_data['id']] = cat_data

sounds = []
folder_map = {k: v['id'] for k, v in defaults.items()}
audio_exts = {'.mp3', '.wav', '.aif', '.aiff', '.m4a', '.ogg', '.flac'}

for folder_name, cat_id in folder_map.items():
    folder_path = os.path.join(SCRIPT_DIR, folder_name)
    if not os.path.isdir(folder_path):
        continue
    for fname in sorted(os.listdir(folder_path)):
        _, ext = os.path.splitext(fname)
        if ext.lower() not in audio_exts:
            continue
        fpath = os.path.join(folder_path, fname)
        
        # Get duration
        dur = '0:00'
        try:
            result = subprocess.run(
                ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', fpath],
                capture_output=True, text=True, timeout=5
            )
            secs = float(result.stdout.strip())
            mins = int(secs // 60)
            secs_r = int(secs % 60)
            dur = f"{mins}:{secs_r:02d}"
        except Exception:
            pass

        # display name
        display_name = os.path.splitext(fname)[0].replace('_', ' ').replace('-', ' ').title()
        sounds.append({
            'id': fname,
            'name': display_name,
            'category': cat_id,
            'file': f"{folder_name}/{fname}",
            'duration': dur
        })

catalog = {
    'version': 1,
    'categories': list(cats.values()),
    'sounds': sounds
}

with open(CATALOG, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2, ensure_ascii=False)

print(f"✅ Catalog rebuilt: {len(sounds)} sounds in {len(cats)} categories")
