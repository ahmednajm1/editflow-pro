var seq = app.project.activeSequence;
var clip = seq.videoTracks[0].clips[0];
var motionComp = null;
for(var i=0; i<clip.components.numItems; i++) {
    if(clip.components[i].displayName === "Motion") motionComp = clip.components[i];
}
var props = [];
for(var j=0; j<motionComp.properties.numItems; j++) {
    props.push(j + ": " + motionComp.properties[j].displayName);
}
props.join("\n");
