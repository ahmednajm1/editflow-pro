app.enableQE();
var qeSeq = qe.project.getActiveSequence();
var time = app.project.activeSequence.getPlayerPosition();
qeSeq.exportFramePNG(time.ticks, Folder.temp.fsName + "/test_qe.png");
