import os
import re
import glob

SFX_DIR = os.path.dirname(os.path.abspath(__file__))

def clean_base_name(filename, category):
    name = os.path.splitext(filename)[0].lower()
    
    # Remove garbage words
    garbage = ['mixkit', 'pixabay', 'audiojungle', 'sound', 'effect', 'sfx', 'free', 'royalty', 'download', 'hq', 'hd']
    for g in garbage:
        name = name.replace(g, ' ')
        
    # Remove all numbers and weird chars
    name = re.sub(r'[^a-z]+', ' ', name)
    
    # Split to words, remove empties
    words = [w for w in name.split() if w]
    
    # Ensure category name is present? User said "Whoosh Cinematic", so we don't force it, 
    # but if words is empty, just use category name
    if not words:
        words = [category.lower()]
        
    # Rejoin and title case
    final_name = ' '.join(words).title()
    return final_name

def process():
    categories = ['Whoosh', 'Impact', 'Riser', 'Transition', 'UI', 'Foley', 'Cinematic']
    
    for cat in categories:
        cat_path = os.path.join(SFX_DIR, cat)
        if not os.path.exists(cat_path):
            continue
            
        files = glob.glob(os.path.join(cat_path, '*.wav')) + glob.glob(os.path.join(cat_path, '*.mp3'))
        
        # We will collect the original file, its extension, and its new base name
        to_rename = []
        for f in files:
            fname = os.path.basename(f)
            ext = os.path.splitext(fname)[1].lower()
            base = clean_base_name(fname, cat)
            to_rename.append({'old_path': f, 'base': base, 'ext': ext})
            
        # Sort alphabetically by base name
        to_rename.sort(key=lambda x: x['base'])
        
        # Resolve duplicates
        name_counts = {}
        for item in to_rename:
            base = item['base']
            if base not in name_counts:
                name_counts[base] = 1
                item['final_name'] = f"{base}{item['ext']}"
            else:
                name_counts[base] += 1
                item['final_name'] = f"{base} {name_counts[base]}{item['ext']}"
                
        # Execute renames
        for item in to_rename:
            new_path = os.path.join(cat_path, item['final_name'])
            # Only rename if different, to avoid issues
            if item['old_path'] != new_path:
                # To avoid case-insensitive clash on mac, rename to temp first if needed
                if item['old_path'].lower() == new_path.lower():
                    tmp = item['old_path'] + '.tmp'
                    os.rename(item['old_path'], tmp)
                    os.rename(tmp, new_path)
                else:
                    # Make sure dest doesn't exist just in case
                    if not os.path.exists(new_path):
                        os.rename(item['old_path'], new_path)

if __name__ == '__main__':
    process()
    print("Done renaming!")
