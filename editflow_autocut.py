import sys
import json
import xml.etree.ElementTree as ET
import copy
import re

def process_xml(xml_path, out_path, keep_segments_json):
    with open(keep_segments_json, 'r') as f:
        keeps = json.load(f)
    if not keeps:
        sys.exit(0)

    try:
        tree = ET.parse(xml_path)
    except:
        sys.exit(1)
        
    root = tree.getroot()
    
    # 1. Strip <link> elements globally to avoid Translation Errors in Premiere
    # Premiere is highly sensitive to <link> elements pointing to split <clipitem> IDs.
    for seq in root.findall(".//sequence"):
        # FCP XML stores global links near the bottom of sequence or video/audio nodes
        for links in seq.findall("links"):
            seq.remove(links)

    timebase = 25.0
    for tb_elem in root.findall(".//sequence/rate/timebase"):
        try:
            timebase = float(tb_elem.text)
        except:
            pass
        break

    def sec_to_frame(sec):
        return int(round(sec * timebase))

    keep_frames = []
    for k in keeps:
        keep_frames.append({
            'start': sec_to_frame(k['start']),
            'end': sec_to_frame(k['end'])
        })

    def get_intersection(clip_s, clip_e):
        intersections = []
        for k in keep_frames:
            overlap_s = max(clip_s, k['start'])
            overlap_e = min(clip_e, k['end'])
            if overlap_s < overlap_e:
                intersections.append({'start': overlap_s, 'end': overlap_e, 'keep_idx': keep_frames.index(k)})
        return intersections

    current_new_time = 0
    rippled_starts = []
    for k in keep_frames:
        rippled_starts.append(current_new_time)
        current_new_time += (k['end'] - k['start'])

    # Track seen IDs to prevent duplicate XML errors
    seen_ids = set()

    def generate_safe_id(base_id):
        # Remove any previous split suffixes
        clean_id = re.sub(r'_split\d+', '', base_id)
        new_id = clean_id
        counter = 1
        while new_id in seen_ids:
            new_id = f"{clean_id}_split{counter}"
            counter += 1
        seen_ids.add(new_id)
        return new_id

    for media_type in ['video', 'audio']:
        for track in root.findall(f".//media/{media_type}/track"):
            
            # Remove any track-level filters/links if any exist to ensure stability
            for filters in track.findall("filter"): track.remove(filters)
            
            new_clipitems = []
            
            for clipitem in track.findall("clipitem"):
                try:
                    c_start = int(clipitem.find("start").text)
                    c_end = int(clipitem.find("end").text)
                    c_in_elem = clipitem.find("in")
                    c_out_elem = clipitem.find("out")
                    c_in = int(c_in_elem.text) if c_in_elem is not None else -1
                    c_out = int(c_out_elem.text) if c_out_elem is not None else -1
                except:
                    # E.g. empty generator elements
                    new_clipitems.append(clipitem)
                    continue

                if c_start == -1 or c_end == -1:
                    new_clipitems.append(clipitem)
                    continue

                # Strip internal local <link> nodes inside the clipitem
                for lnk in clipitem.findall("link"):
                    clipitem.remove(lnk)

                overlaps = get_intersection(c_start, c_end)
                if not overlaps:
                    continue  # SILENCE: dropped entirely!

                c_id = clipitem.get('id') or "clip"

                for i, overlap in enumerate(overlaps):
                    new_clip = copy.deepcopy(clipitem)
                    
                    # Prevent ID collisions
                    new_clip.set('id', generate_safe_id(c_id))
                    
                    # Math for Ripple Delete offset
                    k_idx = overlap['keep_idx']
                    offset_within_keep = overlap['start'] - keep_frames[k_idx]['start']
                    new_start = rippled_starts[k_idx] + offset_within_keep
                    duration = overlap['end'] - overlap['start']
                    new_end = new_start + duration
                    
                    # Adjust media in/out
                    cut_from_start = overlap['start'] - c_start
                    new_in = c_in + cut_from_start if c_in != -1 else -1
                    new_out = new_in + duration if new_in != -1 else -1
                    
                    new_clip.find("start").text = str(new_start)
                    new_clip.find("end").text = str(new_end)
                    if new_in != -1: new_clip.find("in").text = str(new_in)
                    if new_out != -1: new_clip.find("out").text = str(new_out)
                    
                    new_clipitems.append(new_clip)

            # Rebuild track
            for c in track.findall("clipitem"):
                track.remove(c)
            for nc in new_clipitems:
                track.append(nc)

    tree.write(out_path, encoding='utf-8', xml_declaration=True)

if __name__ == "__main__":
    process_xml(sys.argv[1], sys.argv[2], sys.argv[3])
