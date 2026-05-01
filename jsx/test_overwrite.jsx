// test_overwrite.js
// A quick script to verify insertClip and overwriteClip behavior

var seq = app.project.activeSequence;
var track = seq.audioTracks[0];
if (track.clips.numItems > 0) {
    var clip = track.clips[0];
    var pItem = clip.projectItem;
    var res = track.overwriteClip(pItem, clip.end.ticks);
    // Return to CSInterface to verify
    JSON.stringify({ status: "success", result: res });
}
