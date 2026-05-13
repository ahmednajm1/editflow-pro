try {
    app.enableQE();
    var qeSeq = qe.project.getActiveSequence();
    if (qeSeq) {
        var time = app.project.activeSequence.getPlayerPosition();
        var outPath = Folder.temp.fsName + "/test_qe_capture.png";
        qeSeq.exportFramePNG(time.ticks, outPath);
        var f = new File(outPath);
        if (f.exists) {
            console.log("SUCCESS! Frame saved to " + outPath);
        } else {
            console.log("FAILED to create file.");
        }
    } else {
        console.log("No QE seq.");
    }
} catch(e) {
    console.log("ERROR: " + e.message);
}
