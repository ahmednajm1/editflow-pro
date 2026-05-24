import json, os, subprocess

sfx_dir = 'sfx'
catalog_file = os.path.join(sfx_dir, 'catalog.json')

# Load existing categories to preserve them
if os.path.exists(catalog_file):
    with open(catalog_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        cats = {c['id']: c for c in data.get('categories', [])}
else:
    cats = {}

defaults = {
    'Whoosh':     {'id':'whoosh',     'name':'Whoosh',     'icon':'💨', 'name_ar':'سووش'},
    'Impact':     {'id':'impact',     'name':'Impact',     'icon':'💥', 'name_ar':'تأثير'},
    'Riser':      {'id':'riser',      'name':'Riser',      'icon':'📈', 'name_ar':'تصاعد'},
    'Transition': {'id':'transition', 'name':'Transition', 'icon':'🔄', 'name_ar':'انتقال'},
    'UI':         {'id':'ui',         'name':'UI',         'icon':'🔔', 'name_ar':'واجهة'},
    'Foley':      {'id':'foley',      'name':'Foley',      'icon':'🎬', 'name_ar':'فولي'},
    'Cinematic':  {'id':'cinematic',  'name':'Cinematic',  'icon':'🎞️', 'name_ar':'سينمائي'}
}

for folder_name, default_cat in defaults.items():
    cid = default_cat['id']
    if cid not in cats:
        cats[cid] = default_cat

folder_map = {
    'Whoosh': 'whoosh', 'Impact': 'impact', 'Riser': 'riser',
    'Transition': 'transition', 'UI': 'ui', 'Foley': 'foley',
    'Cinematic': 'cinematic'
}

audio_exts = {'.mp3', '.wav', '.aif', '.aiff', '.m4a', '.ogg', '.flac'}
sounds = []

for folder_name, cat_id in folder_map.items():
    folder_path = os.path.join(sfx_dir, folder_name)
    if not os.path.isdir(folder_path):
        continue
    for fname in sorted(os.listdir(folder_path)):
        _, ext = os.path.splitext(fname)
        if ext.lower() not in audio_exts:
            continue
        
        fpath = os.path.join(folder_path, fname)
        dur = '0:00'
        try:
            result = subprocess.run(
                ['ffprobe', '-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', fpath],
                capture_output=True, text=True, timeout=5
            )
            if result.stdout.strip():
                secs = float(result.stdout.strip())
                mins = int(secs // 60)
                secs_r = int(secs % 60)
                dur = f"{mins}:{secs_r:02d}"
        except Exception:
            pass

        display_name = os.path.splitext(fname)[0].replace('_', ' ').replace('-', ' ').title()
        
        file_path = f"{folder_name}/{fname}"
        
        sounds.append({
            'id': fname,
            'name': display_name,
            'category': cat_id,
            'file': file_path,
            'duration': dur
        })

catalog = {
    'version': 1,
    'categories': list(cats.values()),
    'sounds': sounds
}

with open(catalog_file, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2, ensure_ascii=False)

print(f"Catalog rebuilt: {len(sounds)} sounds in {len(cats)} categories")
