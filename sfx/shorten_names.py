import os
import re
import glob

SFX_DIR = os.path.dirname(os.path.abspath(__file__))

def aggressive_clean_name(filename, category):
    name = os.path.splitext(filename)[0].lower()
    
    # Remove numbers
    name = re.sub(r'\d+', ' ', name)
    
    # Split to words
    words = [w for w in name.split() if w and len(w) > 1]
    
    # Remove common extra words that aren't very descriptive if we have enough
    # or just keep the first 3 descriptive words
    keep_words = []
    for w in words:
        if w not in keep_words:  # deduplicate words like "whoosh whoosh"
            keep_words.append(w)
            
    # Max 3 words
    final_words = keep_words[:3]
    
    if not final_words:
        final_words = [category.lower()]
        
    return ' '.join(final_words).title()

def process():
    categories = ['Whoosh', 'Impact', 'Riser', 'Transition', 'UI', 'Foley', 'Cinematic']
    
    for cat in categories:
        cat_path = os.path.join(SFX_DIR, cat)
        if not os.path.exists(cat_path): continue
            
        files = glob.glob(os.path.join(cat_path, '*.wav')) + glob.glob(os.path.join(cat_path, '*.mp3'))
        
        to_rename = []
        for f in files:
            fname = os.path.basename(f)
            ext = os.path.splitext(fname)[1].lower()
            base = aggressive_clean_name(fname, cat)
            to_rename.append({'old_path': f, 'base': base, 'ext': ext})
            
        to_rename.sort(key=lambda x: x['base'])
        
        name_counts = {}
        for item in to_rename:
            base = item['base']
            if base not in name_counts:
                name_counts[base] = 1
                item['final_name'] = f"{base}{item['ext']}"
            else:
                name_counts[base] += 1
                item['final_name'] = f"{base} {name_counts[base]}{item['ext']}"
                
        for item in to_rename:
            new_path = os.path.join(cat_path, item['final_name'])
            if item['old_path'] != new_path:
                if item['old_path'].lower() == new_path.lower():
                    tmp = item['old_path'] + '.tmp'
                    os.rename(item['old_path'], tmp)
                    os.rename(tmp, new_path)
                else:
                    if not os.path.exists(new_path):
                        os.rename(item['old_path'], new_path)

if __name__ == '__main__':
    process()
    print("Done shortening names!")
