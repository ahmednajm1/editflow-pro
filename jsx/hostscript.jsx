// hostscript.jsx - EditFlow Pro v15.2
// ES3 only. Locale-independent component matching.

var TICKS_PER_SECOND = 254016000000;

$._editflow = {

    log: function(msg) {
        try {
            var logDir = new Folder(Folder.userData.fsName + "/.editflowpro");
            if (!logDir.exists) logDir.create();
            var f = new File(logDir.fsName + "/debug.log");
            f.open("a");
            var d = new Date();
            f.writeln("[" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "] " + msg);
            f.close();
        } catch(e) {}
    },

    objToStr: function(obj) {
        var s = "{";
        for (var k in obj) { s += k + ":" + obj[k] + ", "; }
        return s + "}";
    },

    ticksToSec: function(t) { return parseFloat(t) / TICKS_PER_SECOND; },
    secToTicks: function(s) { return Math.round(s * TICKS_PER_SECOND).toString(); },

    getSeq: function() {
        if (!app.project) return null;
        return app.project.activeSequence || null;
    },

    getSel: function() {
        var seq = this.getSeq();
        if (!seq) return null;
        try {
            var sel = seq.getSelection();
            if (sel && sel.length > 0) return sel;
        } catch(e) {}
        return null;
    },

    pad2: function(n) { return n < 10 ? "0" + n : "" + n; },

    secToTimecode: function(sec) {
        var fps = 30;
        try {
            var seq = this.getSeq();
            if (seq && seq.frameDuration) {
                fps = Math.round(1 / this.ticksToSec(seq.frameDuration.ticks));
            }
        } catch(e) {}
        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = Math.floor(sec % 60);
        var f = Math.floor((sec % 1) * fps);
        return this.pad2(h) + ":" + this.pad2(m) + ":" + this.pad2(s) + ":" + this.pad2(f);
    },

    // =========================================================
    // COMPONENT FINDERS - locale-independent
    // =========================================================
    findComponent: function(clip, names) {
        // names is an array of possible displayName or matchName values
        for (var c = 0; c < clip.components.numItems; c++) {
            var comp = clip.components[c];
            var dn = comp.displayName || "";
            var mn = "";
            try { mn = comp.matchName || ""; } catch(e) {}
            for (var n = 0; n < names.length; n++) {
                if (dn === names[n] || mn === names[n]) return comp;
            }
            // case-insensitive partial match
            var dnL = dn.toLowerCase();
            for (var n = 0; n < names.length; n++) {
                if (dnL.indexOf(names[n].toLowerCase()) !== -1) return comp;
            }
        }
        return null;
    },

    findProperty: function(comp, names) {
        for (var p = 0; p < comp.properties.numItems; p++) {
            var prop = comp.properties[p];
            var dn = prop.displayName || "";
            var mn = "";
            try { mn = prop.matchName || ""; } catch(e) {}
            for (var n = 0; n < names.length; n++) {
                if (dn === names[n] || mn === names[n]) return prop;
            }
            var dnL = dn.toLowerCase();
            for (var n = 0; n < names.length; n++) {
                if (dnL.indexOf(names[n].toLowerCase()) !== -1) return prop;
            }
        }
        return null;
    },

    // Volume component names in various languages
    VOLUME_NAMES: ["Volume", "volume", "Audio Volume",
        "\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0635\u0648\u062A",
        "\u0627\u0644\u0635\u0648\u062A",
        "Lautst\u00E4rke", "Volumen", "Volume audio"],

    LEVEL_NAMES: ["Level", "level",
        "\u0645\u0633\u062A\u0648\u0649",
        "Pegel", "Niveau", "Nivel", "Livello"],

    MOTION_NAMES: ["Motion", "motion",
        "\u062D\u0631\u0643\u0629",
        "Bewegung", "Movimiento", "Mouvement", "Movimento"],

    SCALE_NAMES: ["Scale", "scale",
        "\u0645\u0642\u064A\u0627\u0633",
        "Skalierung", "Escala", "Echelle", "Scala"],

    // =========================================================
    // HEALTH CHECK + DIAGNOSTICS
    // =========================================================
    healthCheck: function() {
        var seq = this.getSeq();
        var qeOK = false;
        try { app.enableQE(); qeOK = (typeof qe !== "undefined"); } catch(e) {}
        var selCount = 0;
        try { var sel = this.getSel(); if (sel) selCount = sel.length; } catch(e) {}
        return '{"project":' + (!!app.project) + ',"sequence":' + (!!seq) + ',"sequenceName":"' + (seq ? seq.name : "none") + '","selectionCount":' + selCount + ',"qe":' + qeOK + ',"version":"' + app.version + '"}';
    },

    debugClip: function() {
        var sel = this.getSel();
        if (!sel) return '{"status":"error","message":"Select a clip first"}';
        var clip = sel[0];
        var info = "Clip: " + clip.name + " | Type: " + clip.mediaType + " | Components: ";
        for (var c = 0; c < clip.components.numItems; c++) {
            var comp = clip.components[c];
            info += "[" + c + "]=" + comp.displayName;
            try { info += "(mn:" + comp.matchName + ")"; } catch(e) {}
            info += "{";
            for (var p = 0; p < comp.properties.numItems; p++) {
                var prop = comp.properties[p];
                info += prop.displayName;
                try { info += "(mn:" + prop.matchName + ")"; } catch(e) {}
                try { info += "=" + prop.getValue(); } catch(e) {}
                if (p < comp.properties.numItems - 1) info += ", ";
            }
            info += "} ";
        }
        this.log(info);
        return '{"status":"success","message":"' + info.substring(0, 200).replace(/"/g, "'") + '"}';
    },

    // =========================================================
    // AUDIO LEVELS — searches AUDIO TRACKS directly
    // getSelection() returns video clips whose Volume is read-only
    // Audio track clips have writable Volume > Level
    // =========================================================
    applyAudioGain: function(dbString) {
        try {
            var db = parseFloat(dbString);
            if (isNaN(db)) return '{"status":"error","message":"Invalid dB value"}';

            // Convert dB to linear gain: 0dB=1.0, +5dB=1.778, -16dB=0.158
            var linear = Math.pow(10, db / 20.0);

            var seq = app.project.activeSequence;
            if (!seq) return '{"status":"error","message":"No active sequence"}';

            // Strategy: find audio clips that are selected or at playhead
            var count = 0;
            var debugInfo = "";

            // Method 1: Try getSelection first — works in newer Premiere
            var sel = seq.getSelection();
            if (sel && sel.length > 0) {
                for (var i = 0; i < sel.length; i++) {
                    var clip = sel[i];
                    for (var c = 0; c < clip.components.numItems; c++) {
                        var comp = clip.components[c];
                        if (comp.displayName === "Volume") {
                            for (var p = 0; p < comp.properties.numItems; p++) {
                                var prop = comp.properties[p];
                                if (prop.displayName === "Level") {
                                    var oldVal = prop.getValue();
                                    if (prop.isTimeVarying()) prop.setTimeVarying(false);
                                    prop.setValue(linear, 1);
                                    var newVal = prop.getValue();
                                    if (Math.abs(newVal - linear) < 0.01) {
                                        count++;
                                        debugInfo = "SEL old=" + oldVal.toFixed(3) + " new=" + newVal.toFixed(3);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Method 2: If selection didn't work, search audio tracks at playhead
            if (count === 0) {
                var time = seq.getPlayerPosition();
                for (var t = 0; t < seq.audioTracks.numTracks; t++) {
                    var track = seq.audioTracks[t];
                    for (var ci = 0; ci < track.clips.numItems; ci++) {
                        var aClip = track.clips[ci];
                        // Check if clip is at playhead position
                        if (aClip.start.ticks <= time.ticks && aClip.end.ticks > time.ticks) {
                            for (var ac = 0; ac < aClip.components.numItems; ac++) {
                                var aComp = aClip.components[ac];
                                if (aComp.displayName === "Volume") {
                                    for (var ap = 0; ap < aComp.properties.numItems; ap++) {
                                        var aProp = aComp.properties[ap];
                                        if (aProp.displayName === "Level") {
                                            var aOld = aProp.getValue();
                                            if (aProp.isTimeVarying()) aProp.setTimeVarying(false);
                                            aProp.setValue(linear, 1);
                                            var aNew = aProp.getValue();
                                            if (Math.abs(aNew - linear) < 0.01) {
                                                count++;
                                                debugInfo = "TRACK" + t + " old=" + aOld.toFixed(3) + " new=" + aNew.toFixed(3);
                                            } else {
                                                // Try without 2nd param
                                                aProp.setValue(linear);
                                                aNew = aProp.getValue();
                                                count++;
                                                debugInfo = "TRACK" + t + "-noflag old=" + aOld.toFixed(3) + " new=" + aNew.toFixed(3);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (count > 0) return '{"status":"success","message":"' + db + 'dB=' + linear.toFixed(4) + ' (' + debugInfo + ')","count":' + count + '}';
            return '{"status":"error","message":"No audio at playhead. Select an audio clip."}';
        } catch(e) {
            return '{"status":"error","message":"' + e.message + '"}';
        }
    },

    // =========================================================
    // STATIC SCALE
    // =========================================================
    applyScale: function(scaleStr) {
        var scaleVal = parseFloat(scaleStr) || 115;
        var seq = this.getSeq();
        if (!seq) return '{"status":"error","message":"Open a project and sequence."}';
        var sel = this.getSel();
        if (!sel) return '{"status":"error","message":"No clips selected."}';

        var count = 0;
        var me = this;

        for (var i = 0; i < sel.length; i++) {
            try {
                var clip = sel[i];
                if (clip.mediaType !== "Video") continue;
                var motionComp = me.findComponent(clip, me.MOTION_NAMES);
                if (!motionComp) {
                    // Fallback: try first component (Motion is typically first on video)
                    me.log("No motion comp. Trying index 0.");
                    if (clip.components.numItems > 0) motionComp = clip.components[0];
                }
                if (!motionComp) continue;

                var scaleProp = me.findProperty(motionComp, me.SCALE_NAMES);
                if (!scaleProp) {
                    me.log("No scale prop. Props:");
                    for (var p = 0; p < motionComp.properties.numItems; p++) {
                        me.log("  [" + p + "]=" + motionComp.properties[p].displayName);
                        // Try to identify Scale by its default value (~100)
                        try {
                            var v = motionComp.properties[p].getValue();
                            if (v === 100) {
                                scaleProp = motionComp.properties[p];
                                me.log("  Found scale by value=100 at index " + p);
                                break;
                            }
                        } catch(e) {}
                    }
                }
                if (scaleProp) {
                    if (scaleProp.isTimeVarying()) scaleProp.setTimeVarying(false);
                    scaleProp.setValue(scaleVal, 1);
                    count++;
                }
            } catch(e) { me.log("Scale err: " + e.message); }
        }

        if (count > 0) return '{"status":"success","message":"Scale ' + scaleVal + ' on ' + count + ' clips","count":' + count + '}';
        return '{"status":"error","message":"Could not find Scale property."}';
    },

    // =========================================================
    // SPEED (uniform via QE DOM)
    // =========================================================
    applySpeed: function(speedPercent) {
        var seq = this.getSeq();
        if (!seq) return '{"status":"error","message":"Open a project and sequence."}';
        var sel = this.getSel();
        if (!sel) return '{"status":"error","message":"No clips selected."}';

        app.enableQE();
        var qeSeq;
        try { qeSeq = qe.project.getActiveSequence(); } catch(e) {}
        if (!qeSeq) {return '{"status":"error","message":"QE DOM failed."}'; }

        var count = 0;
        var me = this;
        for (var i = 0; i < sel.length; i++) {
            if (sel[i].mediaType !== "Video") continue;
            try {
                var found = me.findQEClip(sel[i], seq, qeSeq);
                if (found) {
                    found.setSpeed(speedPercent.toString(), "1", "0", "1", "1");
                    count++;
                } else {
                    me.log("Could not find QE clip for: " + sel[i].name);
                }
            } catch(e) { me.log("Speed err: " + e.message); }
        }

        if (count > 0) return '{"status":"success","message":"Speed ' + speedPercent + ' on ' + count + ' clips","count":' + count + '}';
        return '{"status":"error","message":"Could not set speed."}';
    },

    // =========================================================
    // CINEMATIC SPEED RAMP
    // =========================================================
    applyCinematicRamp: function(peakSpeedStr, rampInStr, rampOutStr) {
        var peakSpeed = parseFloat(peakSpeedStr) || 50;
        var rampIn = parseFloat(rampInStr) || 0.5;
        var rampOut = parseFloat(rampOutStr) || 0.5;
        var seq = this.getSeq();
        if (!seq) return '{"status":"error","message":"Open a project and sequence."}';
        var sel = this.getSel();
        if (!sel) return '{"status":"error","message":"No clips selected."}';

        app.enableQE();
        var qeSeq;
        try { qeSeq = qe.project.getActiveSequence(); } catch(e) {}
        if (!qeSeq) {return '{"status":"error","message":"QE DOM failed."}'; }

        var count = 0;
        var me = this;

        for (var si = 0; si < sel.length; si++) {
            var clip = sel[si];
            if (clip.mediaType !== "Video") continue;
            try {
                var clipStartSec = me.ticksToSec(clip.start.ticks);
                var clipEndSec = me.ticksToSec(clip.end.ticks);
                var clipDur = clipEndSec - clipStartSec;
                if (clipDur < 0.5) continue;

                var ri = rampIn, ro = rampOut;
                if (ri + ro + 0.2 > clipDur) {
                    var ratio = (clipDur - 0.2) / (ri + ro);
                    ri = ri * ratio; ro = ro * ratio;
                }

                var STEPS = 4;
                var cutPoints = [], segSpeeds = [];

                for (var s = 1; s <= STEPS; s++) {
                    cutPoints.push(clipStartSec + ri * (s / (STEPS + 1)));
                    segSpeeds.push(Math.round(100 + (peakSpeed - 100) * me.easeInOutCubic(s / (STEPS + 1))));
                }
                var peakEndTime = clipEndSec - ro;
                cutPoints.push(peakEndTime);
                segSpeeds.push(peakSpeed);
                for (var s = 1; s <= STEPS; s++) {
                    cutPoints.push(peakEndTime + ro * (s / (STEPS + 1)));
                    segSpeeds.push(Math.round(peakSpeed + (100 - peakSpeed) * me.easeInOutCubic(s / (STEPS + 1))));
                }
                segSpeeds.push(100);

                for (var c = cutPoints.length - 1; c >= 0; c--) {
                    try { qeSeq.razor(me.secToTimecode(cutPoints[c])); } catch(e) {}
                }

                var trackIdx = me.findTrackIdx(clip, seq);
                if (trackIdx < 0) continue;
                var qeTrack = qeSeq.getVideoTrackAt(trackIdx);
                var startClipIdx = me.findClipIdxAtTime(seq.videoTracks[trackIdx], clipStartSec);
                if (startClipIdx < 0) continue;

                try { qeTrack.getItemAt(startClipIdx).setSpeed("100", "1", "0", "1", "1"); } catch(e) {}
                for (var s = 0; s < segSpeeds.length; s++) {
                    var idx = startClipIdx + 1 + s;
                    if (idx >= seq.videoTracks[trackIdx].clips.numItems) break;
                    try { qeTrack.getItemAt(idx).setSpeed(segSpeeds[s].toString(), "1", "0", "1", "1"); } catch(e) {}
                }
                count++;
            } catch(e) { me.log("Ramp err: " + e.message); }
        }

        if (count > 0) return '{"status":"success","message":"Ramp ' + peakSpeed + ' on ' + count + ' clips","count":' + count + '}';
        return '{"status":"error","message":"Could not apply ramp."}';
    },

    easeInOutCubic: function(t) {
        return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
    },

    // =========================================================
    // QE CLIP LOOKUP
    // =========================================================
    findQEClip: function(domClip, seq, qeSeq) {
        var tIdx = this.findTrackIdx(domClip, seq);
        if (tIdx < 0) return null;
        var cIdx = this.findClipIdxByClip(seq.videoTracks[tIdx], domClip);
        if (cIdx < 0) return null;
        try { return qeSeq.getVideoTrackAt(tIdx).getItemAt(cIdx); } catch(e) { return null; }
    },

    findTrackIdx: function(clip, seq) {
        for (var t = 0; t < seq.videoTracks.numTracks; t++) {
            var track = seq.videoTracks[t];
            for (var c = 0; c < track.clips.numItems; c++) {
                try {
                    if (track.clips[c].name === clip.name &&
                        String(track.clips[c].start.ticks) === String(clip.start.ticks)) return t;
                } catch(e) {}
            }
        }
        return -1;
    },

    findClipIdxByClip: function(track, clip) {
        for (var c = 0; c < track.clips.numItems; c++) {
            try {
                if (track.clips[c].name === clip.name &&
                    String(track.clips[c].start.ticks) === String(clip.start.ticks)) return c;
            } catch(e) {}
        }
        return -1;
    },

    findClipIdxAtTime: function(track, timeSec) {
        for (var c = 0; c < track.clips.numItems; c++) {
            try {
                var cs = this.ticksToSec(track.clips[c].start.ticks);
                if (Math.abs(cs - timeSec) < 0.05) return c;
            } catch(e) {}
        }
        return -1;
    },

    // =========================================================
    // SILENCE / EXPORT / BEATS / CLIPBOARD (unchanged)
    // =========================================================
    executeSilenceCuts: function(silenceSegmentsStr) {
        var seq = this.getSeq();
        if (!seq) return '{"status":"error","message":"Open a project and sequence."}';
        try {
            var silences = eval(silenceSegmentsStr);
            if (!silences || silences.length === 0) {return '{"status":"success","message":"No silences.","count":0}'; }
            silences.sort(function(a, b) { return b.start - a.start; });
            var cuts = 0, saved = 0;
            for (var i = 0; i < silences.length; i++) {
                var gs = silences[i].start, ge = silences[i].end;
                if (ge - gs < 0.05) continue;
                try { seq.setInPoint(this.secToTicks(gs)); seq.setOutPoint(this.secToTicks(ge)); app.executeCommand(19); cuts++; saved += ge - gs; } catch(e) {}
            }
            try { seq.setInPoint(this.secToTicks(0)); seq.setOutPoint(seq.end); } catch(e) {}
            return '{"status":"success","message":"Removed ' + cuts + ' gaps","count":' + cuts + '}';
        } catch(e) {return '{"status":"error","message":"' + e.message + '"}'; }
    },

    exportSelected: function(presetPath) {
        var seq = this.getSeq();
        if (!seq) return '{"status":"error","message":"Open a project."}';
        var folder = new Folder(Folder.desktop.fsName + "/EditFlowPro_Exports");
        if (!folder.exists) folder.create();
        var out = folder.fsName + "/" + seq.name + "_selected.mp4";
        var f = new File(out); var d = 1;
        while (f.exists) { out = folder.fsName + "/" + seq.name + "_selected_v" + d + ".mp4"; f = new File(out); d++; }
        try {
            var sel = null; try { sel = seq.getSelection(); } catch(e) {}
            if (sel && sel.length > 0) { seq.setInPoint(sel[0].start.ticks); seq.setOutPoint(sel[0].end.ticks); }
            seq.exportAsMediaDirect(out, presetPath, 1);
            return '{"status":"success","message":"Exported ' + new File(out).name + '"}';
        } catch(e) { return '{"status":"error","message":"' + e.message + '"}'; }
    },

    exportAll: function(presetPath) {
        var seq = this.getSeq();
        if (!seq) return '{"status":"error","message":"Open a project."}';
        var folder = new Folder(Folder.desktop.fsName + "/EditFlowPro_Exports");
        if (!folder.exists) folder.create();
        var vt = seq.videoTracks[0]; var count = 0;
        for (var i = 0; i < vt.clips.numItems; i++) {
            try {
                var clip = vt.clips[i]; seq.setInPoint(clip.start.ticks); seq.setOutPoint(clip.end.ticks);
                var nm = clip.name.replace(/[^a-zA-Z0-9_]/g, "_");
                var out = folder.fsName + "/" + seq.name + "_" + nm + "_" + (i+1) + ".mp4";
                var f = new File(out); var d = 1;
                while (f.exists) { out = folder.fsName + "/" + seq.name + "_" + nm + "_" + (i+1) + "_v" + d + ".mp4"; f = new File(out); d++; }
                seq.exportAsMediaDirect(out, presetPath, 1); count++;
            } catch(e) {}
        }
        if (count > 0) return '{"status":"success","message":"Exported ' + count + ' clips","count":' + count + '}';
        return '{"status":"error","message":"No clips on V1."}';
    },

    exportForSocial: function(presetPath, suffix) {
        var seq = this.getSeq();
        if (!seq) return '{"status":"error","message":"Open a project."}';
        var folder = new Folder(Folder.desktop.fsName + "/EditFlowPro_Exports");
        if (!folder.exists) folder.create();
        var baseName = seq.name + "_" + (suffix || "social");
        var out = folder.fsName + "/" + baseName + ".mp4";
        var f = new File(out); var d = 1;
        while (f.exists) { out = folder.fsName + "/" + baseName + "_v" + d + ".mp4"; f = new File(out); d++; }
        try {
            seq.exportAsMediaDirect(out, presetPath, 1);
            return '{"status":"success","message":"Exported for ' + suffix + '","filePath":"' + out.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"}';
        } catch(e) { return '{"status":"error","message":"' + e.message + '"}'; }
    },

    getAudioMedia: function() {
        var seq = this.getSeq();
        if (!seq) return '{"status":"error","message":"Open a project."}';

        var me = this;
        function buildPayload(clip) {
            var mp = clip.projectItem.getMediaPath();
            if (!mp) return null;
            // inPoint/outPoint = where in the SOURCE media this clip starts/ends.
            // start/end          = where on the TIMELINE the clip lives.
            var clipIn = 0, clipOut = 0;
            try { if (clip.inPoint  && clip.inPoint.seconds  !== undefined) clipIn  = clip.inPoint.seconds;  } catch(e) {}
            try { if (clip.outPoint && clip.outPoint.seconds !== undefined) clipOut = clip.outPoint.seconds; } catch(e) {}
            // Fallback to ticks if seconds is missing
            if (!clipIn  && clip.inPoint  && clip.inPoint.ticks)  clipIn  = me.ticksToSec(clip.inPoint.ticks);
            if (!clipOut && clip.outPoint && clip.outPoint.ticks) clipOut = me.ticksToSec(clip.outPoint.ticks);

            var tlStart = 0;
            try { tlStart = me.ticksToSec(clip.start.ticks) || 0; } catch(e) {}

            var dur = (clipOut > clipIn) ? (clipOut - clipIn) : 0;
            var name = "";
            try { name = clip.projectItem.name || ""; } catch(e) {}

            return '{"status":"success",' +
                '"mediaPath":"' + mp.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '",' +
                '"clipIn":'        + clipIn  + ',' +
                '"clipOut":'       + clipOut + ',' +
                '"duration":'      + dur     + ',' +
                '"timelineStart":' + tlStart + ',' +
                '"clipName":"'     + name.replace(/"/g, '\\"') + '"}';
        }

        try {
            var sel = seq.getSelection();
            if (sel && sel.length > 0) {
                for (var i = 0; i < sel.length; i++) {
                    if (sel[i].projectItem) {
                        var p = buildPayload(sel[i]);
                        if (p) return p;
                    }
                }
            }
        } catch(e) {}
        for (var t = 0; t < seq.audioTracks.numTracks; t++) {
            for (var c = 0; c < seq.audioTracks[t].clips.numItems; c++) {
                try {
                    var p2 = buildPayload(seq.audioTracks[t].clips[c]);
                    if (p2) return p2;
                } catch(e) {}
            }
        }
        return '{"status":"error","message":"No audio on timeline."}';
    },

    placeBeatMarkers: function(arrString, offsetSecs) {
        var seq = this.getSeq();
        if (!seq) {return '{"status":"error","message":"No sequence."}'; }
        try {
            var peaks = eval(arrString); var markers = seq.markers; var count = 0;
            offsetSecs = parseFloat(offsetSecs) || 0;
            for (var i = 0; i < peaks.length; i++) {
                var t = peaks[i] + offsetSecs; if (t < 0) continue;
                var m = markers.createMarker(t); m.name = "Beat " + (i+1); m.comments = "EditFlow";
                count++; if (count >= 2000) break;
            }
            return '{"status":"success","message":"Placed ' + count + ' markers","count":' + count + '}';
        } catch(e) {return '{"status":"error","message":"' + e.message + '"}'; }
    },

    clearMarkers: function() {
        var seq = this.getSeq();
        if (!seq) {return '{"status":"error","message":"No sequence."}'; }
        var markers = seq.markers; var list = [];
        var m = markers.getFirstMarker();
        while (m) { list.push(m); m = markers.getNextMarker(m); }
        for (var i = 0; i < list.length; i++) markers.deleteMarker(list[i]);
        return '{"status":"success","message":"Cleared ' + list.length + ' markers","count":' + list.length + '}';
    },

    importClipboardImage: function(filePath) {
        try {
            var project = app.project;
            if (!project) {return '{"status":"error","message":"Open a project."}'; }
            project.importFiles([filePath], true, project.rootItem, false);
            var root = project.rootItem;
            var lastItem = root.children[root.children.numItems - 1];
            var seq = app.project.activeSequence;
            if (seq) { seq.videoTracks[0].insertClip(lastItem, seq.getPlayerPosition());return '{"status":"success","message":"Image on timeline"}'; }
return '{"status":"success","message":"Imported to bin"}';
        } catch(e) {return '{"status":"error","message":"' + e.message + '"}'; }
    },

    openSpeedDialog: function() {
        try {
            // Open native Premiere "Clip Speed / Duration" dialog
            // Try multiple known command IDs for this menu item
            var ids = [3, 86, 50];
            for (var i = 0; i < ids.length; i++) {
                try { app.executeCommand(ids[i]); return '{"status":"success","message":"Speed dialog opened"}'; } catch(e) {}
            }
            // Fallback: try menu command by name
            try { app.executeCommand("Speed/Duration"); return '{"status":"success","message":"Speed dialog opened"}'; } catch(e) {}
            return '{"status":"error","message":"Could not open Speed dialog. Use Clip menu > Speed/Duration."}';
        } catch(e) { return '{"status":"error","message":"' + e.message + '"}'; }
    }
};

// =========================================================
// COLOR GRADING SYSTEM — v17 (VERIFIED property indices)
// Property index map (verified by live debugging):
// 14=Temperature, 15=Tint, 16=Saturation,
// 19=Exposure, 20=Contrast, 21=Highlights,
// 22=Shadows, 23=Whites, 24=Blacks
// =========================================================

$._editflow.findLumetriComponent = function(clip) {
    for (var c = 0; c < clip.components.numItems; c++) {
        var comp = clip.components[c];
        if (comp.displayName === "Lumetri Color") return comp;
        var mn = "";
        try { mn = comp.matchName; } catch(e) {}
        if (mn === "AE.ADBE Lumetri") return comp;
    }
    return null;
};

$._editflow.ensureLumetriOnTrack = function(trackIdx) {
    // Add Lumetri to ALL clips on this track via QE iteration
    // This avoids the QE↔DOM index mismatch problem
    app.enableQE();
    var eff = qe.project.getVideoEffectByName("Lumetri Color");
    var qeT = qe.project.getActiveSequence().getVideoTrackAt(trackIdx);
    for (var i = 0; i < qeT.numItems; i++) {
        try {
            var item = qeT.getItemAt(i);
            if (item.type === "Clip") {
                item.addVideoEffect(eff);
            }
        } catch(e) {}
    }
};

$._editflow.setLumetriValues = function(lumetri, values) {
    var count = 0;
    for (var idx in values) {
        try {
            var propIndex = parseInt(idx);
            var prop = lumetri.properties[propIndex];
            if (prop) {
                if (prop.isTimeVarying()) prop.setTimeVarying(false);
                prop.setValue(values[idx], true);
                count++;
            }
        } catch(e) {
            this.log("setLumetri err idx " + idx + ": " + e.message);
        }
    }
    return count;
};

$._editflow.applyColorPreset = function(presetName, presetType, intensityStr) {
    var intensity = parseFloat(intensityStr) || 100;
    var factor = intensity / 100;

    var me = this;
    me.log("applyColorPreset: " + presetName + " intensity=" + intensity + " factor=" + factor);
    var seq = me.getSeq();
    if (!seq) return '{"status":"error","message":"Open a sequence"}';
    var sel = me.getSel();
    if (!sel) return '{"status":"error","message":"Select clips first"}';

    var presets = (presetType === "log") ? me.LOG_PRESETS : me.LOOK_PRESETS;
    var preset = presets[presetName];
    if (!preset) return '{"status":"error","message":"Unknown preset: ' + presetName + '"}';

    // Default values for each Lumetri property index
    var DEFAULTS = {
        14: 0,     // Temperature
        15: 0,     // Tint
        16: 100,   // Saturation (100 = normal)
        19: 0,     // Exposure
        20: 0,     // Contrast
        21: 0,     // Highlights
        22: 0,     // Shadows
        23: 0,     // Whites
        24: 0      // Blacks
    };

    // Calculate intensity-adjusted values: blend between default and target
    var adjustedPreset = {};
    for (var idx in preset) {
        var targetVal = preset[idx];
        var defaultVal = (DEFAULTS[idx] !== undefined) ? DEFAULTS[idx] : 0;
        adjustedPreset[idx] = defaultVal + (targetVal - defaultVal) * factor;
    }
    me.log("Adjusted preset (" + intensity + "%): " + me.objToStr(adjustedPreset));

    // Add Lumetri via QE first
    app.enableQE();
    var qeSeq = qe.project.getActiveSequence();
    var eff = qe.project.getVideoEffectByName("Lumetri Color");

    var count = 0;
    for (var i = 0; i < sel.length; i++) {
        try {
            var clip = sel[i];
            if (clip.mediaType !== "Video") continue;

            // Ensure Lumetri exists — add via QE track iteration
            var lumetri = me.findLumetriComponent(clip);
            if (!lumetri) {
                var trackIdx = me.findTrackIdx(clip, seq);
                if (trackIdx >= 0) {
                    var qeTrack = qeSeq.getVideoTrackAt(trackIdx);
                    for (var q = 0; q < qeTrack.numItems; q++) {
                        try {
                            var qeItem = qeTrack.getItemAt(q);
                            if (qeItem.type === "Clip" && qeItem.name === clip.name) {
                                qeItem.addVideoEffect(eff);
                                break;
                            }
                        } catch(e2) {}
                    }
                    lumetri = me.findLumetriComponent(clip);
                }
            }

            if (!lumetri) {
                me.log("Could not add Lumetri to " + clip.name);
                continue;
            }

            me.setLumetriValues(lumetri, adjustedPreset);
            count++;
        } catch(e) { me.log("Color err: " + e.message); }
    }

    if (count > 0) return '{"status":"success","message":"' + presetName + ' (' + intensity + '%) applied to ' + count + ' clips","count":' + count + '}';
    return '{"status":"error","message":"Could not apply preset. Select video clips."}';
};

$._editflow.resetColor = function() {
    var me = this;
    var seq = me.getSeq();
    if (!seq) return '{"status":"error","message":"Open a sequence"}';
    var sel = me.getSel();
    if (!sel) return '{"status":"error","message":"Select clips first"}';
    var defaults = { 14:0, 15:0, 16:100, 19:0, 20:0, 21:0, 22:0, 23:0, 24:0 };
    var count = 0;
    for (var i = 0; i < sel.length; i++) {
        try {
            var clip = sel[i];
            var lumetri = me.findLumetriComponent(clip);
            if (!lumetri) continue;
            me.setLumetriValues(lumetri, defaults);
            count++;
        } catch(e) {}
    }
    if (count > 0) return '{"status":"success","message":"Color reset on ' + count + ' clips","count":' + count + '}';
    return '{"status":"error","message":"No Lumetri found to reset"}';
};

$._editflow.applyAIColor = function(valuesJSON) {
    var me = this;
    try { var values = eval("(" + valuesJSON + ")"); } catch(e) { return '{"status":"error","message":"Invalid color data"}'; }
    var seq = me.getSeq();
    if (!seq) return '{"status":"error","message":"Open a sequence"}';
    var sel = me.getSel();
    if (!sel) return '{"status":"error","message":"Select clips first"}';

    // Map ALL AI keys to Lumetri property display names
    // Basic Correction uses indices (reliable), advanced sections use name search
    var BASIC_MAP = { "Temperature":14, "Tint":15, "Saturation":16, "Exposure":19, "Contrast":20, "Highlights":21, "Shadows":22, "Whites":23, "Blacks":24 };

    // Creative, Color Wheels, Vignette — map AI key to Lumetri displayName
    var NAME_MAP = {
        "FadedFilm": "Faded Film",
        "Sharpen": "Sharpen",
        "Vibrance": "Vibrance",
        "ShadowTintHue": "Shadow Tint",
        "ShadowTintBalance": "Shadow Tint Balance",
        "HighlightTintHue": "Highlight Tint",
        "HighlightTintBalance": "Highlight Tint Balance",
        "VignetteAmount": "Amount",
        "VignetteMidpoint": "Midpoint",
        "VignetteRoundness": "Roundness",
        "VignetteFeather": "Feather"
    };
    // Color Wheels (these are trickier — may use different names per version)
    var WHEEL_MAP = {
        "ShadowHue": ["Shadow Hue", "Shadows"],
        "ShadowBalance": ["Shadow Saturation", "Shadow Balance"],
        "MidtoneHue": ["Midtone Hue", "Midtones"],
        "MidtoneBalance": ["Midtone Saturation", "Midtone Balance"],
        "HighlightHue": ["Highlight Hue", "Highlights Hue"],
        "HighlightBalance": ["Highlight Saturation", "Highlight Balance"]
    };

    // Build basic indexed values
    var indexedValues = {};
    for (var key in values) {
        if (BASIC_MAP[key] !== undefined) {
            indexedValues[BASIC_MAP[key]] = values[key];
        }
    }

    // Step 1: Add Lumetri to all tracks that have selected clips
    var tracksProcessed = {};
    for (var i = 0; i < sel.length; i++) {
        if (sel[i].mediaType !== "Video") continue;
        var tIdx = me.findTrackIdx(sel[i], seq);
        if (tIdx >= 0 && !tracksProcessed[tIdx]) {
            me.ensureLumetriOnTrack(tIdx);
            tracksProcessed[tIdx] = true;
        }
    }

    // Step 2: Set values on selected clips
    var count = 0;
    for (var i = 0; i < sel.length; i++) {
        try {
            var clip = sel[i];
            if (clip.mediaType !== "Video") continue;
            var lumetri = me.findLumetriComponent(clip);
            if (!lumetri) continue;

            // Apply Basic Correction by index
            me.setLumetriValues(lumetri, indexedValues);

            // Apply Creative, Color Wheels, Vignette by property name search
            for (var aiKey in NAME_MAP) {
                if (values[aiKey] !== undefined) {
                    me.setLumetriPropByName(lumetri, NAME_MAP[aiKey], values[aiKey]);
                }
            }
            // Apply Color Wheels with fallback names
            for (var wKey in WHEEL_MAP) {
                if (values[wKey] !== undefined) {
                    var names = WHEEL_MAP[wKey];
                    var found = false;
                    for (var n = 0; n < names.length; n++) {
                        if (me.setLumetriPropByName(lumetri, names[n], values[wKey])) { found = true; break; }
                    }
                }
            }
            count++;
        } catch(e) { me.log("AI color err: " + e.message); }
    }
    if (count > 0) return '{"status":"success","message":"AI color (full Lumetri) applied to ' + count + ' clips","count":' + count + '}';
    return '{"status":"error","message":"Could not apply AI color"}';
};

// Search ALL Lumetri properties by displayName and set value
$._editflow.setLumetriPropByName = function(lumetri, targetName, value) {
    for (var i = 0; i < lumetri.properties.numItems; i++) {
        try {
            var prop = lumetri.properties[i];
            if (prop.displayName === targetName) {
                if (prop.isTimeVarying()) prop.setTimeVarying(false);
                prop.setValue(value, true);
                return true;
            }
        } catch(e) {}
    }
    return false;
};

// Debug: dump all Lumetri property names (call from console for discovery)
$._editflow.dumpLumetriProps = function() {
    var seq = this.getSeq(); if (!seq) return "no seq";
    var sel = this.getSel(); if (!sel) return "no sel";
    var clip = sel[0]; if (!clip || clip.mediaType !== "Video") return "no video clip";
    var lumetri = this.findLumetriComponent(clip);
    if (!lumetri) return "no lumetri";
    var result = "";
    for (var i = 0; i < lumetri.properties.numItems; i++) {
        try {
            var p = lumetri.properties[i];
            var val = ""; try { val = p.getValue(); } catch(e) { val = "[group]"; }
            result += i + ": " + p.displayName + " = " + val + "\n";
        } catch(e) { result += i + ": [error]\n"; }
    }
    return result;
};

// Presets stored as $._editflow properties (ES3 compatible)
$._editflow.LOG_PRESETS = {
    "slog3": { 14:-5, 15:0, 16:120, 19:0.8, 20:65, 21:-15, 22:25, 23:10, 24:-15 },
    "vlog":  { 14:0, 15:0, 16:115, 19:0.6, 20:60, 21:-10, 22:20, 23:8, 24:-12 },
    "clog":  { 14:0, 15:0, 16:112, 19:0.5, 20:55, 21:-8, 22:18, 23:5, 24:-10 },
    "logc":  { 14:0, 15:0, 16:118, 19:0.7, 20:58, 21:-12, 22:22, 23:8, 24:-14 },
    "nlog":  { 14:0, 15:0, 16:110, 19:0.5, 20:50, 21:-8, 22:15, 23:5, 24:-10 },
    "dlog":  { 14:0, 15:0, 16:108, 19:0.4, 20:48, 21:-5, 22:12, 23:5, 24:-8 }
};

$._editflow.LOOK_PRESETS = {
    "blade_runner": { 14:-18, 15:5, 16:70, 19:-0.3, 20:30, 21:-25, 22:-15, 23:-10, 24:-30 },
    "matrix":       { 14:-25, 15:20, 16:50, 19:-0.2, 20:40, 21:-15, 22:-20, 24:-35 },
    "joker":        { 14:12, 15:-5, 16:115, 19:0.1, 20:25, 21:-10, 22:15 },
    "mad_max":      { 14:35, 15:8, 16:80, 19:0.3, 20:45, 21:-30, 22:-10, 24:-25 },
    "nolan_cool":   { 14:-15, 15:0, 16:75, 19:-0.1, 20:35, 21:-20, 22:-5, 24:-18 },
    "dune_sand":    { 14:28, 15:12, 16:65, 19:0.2, 20:18, 21:-25, 22:10 },
    "kodak_warm":   { 14:20, 15:5, 16:108, 19:0.1, 20:12, 21:-5, 22:5 },
    "fuji_fade":    { 14:-5, 15:8, 16:82, 19:0.2, 20:-12, 21:15, 22:20, 24:18 },
    "polaroid":     { 14:12, 15:14, 16:88, 19:0.3, 20:-15, 21:10, 22:25, 24:22 },
    "film_noir":    { 14:0, 15:0, 16:0, 19:-0.3, 20:55, 21:-35, 22:-30, 24:-40 },
    "golden_hour":  { 14:38, 15:10, 16:120, 19:0.2, 20:8, 21:-12, 22:15 },
    "horror":       { 14:-22, 15:-10, 16:35, 19:-0.5, 20:50, 21:-25, 22:-35, 24:-45 },
    "midnight":     { 14:-32, 15:5, 16:55, 19:-0.6, 20:22, 21:-22, 22:-18, 24:-28 },
    "sepia_dream":  { 14:32, 15:15, 16:45, 19:0.1, 20:-5, 21:5, 22:10 },
    "seventies_film": { 14:18, 15:8, 16:92, 19:0.1, 20:-8, 21:12, 22:15, 24:12 },
    "commercial":   { 14:3, 15:0, 16:118, 19:0.2, 20:18, 21:-8, 22:5 },
    "social_pop":   { 14:5, 15:0, 16:135, 19:0.3, 20:22, 21:-12, 22:10 },
    "anderson":     { 14:8, 15:-3, 16:92, 19:0.3, 20:-8, 21:8, 22:15 }
};

// ============================================
// ALIGN & TRANSFORM v2 — COMPLETE SYSTEM
// ES3 ONLY — no const/let/=>/backticks
// ============================================

// -------------------------------------------------------
// Helper: Sequence info
// -------------------------------------------------------
$._editflow.getSequenceInfo = function() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return '{"error":"no active sequence"}';

        var w = seq.frameSizeHorizontal;
        var h = seq.frameSizeVertical;

        var orientation = "Custom";
        if (w > h) orientation = "Horizontal";
        if (h > w) orientation = "Vertical";
        if (w === h) orientation = "Square";

        var resolution = w + "x" + h;
        if (w === 3840 && h === 2160) resolution = "4K UHD (3840x2160)";
        if (w === 2560 && h === 1440) resolution = "2K QHD (2560x1440)";
        if (w === 1920 && h === 1080) resolution = "Full HD (1920x1080)";
        if (w === 1280 && h === 720)  resolution = "HD (1280x720)";
        if (w === 1080 && h === 1920) resolution = "Vertical FHD (1080x1920)";
        if (w === 1080 && h === 1350) resolution = "Instagram (1080x1350)";
        if (w === 1080 && h === 1080) resolution = "Square (1080x1080)";

        var result = '{"width":' + w + ',"height":' + h;
        result += ',"centerX":' + (w / 2) + ',"centerY":' + (h / 2);
        result += ',"orientation":"' + orientation + '"';
        result += ',"resolution":"' + resolution + '"}';

        return result;
    } catch(e) {
        return '{"error":"' + e.message + '"}';
    }
};

// -------------------------------------------------------
// Helper: Find Position property
// Priority: Align and Transform > Transform > Motion
// -------------------------------------------------------
$._editflow._findPositionInfo = function(clip) {
    var targetComp = null;
    var motionComp = null;

    for (var c = 0; c < clip.components.numItems; c++) {
        var comp = clip.components[c];
        var name = comp.displayName;
        if (name === "Align and Transform" || name === "Transform") {
            targetComp = comp;
            break;
        }
        if (name === "Motion") {
            motionComp = comp;
        }
    }

    if (!targetComp) targetComp = motionComp;
    if (!targetComp) return null;

    for (var p = 0; p < targetComp.properties.numItems; p++) {
        if (targetComp.properties[p].displayName === "Position") {
            return {
                prop: targetComp.properties[p],
                compName: targetComp.displayName
            };
        }
    }
    return null;
};

// -------------------------------------------------------
// Helper: Find Scale property
// -------------------------------------------------------
$._editflow._findScaleProp = function(clip) {
    for (var c = 0; c < clip.components.numItems; c++) {
        var comp = clip.components[c];
        var name = comp.displayName;
        if (name === "Motion" || name === "Transform" || name === "Align and Transform") {
            for (var p = 0; p < comp.properties.numItems; p++) {
                if (comp.properties[p].displayName === "Scale") {
                    return {
                        prop: comp.properties[p],
                        compName: name
                    };
                }
            }
        }
    }
    return null;
};

// -------------------------------------------------------
// Read clip position info (for live info bar)
// -------------------------------------------------------
$._editflow.getClipPositionInfo = function() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return '{"error":"no active sequence"}';

        var sel = seq.getSelection();
        if (!sel || sel.length === 0) return '{"error":"no clips selected"}';

        var clip = sel[0];
        var seqW = seq.frameSizeHorizontal;
        var seqH = seq.frameSizeVertical;

        // ---- Position ----
        var posInfo = $._editflow._findPositionInfo(clip);
        var posX = 0;
        var posY = 0;
        var compName = "none";
        var coordType = "unknown";

        if (posInfo) {
            var val = posInfo.prop.getValue();
            posX = val[0];
            posY = val[1];
            compName = posInfo.compName;

            // 2-tier coordinate detection:
            // Small values or Align and Transform = normalized (center 0.5, 0.5)
            // Large values on Motion = pixel (center seqW/2, seqH/2)
            if (compName === "Align and Transform" || compName === "Transform" || (Math.abs(posX) < 50 && Math.abs(posY) < 50)) {
                coordType = "normalized";
            } else {
                coordType = "pixel";
            }
        }

        // ---- Center & offset ----
        var centerX, centerY, offsetX, offsetY;

        if (coordType === "normalized") {
            centerX = 0.5;
            centerY = 0.5;
            offsetX = (posX - 0.5) * seqW;
            offsetY = (posY - 0.5) * seqH;
        } else {
            centerX = seqW / 2;
            centerY = seqH / 2;
            offsetX = posX - centerX;
            offsetY = posY - centerY;
        }

        // ---- Scale ----
        var scaleVal = 100;
        var scaleInfo = $._editflow._findScaleProp(clip);
        if (scaleInfo) {
            scaleVal = scaleInfo.prop.getValue();
        }

        // ---- Build result ----
        var result = '{';
        result += '"clipName":"' + clip.name + '"';
        result += ',"component":"' + compName + '"';
        result += ',"coordType":"' + coordType + '"';
        result += ',"posX":' + posX;
        result += ',"posY":' + posY;
        result += ',"centerX":' + centerX;
        result += ',"centerY":' + centerY;
        result += ',"offsetX":' + Math.round(offsetX);
        result += ',"offsetY":' + Math.round(offsetY);
        result += ',"scale":' + scaleVal;
        result += ',"seqW":' + seqW;
        result += ',"seqH":' + seqH;
        result += ',"isCentered":' + (Math.abs(offsetX) < 2 && Math.abs(offsetY) < 2);
        result += '}';

        return result;
    } catch(e) {
        return '{"error":"' + e.message + '"}';
    }
};

// -------------------------------------------------------
// Smart alignment
// direction: "left","right","top","bottom","centerH","centerV","centerBoth"
// -------------------------------------------------------
$._editflow.alignClip = function(direction) {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return '{"status":"error","message":"no active sequence"}';

        var sel = seq.getSelection();
        if (!sel || sel.length === 0) return '{"status":"error","message":"no clips selected"}';

        var seqW = seq.frameSizeHorizontal;
        var seqH = seq.frameSizeVertical;
        var results = [];

        for (var i = 0; i < sel.length; i++) {
            var clip = sel[i];
            var posInfo = $._editflow._findPositionInfo(clip);

            if (!posInfo) {
                results.push("Clip " + i + ": no Position found");
                continue;
            }

            var currentVal = posInfo.prop.getValue();
            var oldX = currentVal[0];
            var oldY = currentVal[1];
            var compName = posInfo.compName;

            // 2-tier detection: normalized vs pixel
            var isNormalized = (compName === "Align and Transform" || compName === "Transform" || (Math.abs(oldX) < 50 && Math.abs(oldY) < 50));

            var newX = oldX;
            var newY = oldY;

            if (isNormalized) {
                // NORMALIZED — center = (0.5, 0.5)
                if (direction === "left")        newX = 0.0;
                if (direction === "right")       newX = 1.0;
                if (direction === "centerH")     newX = 0.5;
                if (direction === "top")         newY = 0.0;
                if (direction === "bottom")      newY = 1.0;
                if (direction === "centerV")     newY = 0.5;
                if (direction === "centerBoth") { newX = 0.5; newY = 0.5; }
            } else {
                // PIXEL — center = (seqW/2, seqH/2)
                if (direction === "left")        newX = 0;
                if (direction === "right")       newX = seqW;
                if (direction === "centerH")     newX = seqW / 2;
                if (direction === "top")         newY = 0;
                if (direction === "bottom")      newY = seqH;
                if (direction === "centerV")     newY = seqH / 2;
                if (direction === "centerBoth") { newX = seqW / 2; newY = seqH / 2; }
            }

            // Reset Scale to 100% on Center Both
            if (direction === "centerBoth") {
                var si = $._editflow._findScaleProp(clip);
                if (si) si.prop.setValue(100, true);
            }

            posInfo.prop.setValue([newX, newY], true);

            results.push(
                "Clip " + i + " [" + compName + "] " +
                (isNormalized ? "norm" : "px") +
                ": (" + oldX + "," + oldY + ") -> (" + newX + "," + newY + ")"
            );
        }

        var msg = results.join(" | ");
        return '{"status":"success","message":"' + msg.replace(/"/g, '\\"') + '","count":' + results.length + '}';
    } catch(e) {
        return '{"status":"error","message":"' + e.message + '"}';
    }
};

// -------------------------------------------------------
// Nudge position — move clip by delta pixels
// direction: "left","right","up","down"
// stepPx: pixel step (auto-converted for normalized coords)
// -------------------------------------------------------
$._editflow.nudgePosition = function(direction, stepPxStr) {
    try {
        var stepPx = parseFloat(stepPxStr);
        if (isNaN(stepPx) || stepPx <= 0) stepPx = 10;

        var seq = app.project.activeSequence;
        if (!seq) return '{"status":"error","message":"no active sequence"}';

        var sel = seq.getSelection();
        if (!sel || sel.length === 0) return '{"status":"error","message":"no clips selected"}';

        var seqW = seq.frameSizeHorizontal;
        var seqH = seq.frameSizeVertical;
        var count = 0;

        for (var i = 0; i < sel.length; i++) {
            var posInfo = $._editflow._findPositionInfo(sel[i]);
            if (!posInfo) continue;

            var val = posInfo.prop.getValue();
            var x = val[0];
            var y = val[1];

            // 2-tier detection for nudge
            var cName = posInfo.compName;
            var useNorm = (cName === "Align and Transform" || cName === "Transform" || (Math.abs(x) < 50 && Math.abs(y) < 50));

            var dx = 0;
            var dy = 0;
            if (useNorm) {
                // Both normalized and offset use small fractional steps
                var normStepX = stepPx / seqW;
                var normStepY = stepPx / seqH;
                if (direction === "left")  dx = -normStepX;
                if (direction === "right") dx = normStepX;
                if (direction === "up")    dy = -normStepY;
                if (direction === "down")  dy = normStepY;
            } else {
                if (direction === "left")  dx = -stepPx;
                if (direction === "right") dx = stepPx;
                if (direction === "up")    dy = -stepPx;
                if (direction === "down")  dy = stepPx;
            }

            posInfo.prop.setValue([x + dx, y + dy], true);
            count++;
        }

        if (count > 0) return '{"status":"success","message":"Nudged ' + direction + ' ' + stepPx + 'px","count":' + count + '}';
        return '{"status":"error","message":"No Position found"}';
    } catch(e) {
        return '{"status":"error","message":"' + e.message + '"}';
    }
};

// -------------------------------------------------------
// Manual Position — auto-detects coord type
// -------------------------------------------------------
$._editflow.setPosition = function(xStr, yStr) {
    try {
        var x = parseFloat(xStr);
        var y = parseFloat(yStr);
        if (isNaN(x) || isNaN(y)) return '{"status":"error","message":"Invalid position"}';

        var seq = app.project.activeSequence;
        if (!seq) return '{"status":"error","message":"No active sequence"}';

        var sel = seq.getSelection();
        if (!sel || sel.length === 0) return '{"status":"error","message":"No clips selected"}';

        var results = [];

        for (var i = 0; i < sel.length; i++) {
            var posInfo = $._editflow._findPositionInfo(sel[i]);
            if (!posInfo) {
                results.push("Clip " + i + ": no Position");
                continue;
            }
            posInfo.prop.setValue([x, y], true);
            results.push("Clip " + i + ": set to (" + x + "," + y + ")");
        }

        var msg = results.join(" | ");
        return '{"status":"success","message":"' + msg.replace(/"/g, '\\"') + '","count":' + results.length + '}';
    } catch(e) {
        return '{"status":"error","message":"' + e.message + '"}';
    }
};

// -------------------------------------------------------
// Scale
// -------------------------------------------------------
$._editflow.setScaleValue = function(scaleStr) {
    try {
        var scale = parseFloat(scaleStr);
        if (isNaN(scale)) return '{"status":"error","message":"Invalid scale"}';

        var seq = app.project.activeSequence;
        if (!seq) return '{"status":"error","message":"No active sequence"}';

        var sel = seq.getSelection();
        if (!sel || sel.length === 0) return '{"status":"error","message":"No clips selected"}';

        var results = [];

        for (var i = 0; i < sel.length; i++) {
            var scaleInfo = $._editflow._findScaleProp(sel[i]);
            if (!scaleInfo) {
                results.push("Clip " + i + ": no Scale");
                continue;
            }
            var old = scaleInfo.prop.getValue();
            scaleInfo.prop.setValue(scale, true);
            results.push("Clip " + i + ": " + old + " -> " + scale + "%");
        }

        var msg = results.join(" | ");
        return '{"status":"success","message":"' + msg.replace(/"/g, '\\"') + '","count":' + results.length + '}';
    } catch(e) {
        return '{"status":"error","message":"' + e.message + '"}';
    }
};

// -------------------------------------------------------
// DEBUG — print all components and properties
// -------------------------------------------------------
$._editflow.debugClipComponents = function() {
    try {
        var sel = app.project.activeSequence.getSelection();
        if (!sel || sel.length === 0) return "ERROR: no clips selected";

        var clip = sel[0];
        var info = "Clip: " + clip.name + " || ";

        for (var c = 0; c < clip.components.numItems; c++) {
            var comp = clip.components[c];
            info += "COMP[" + c + "]=" + comp.displayName + ": ";

            for (var p = 0; p < comp.properties.numItems; p++) {
                var prop = comp.properties[p];
                var val = "";
                try { val = prop.getValue(); } catch(e2) { val = "?"; }
                info += p + "=" + prop.displayName + "(" + val + ") ";
            }
            info += " || ";
        }

        return info;
    } catch(e) {
        return "ERROR: " + e.message;
    }
};

$._editflow.resetAudioGain = function() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return '{"status":"error","message":"No sequence"}';

        var count = 0;

        // Helper: set Level to exactly 1.0 (= 0 dB)
        function resetProp(prop) {
            if (prop.isTimeVarying()) prop.setTimeVarying(false);
            prop.setValue(1.0, 1);
            // Verify it took
            var check = prop.getValue();
            if (Math.abs(check - 1.0) > 0.1) {
                // Try without flag
                prop.setValue(1.0);
            }
            count++;
        }

        // Try selection first
        var sel = seq.getSelection();
        if (sel && sel.length > 0) {
            for (var i = 0; i < sel.length; i++) {
                for (var c = 0; c < sel[i].components.numItems; c++) {
                    if (sel[i].components[c].displayName === "Volume") {
                        for (var p = 0; p < sel[i].components[c].properties.numItems; p++) {
                            if (sel[i].components[c].properties[p].displayName === "Level") {
                                resetProp(sel[i].components[c].properties[p]);
                            }
                        }
                    }
                }
            }
        }

        // Fallback: audio tracks at playhead
        if (count === 0) {
            var time = seq.getPlayerPosition();
            for (var t = 0; t < seq.audioTracks.numTracks; t++) {
                var track = seq.audioTracks[t];
                for (var ci = 0; ci < track.clips.numItems; ci++) {
                    var aClip = track.clips[ci];
                    if (aClip.start.ticks <= time.ticks && aClip.end.ticks > time.ticks) {
                        for (var ac = 0; ac < aClip.components.numItems; ac++) {
                            if (aClip.components[ac].displayName === "Volume") {
                                for (var ap = 0; ap < aClip.components[ac].properties.numItems; ap++) {
                                    if (aClip.components[ac].properties[ap].displayName === "Level") {
                                        resetProp(aClip.components[ac].properties[ap]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (count > 0) return '{"status":"success","message":"Reset to 0 dB","count":' + count + '}';
        return '{"status":"error","message":"No audio clip found"}';
    } catch(e) {
        return '{"status":"error","message":"' + e.message + '"}';
    }
};

// -------------------------------------------------------
// Read current audio level in dB
// -------------------------------------------------------
$._editflow.getAudioLevel = function() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) return '{"error":"no sequence"}';

        // Try selection first
        var sel = seq.getSelection();
        if (sel && sel.length > 0) {
            for (var i = 0; i < sel.length; i++) {
                var clip = sel[i];
                for (var c = 0; c < clip.components.numItems; c++) {
                    if (clip.components[c].displayName === "Volume") {
                        for (var p = 0; p < clip.components[c].properties.numItems; p++) {
                            if (clip.components[c].properties[p].displayName === "Level") {
                                var linear = clip.components[c].properties[p].getValue();
                                var db = 20 * (Math.log(linear) / Math.LN10);
                                return '{"db":' + Math.round(db * 10) / 10 + ',"linear":' + linear + '}';
                            }
                        }
                    }
                }
            }
        }

        // Try audio tracks at playhead
        var time = seq.getPlayerPosition();
        for (var t = 0; t < seq.audioTracks.numTracks; t++) {
            var track = seq.audioTracks[t];
            for (var ci = 0; ci < track.clips.numItems; ci++) {
                var aClip = track.clips[ci];
                if (aClip.start.ticks <= time.ticks && aClip.end.ticks > time.ticks) {
                    for (var ac = 0; ac < aClip.components.numItems; ac++) {
                        if (aClip.components[ac].displayName === "Volume") {
                            for (var ap = 0; ap < aClip.components[ac].properties.numItems; ap++) {
                                if (aClip.components[ac].properties[ap].displayName === "Level") {
                                    var lin2 = aClip.components[ac].properties[ap].getValue();
                                    var db2 = 20 * (Math.log(lin2) / Math.LN10);
                                    return '{"db":' + Math.round(db2 * 10) / 10 + ',"linear":' + lin2 + '}';
                                }
                            }
                        }
                    }
                }
            }
        }

        return '{"error":"no audio clip found"}';
    } catch(e) {
        return '{"error":"' + e.message + '"}';
    }
};

// -------------------------------------------------------
// Nudge audio level by deltaDd (e.g. +1 or -1)
// Reads current level, adds delta, sets new level
// -------------------------------------------------------
$._editflow.nudgeAudioLevel = function(deltaDbStr) {
    try {
        var deltaDd = parseFloat(deltaDbStr);
        if (isNaN(deltaDd)) return '{"status":"error","message":"Invalid delta"}';

        var seq = app.project.activeSequence;
        if (!seq) return '{"status":"error","message":"No sequence"}';

        var count = 0;
        var newDb = 0;

        // Helper: nudge a Volume > Level property
        function nudgeProp(prop) {
            var oldLinear = prop.getValue();
            var oldDb = 20 * (Math.log(oldLinear) / Math.LN10);
            newDb = oldDb + deltaDd;
            // Clamp to reasonable range: -96 to +24 dB
            if (newDb < -96) newDb = -96;
            if (newDb > 24) newDb = 24;
            var newLinear = Math.pow(10, newDb / 20.0);
            if (prop.isTimeVarying()) prop.setTimeVarying(false);
            prop.setValue(newLinear, 1);
            count++;
        }

        // Try selection first
        var sel = seq.getSelection();
        if (sel && sel.length > 0) {
            for (var i = 0; i < sel.length; i++) {
                for (var c = 0; c < sel[i].components.numItems; c++) {
                    if (sel[i].components[c].displayName === "Volume") {
                        for (var p = 0; p < sel[i].components[c].properties.numItems; p++) {
                            if (sel[i].components[c].properties[p].displayName === "Level") {
                                nudgeProp(sel[i].components[c].properties[p]);
                            }
                        }
                    }
                }
            }
        }

        // Fallback: audio tracks at playhead
        if (count === 0) {
            var time = seq.getPlayerPosition();
            for (var t = 0; t < seq.audioTracks.numTracks; t++) {
                var track = seq.audioTracks[t];
                for (var ci = 0; ci < track.clips.numItems; ci++) {
                    var aClip = track.clips[ci];
                    if (aClip.start.ticks <= time.ticks && aClip.end.ticks > time.ticks) {
                        for (var ac = 0; ac < aClip.components.numItems; ac++) {
                            if (aClip.components[ac].displayName === "Volume") {
                                for (var ap = 0; ap < aClip.components[ac].properties.numItems; ap++) {
                                    if (aClip.components[ac].properties[ap].displayName === "Level") {
                                        nudgeProp(aClip.components[ac].properties[ap]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (count > 0) {
            var rounded = Math.round(newDb * 10) / 10;
            return '{"status":"success","message":"' + (deltaDd > 0 ? '+' : '') + deltaDd + 'dB -> ' + rounded + 'dB","db":' + rounded + ',"count":' + count + '}';
        }
        return '{"status":"error","message":"No audio clip found"}';
    } catch(e) {
        return '{"status":"error","message":"' + e.message + '"}';
    }
};

$._editflow.debugQEClip = function() {
    try {
        var qeSeq = qe.project.getActiveSequence();
        var qeTrack = qeSeq.getAudioTrackAt(0);
        for (var j = 0; j < qeTrack.numItems; j++) {
            var qeClip = qeTrack.getItemAt(j);
            if (qeClip.type === "Clip") {
                var methods = "";
                for (var key in qeClip) { methods += key + " (" + typeof qeClip[key] + "), "; }
                return '{"status":"success","message":"' + methods.substring(0, 500).replace(/"/g, '\\"') + '"}';
            }
        }
        return '{"status":"error","message":"No clips in audio track 0"}';
    } catch(e) { return '{"status":"error","message":"' + e.message + '"}'; }
};

// Custom export with user-defined filename and path
$._editflow.exportCustom = function(presetPath, fileName, folderPath) {
    var seq = this.getSeq();
    if (!seq) return '{"status":"error","message":"Open a project."}';
    var folder;
    if (folderPath && folderPath !== "") {
        folder = new Folder(folderPath);
    } else {
        folder = new Folder(Folder.desktop.fsName + "/EditFlowPro_Exports");
    }
    if (!folder.exists) folder.create();
    var name = (fileName && fileName !== "") ? fileName : seq.name;
    // Sanitize filename
    name = name.replace(/[^a-zA-Z0-9_\-\. ]/g, "_");
    if (name.indexOf(".mp4") === -1) name += ".mp4";
    var out = folder.fsName + "/" + name;
    var f = new File(out); var d = 1;
    while (f.exists) { out = folder.fsName + "/" + name.replace(".mp4", "_v" + d + ".mp4"); f = new File(out); d++; }
    try {
        seq.exportAsMediaDirect(out, presetPath, 1);
        return '{"status":"success","message":"Exported ' + new File(out).name + '","filePath":"' + out.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"}';
    } catch(e) { return '{"status":"error","message":"' + e.message + '"}'; }
};

// =========================================================
// AI CAPTIONS — Whisper transcription pipeline
// Reads the flattened EFP JSON written by bin/transcriber.py,
// rebuilds an SRT in the requested grouping style, imports it
// into the project, and (best-effort) attaches it as a captions
// track on the active sequence.
// =========================================================

$._editflow.placeAnimatedCaptions = function(efpJsonPath, configJSON) {
    var seq = this.getSeq();
    if (!seq) return '{"status":"error","message":"Open a sequence."}';

    // ---- Read the transcription
    var data;
    try {
        var jf = new File(efpJsonPath);
        if (!jf.exists) return '{"status":"error","message":"Transcript JSON not found: ' + efpJsonPath + '"}';
        jf.encoding = "UTF-8";
        jf.open("r");
        var raw = jf.read();
        jf.close();
        data = eval("(" + raw + ")");
    } catch(e) {
        return '{"status":"error","message":"Bad transcript JSON: ' + e.message + '"}';
    }

    // ---- Parse caller config
    var cfg = {};
    try { cfg = eval("(" + (configJSON || "{}") + ")"); } catch(e) {}
    var groupStyle = cfg.style || "phrase";       // word | phrase | line
    var anim       = cfg.animation || "pop";       // pop | fade | slide-up | bounce | karaoke | typewriter | shake | glow | none
    var font       = cfg.font || "Arial";
    var sizePx     = parseInt(cfg.size, 10) || 72;
    var color      = cfg.color || "#FFFFFF";
    var highlight  = cfg.highlight || "#A855F7";
    var offsetSecs = parseFloat(cfg.offsetSecs) || 0;

    // ---- Build groups based on style
    var groups = [];   // each group: {start, end, text}
    var segs = data.segments || [];

    function pushGroup(s, e, t) {
        t = (t || "").replace(/^\s+|\s+$/g, "");
        if (!t) return;
        if (e <= s) e = s + 0.3;
        groups.push({start: s, end: e, text: t});
    }

    // IMPORTANT: We split by the segment TEXT (whitespace) rather than by
    // Whisper's tokens. Whisper tokens are subword units — for Arabic this
    // means a single shaped word like "ستخدمك" arrives as 3-4 tokens
    // ["س","تخ","دم","ك"]. Treating each token as a caption breaks the
    // Arabic shaping context. Splitting the joined text on whitespace gives
    // real words whose letters stay connected.
    function splitWords(s) {
        s = (s || "").replace(/^\s+|\s+$/g, "");
        if (!s) return [];
        return s.split(/\s+/);
    }

    if (groupStyle === "line") {
        for (var i = 0; i < segs.length; i++) pushGroup(segs[i].start, segs[i].end, segs[i].text);
    } else if (groupStyle === "word") {
        for (var i = 0; i < segs.length; i++) {
            var seg = segs[i];
            var words = splitWords(seg.text);
            if (words.length === 0) continue;
            var segDur = seg.end - seg.start;
            var per = segDur / words.length;
            for (var w = 0; w < words.length; w++) {
                pushGroup(seg.start + w * per, seg.start + (w + 1) * per, words[w]);
            }
        }
    } else { // phrase: ~3–5 words per caption, split by whitespace
        for (var i = 0; i < segs.length; i++) {
            var seg = segs[i];
            var words = splitWords(seg.text);
            if (words.length === 0) continue;
            var segDur = seg.end - seg.start;
            var per = segDur / words.length;
            var step = 4;
            for (var k = 0; k < words.length; k += step) {
                var chunkN = Math.min(step, words.length - k);
                var chunkWords = words.slice(k, k + chunkN);
                pushGroup(seg.start + k * per,
                          seg.start + (k + chunkN) * per,
                          chunkWords.join(" "));
            }
        }
    }

    if (groups.length === 0) {
        return '{"status":"error","message":"No transcript groups produced."}';
    }

    // ---- Emit our own SRT next to the JSON. Whisper-cli writes one too,
    //      but we override grouping to honour the user's chosen style.
    function pad(n, w) { var s = "" + n; while (s.length < w) s = "0" + s; return s; }
    function secToSRT(t) {
        if (t < 0) t = 0;
        var h = Math.floor(t / 3600);
        var m = Math.floor((t % 3600) / 60);
        var s = Math.floor(t % 60);
        var ms = Math.round((t - Math.floor(t)) * 1000);
        return pad(h, 2) + ":" + pad(m, 2) + ":" + pad(s, 2) + "," + pad(ms, 3);
    }
    // ExtendScript's writeln() emits a lone CR on macOS, which Premiere's
    // SRT importer rejects with "generic error". We write CRLF + UTF-8 BOM
    // explicitly so the file matches the SRT spec on every platform.
    var srtPath = efpJsonPath.replace(/\.efp\.json$/, "") + ".efp." + groupStyle + ".srt";
    var sf = new File(srtPath);
    sf.encoding = "UTF-8";
    sf.lineFeed = "Windows";   // ensures \r\n on writeln
    sf.open("w");
    sf.write("﻿");        // UTF-8 BOM — required for Arabic/RTL captions
    for (var i = 0; i < groups.length; i++) {
        var g = groups[i];
        sf.write((i + 1) + "\r\n");
        sf.write(secToSRT(g.start + offsetSecs) + " --> " + secToSRT(g.end + offsetSecs) + "\r\n");
        sf.write(g.text + "\r\n");
        sf.write("\r\n");
    }
    sf.close();

    // ---- Import the SRT into the project root
    var imported = null;
    try {
        var beforeCount = app.project.rootItem.children.numItems;
        app.project.importFiles([srtPath], false, app.project.rootItem, false);
        var afterCount = app.project.rootItem.children.numItems;
        // Pick the most recently added item that ends with .srt
        for (var i = afterCount - 1; i >= 0; i--) {
            var item = app.project.rootItem.children[i];
            if (item && item.name && /\.srt$/i.test(item.name)) { imported = item; break; }
        }
    } catch(e) {
        return '{"status":"error","message":"SRT import failed: ' + e.message + '"}';
    }

    // ---- Try to attach as a captions track. The Premiere DOM has shipped
    //      several different captions APIs across versions; we attempt the
    //      most likely ones and fall back to placing the SRT on a video
    //      track so the user can right-click → "Convert to Captions".
    var placed = false;
    var placedHow = "";

    // Attempt 1: native Sequence.createCaptionTrack from imported subtitle
    if (!placed && imported) {
        try {
            if (typeof seq.createCaptionTrack === "function") {
                seq.createCaptionTrack(imported);
                placed = true; placedHow = "createCaptionTrack";
            }
        } catch(e) {}
    }
    // Attempt 2: insert on existing captions track
    if (!placed && imported) {
        try {
            if (seq.captionTracks && seq.captionTracks.numTracks > 0) {
                var ct = seq.captionTracks[0];
                if (ct.insertClip) { ct.insertClip(imported, 0); placed = true; placedHow = "captionTracks.insertClip"; }
            }
        } catch(e) {}
    }
    // Attempt 3: drop on the topmost video track at the playhead
    if (!placed && imported) {
        try {
            var topV = seq.videoTracks[seq.videoTracks.numTracks - 1];
            topV.insertClip(imported, seq.getPlayerPosition());
            placed = true; placedHow = "videoTrack (manual: right-click → Convert to Captions)";
        } catch(e) {}
    }

    // ---- Best-effort styling. Premiere parks the imported subtitle
    //      differently across versions: as a real Caption on
    //      captionTracks, as a "Caption" item dropped onto a videoTrack,
    //      or as a graphic. We scan every track type and probe every
    //      property name the API has shipped over the years.
    var styledCount = 0;
    var fontKeys  = ["fontName", "font", "typeface", "fontFace", "captionFontName"];
    var sizeKeys  = ["fontSize", "captionFontSize", "size"];
    var colorKeys = ["color", "fillColor", "captionColor", "fontColor"];

    function tryStyle(item) {
        if (!item) return false;
        var did = false;
        for (var k = 0; k < fontKeys.length; k++) {
            try { item[fontKeys[k]] = font; did = true; } catch(e) {}
        }
        for (var k = 0; k < sizeKeys.length; k++) {
            try { item[sizeKeys[k]] = sizePx; did = true; } catch(e) {}
        }
        for (var k = 0; k < colorKeys.length; k++) {
            try { item[colorKeys[k]] = color; did = true; } catch(e) {}
        }
        try { if (item.style) { item.style.fontName = font; item.style.fontSize = sizePx; did = true; } } catch(e) {}
        try {
            if (item.properties && item.properties.numItems !== undefined) {
                for (var p = 0; p < item.properties.numItems; p++) {
                    var prop = item.properties[p];
                    var nm = ""; try { nm = prop.displayName || prop.name || ""; } catch(e) {}
                    if (/font/i.test(nm) && /name|family/i.test(nm)) {
                        try { prop.setValue(font, true); did = true; } catch(e) {}
                    }
                }
            }
        } catch(e) {}
        return did;
    }

    function scanTracks(coll, restrictToCaptionLooking) {
        if (!coll || coll.numTracks === undefined) return;
        for (var ti = 0; ti < coll.numTracks; ti++) {
            var tk = coll[ti];
            if (!tk || !tk.clips) continue;
            for (var ci = 0; ci < tk.clips.numItems; ci++) {
                var item = tk.clips[ci];
                if (!item) continue;
                if (restrictToCaptionLooking) {
                    var nm = ""; try { nm = item.name || ""; } catch(e) {}
                    var isCap = /\.srt$/i.test(nm) || /caption/i.test(nm) || /subtitle/i.test(nm);
                    if (!isCap) continue;
                }
                if (tryStyle(item)) styledCount++;
            }
        }
    }

    try { scanTracks(seq.captionTracks, false); } catch(e) {}
    try { scanTracks(seq.videoTracks,   true); } catch(e) {}

    var msg = "Transcribed " + groups.length + " " + groupStyle + " caption(s)";
    if (placed) msg += " and placed via " + placedHow + ".";
    else msg += ". SRT imported to project — drag onto a captions track.";
    if (styledCount > 0) msg += " Styled " + styledCount + " with " + font + ".";
    else msg += " Manual style: open Essential Graphics, set Font='" + font + "'.";

    return '{"status":"success","message":"' + msg.replace(/"/g,'\\"') + '","groups":' + groups.length +
           ',"placed":' + placed + ',"styled":' + styledCount + ',"font":"' + font.replace(/"/g,'\\"') + '","animation":"' + anim + '","srt":"' + srtPath.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '"}';
};

// =========================================================
// ANIMATED CAPTIONS V2 — Place pre-rendered MOV clips
// Reads a manifest JSON with clip paths + timecodes, imports
// them into a project bin, and places each on a video track.
// =========================================================

$._editflow.placeRenderedCaptions = function(manifestPath, configJSON) {
    var me = this;
    var seq = this.getSeq();
    if (!seq) return '{"status":"error","message":"Open a sequence."}';

    // Read manifest file
    var manifest;
    try {
        var mf = new File(manifestPath);
        if (!mf.exists) return '{"status":"error","message":"Manifest file not found."}';
        mf.encoding = "UTF-8";
        mf.open("r");
        var raw = mf.read();
        mf.close();
        manifest = eval("(" + raw + ")");
    } catch(e) {
        return '{"status":"error","message":"Bad manifest: ' + e.message + '"}';
    }

    var cfg = {};
    try { cfg = eval("(" + (configJSON || "{}") + ")"); } catch(e) {}
    var offsetSecs = parseFloat(cfg.offsetSecs) || 0;

    var clips = manifest.clips || [];
    if (clips.length === 0) return '{"status":"error","message":"No clips in manifest."}';

    // Collect import paths
    var paths = [];
    for (var i = 0; i < clips.length; i++) {
        paths.push(clips[i].path);
    }

    // Create a bin so caption clips are organized
    var binName = "EFP_Captions";
    var bin = null;
    try {
        // Reuse existing bin if present
        for (var b = 0; b < app.project.rootItem.children.numItems; b++) {
            var child = app.project.rootItem.children[b];
            if (child.name === binName && child.type === 2) { bin = child; break; }
        }
        if (!bin) bin = app.project.rootItem.createBin(binName);
    } catch(e) { bin = app.project.rootItem; }

    // Import all clips at once
    try {
        app.project.importFiles(paths, false, bin, false);
    } catch(e) {
        return '{"status":"error","message":"Import failed: ' + e.message + '"}';
    }

    // Build a lookup: filename → project item
    var itemMap = {};
    try {
        for (var i = 0; i < bin.children.numItems; i++) {
            var item = bin.children[i];
            if (item && item.name) itemMap[item.name] = item;
        }
    } catch(e) {}

    // Pick the topmost video track for captions overlay
    var trackIdx = seq.videoTracks.numTracks - 1;
    var track = seq.videoTracks[trackIdx];

    var placedCount = 0;
    for (var i = 0; i < clips.length; i++) {
        var c = clips[i];
        var startSec = c.start + offsetSecs;

        // Extract filename from full path
        var fname = c.path.replace(/^.*[\/\\]/, "");
        var pItem = itemMap[fname];
        if (!pItem) {
            // Try without extension
            var noExt = fname.replace(/\.[^.]+$/, "");
            for (var k in itemMap) {
                if (k.indexOf(noExt) === 0) { pItem = itemMap[k]; break; }
            }
        }
        if (!pItem) continue;

        var startTicks = me.secToTicks(startSec);
        try {
            track.overwriteClip(pItem, startTicks);
            placedCount++;
        } catch(e) {
            try {
                track.insertClip(pItem, startTicks);
                placedCount++;
            } catch(e2) {
                me.log("placeRenderedCaptions: failed to place clip " + i + ": " + e2.message);
            }
        }
    }

    var anim = manifest.animation || "none";
    var fontName = manifest.font || "unknown";
    var msg = "Placed " + placedCount + "/" + clips.length + " captions";
    msg += " (" + fontName + ", " + anim + " animation).";

    return '{"status":"success","message":"' + msg.replace(/"/g, '\\"') + '","placed":' + placedCount + ',"total":' + clips.length + '}';
};

// =========================================================
// AUTO-CUT SILENCE — FFmpeg analysis + QE razor + ripple
// Reads silence ranges from a JSON file produced by
// bin/silence_detector.py, razors every silence boundary on
// the active sequence, then removes the silent middle
// segments (with ripple) on every track.
// =========================================================

$._editflow.applySilenceCuts = function(jsonPath, offsetSecs, rippleFlag) {
    var seq = this.getSeq();
    if (!seq) return '{"status":"error","message":"Open a sequence."}';

    // Read silence JSON
    var data;
    try {
        var f = new File(jsonPath);
        if (!f.exists) return '{"status":"error","message":"Silence JSON not found: ' + jsonPath + '"}';
        f.encoding = "UTF-8";
        f.open("r");
        var raw = f.read();
        f.close();
        data = eval("(" + raw + ")");
    } catch(e) {
        return '{"status":"error","message":"Bad silence JSON: ' + e.message + '"}';
    }

    var silences = data.silences || [];
    if (silences.length === 0) {
        return '{"status":"success","message":"No silences detected — nothing to cut.","silences":0,"deleted":0}';
    }

    var offset = parseFloat(offsetSecs) || 0;
    var ripple = (rippleFlag === "false" || rippleFlag === false) ? false : true;

    // Enable QE DOM
    try { app.enableQE(); } catch(e) {
        return '{"status":"error","message":"QE DOM unavailable."}';
    }
    var qeSeq;
    try { qeSeq = qe.project.getActiveSequence(); } catch(e) {
        return '{"status":"error","message":"Cannot access QE sequence."}';
    }
    if (!qeSeq) return '{"status":"error","message":"No active QE sequence."}';

    // Frame rate (qe returns string like "29.97")
    var fps = 30;
    try {
        var fr = qeSeq.getFrameRate();
        var p = parseFloat(fr);
        if (p && p > 0) fps = p;
    } catch(e) {}
    var fpsRound = Math.round(fps);

    function pad2(n) { return (n < 10) ? "0" + n : "" + n; }
    function secToTC(sec) {
        if (sec < 0) sec = 0;
        var totalFrames = Math.round(sec * fps);
        var ff = totalFrames % fpsRound;
        var totalSec = Math.floor(totalFrames / fpsRound);
        var ss = totalSec % 60;
        var mm = Math.floor(totalSec / 60) % 60;
        var hh = Math.floor(totalSec / 3600);
        return pad2(hh) + ":" + pad2(mm) + ":" + pad2(ss) + ":" + pad2(ff);
    }

    // 1) Razor every boundary. Process in DESCENDING order so cuts
    //    don't shift later targets when ripple is off.
    var sorted = silences.slice().sort(function(a, b) { return b.start - a.start; });
    var razorCount = 0;
    for (var i = 0; i < sorted.length; i++) {
        var s = sorted[i].start + offset;
        var e = sorted[i].end + offset;
        try { qeSeq.razor(secToTC(s)); razorCount++; } catch(err) {}
        try { qeSeq.razor(secToTC(e)); razorCount++; } catch(err) {}
    }

    // 2) Walk every track, remove items that fall inside any silence
    var deletedCount = 0;
    var tol = 0.02; // seconds tolerance for boundary match
    var tracks = [];
    try {
        for (var v = 0; v < qeSeq.numVideoTracks; v++) tracks.push(qeSeq.getVideoTrackAt(v));
    } catch(e) {}
    try {
        for (var a = 0; a < qeSeq.numAudioTracks; a++) tracks.push(qeSeq.getAudioTrackAt(a));
    } catch(e) {}

    function clipInsideSilence(startSec, endSec) {
        for (var si = 0; si < silences.length; si++) {
            var ss = silences[si].start + offset;
            var es = silences[si].end + offset;
            if (startSec >= ss - tol && endSec <= es + tol) return true;
        }
        return false;
    }

    for (var t = 0; t < tracks.length; t++) {
        var track = tracks[t];
        var n = 0;
        try { n = track.numItems; } catch(e) { continue; }
        // iterate in REVERSE so removal does not shift earlier indices
        for (var idx = n - 1; idx >= 0; idx--) {
            try {
                var item = track.getItemAt(idx);
                if (!item || item.type !== "Clip") continue;
                var sSec = (item.start && item.start.secs !== undefined) ? item.start.secs : 0;
                var eSec = (item.end && item.end.secs !== undefined) ? item.end.secs : 0;
                if (!clipInsideSilence(sSec, eSec)) continue;
                // Try every removal signature Premiere has shipped
                var removed = false;
                try { item.remove(ripple, true); removed = true; } catch(e1) {}
                if (!removed) { try { item.remove(true, ripple); removed = true; } catch(e2) {} }
                if (!removed) { try { track.removeItem(item, ripple, true); removed = true; } catch(e3) {} }
                if (removed) deletedCount++;
            } catch(err) {}
        }
    }

    return '{"status":"success","message":"Cut ' + silences.length + ' silences (' + deletedCount + ' segments removed, ' + razorCount + ' razors).","silences":' + silences.length + ',"razors":' + razorCount + ',"deleted":' + deletedCount + ',"ripple":' + ripple + '}';
};

$._editflow_loaded = true;
