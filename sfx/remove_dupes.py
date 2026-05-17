import os
import hashlib

def get_hash(filepath):
    hasher = hashlib.md5()
    try:
        with open(filepath, 'rb') as f:
            buf = f.read()
            hasher.update(buf)
        return hasher.hexdigest()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return None

def remove_duplicates(sfx_dir):
    hashes = {}
    dupes_removed = 0
    total_files = 0
    
    for root, _, files in os.walk(sfx_dir):
        for file in files:
            if file.endswith(('.mp3', '.wav')):
                total_files += 1
                filepath = os.path.join(root, file)
                file_hash = get_hash(filepath)
                
                if file_hash:
                    if file_hash in hashes:
                        print(f"Duplicate found: {filepath} (matches {hashes[file_hash]})")
                        os.remove(filepath)
                        dupes_removed += 1
                    else:
                        hashes[file_hash] = filepath
                        
    print(f"Scanned {total_files} files.")
    print(f"Removed {dupes_removed} duplicates.")

if __name__ == "__main__":
    remove_duplicates('/Users/ahmed/Downloads/Remotion/EditFlowPro/sfx')
