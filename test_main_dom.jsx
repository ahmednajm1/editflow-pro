try {
    var seq = app.project.activeSequence;
    if (seq) {
        var time = seq.getPlayerPosition();
        var outPath = Folder.temp.fsName + "/test_main_dom.png";
        if (typeof seq.exportFramePNG === 'function') {
            seq.exportFramePNG(time.ticks, outPath);
            var f = new File(outPath);
            if (f.exists) {
                console.log("SUCCESS! Main DOM exportFramePNG works! File: " + outPath);
            } else {
                console.log("FAILED to create file.");
            }
        } else {
            console.log("seq.exportFramePNG is NOT a function.");
        }
    } else {
        console.log("No seq.");
    }
} catch(e) {
    console.log("ERROR: " + e.message);
}
