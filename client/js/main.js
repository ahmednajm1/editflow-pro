// main.js - EditFlow Pro v16 — Fixed per fix prompt
// ES5 only. Direct csInterface.evalScript for ALL buttons.

var csInterface = null, dsp = null;
var fsModule = null, osModule = null, execModule = null;
var foundPresetPath = null, extensionPath = "", configPath = "";
var operationRunning = false, statusTimer = null;
var settings = {voice:[2,3,5], music:[-9,-16,-21], scale:[115,130,150,175,200], bitrate:10};

document.addEventListener("DOMContentLoaded", function() {
    try { fsModule = require("fs"); } catch(e) { console.warn("[EFP] No fs:", e.message); }
    try { osModule = require("os"); } catch(e) { console.warn("[EFP] No os:", e.message); }
    try { execModule = require("child_process").exec; } catch(e) { console.warn("[EFP] No exec:", e.message); }

    try {
        csInterface = new CSInterface();
        extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
        configPath = extensionPath + "/editflow_config.json";
        if (fsModule) { loadSettings(); findExportPreset(); }
        try { dsp = new DSPTools(); } catch(e) {}
    } catch(e) {
        console.log("[CRITICAL] CSInterface init failed:", e.message);
    }

    // Step 5: Verify JSX is loaded
    csInterface.evalScript('typeof $._editflow_loaded', function(result) {
        console.log("[JSX] _editflow_loaded = " + result);
        if (result !== "boolean") {
            console.log("[CRITICAL] hostscript.jsx not loaded! Loading manually...");
            var jsxPath = csInterface.getSystemPath(SystemPath.EXTENSION) + "/jsx/hostscript.jsx";
            csInterface.evalScript('$.evalFile("' + jsxPath.replace(/\\/g, "\\\\") + '")', function(r2) {
                console.log("[JSX] Manual load result: " + r2);
                csInterface.evalScript('typeof $._editflow_loaded', function(r3) {
                    console.log("[JSX] After manual load: _editflow_loaded = " + r3);
                    if (r3 === "boolean") {
                        showStatus("EditFlow Pro ready.", "green");
                    } else {
                        showStatus("JSX load failed!", "red");
                    }
                });
            });
        } else {
            showStatus("EditFlow Pro ready.", "green");
        }
    });



    // ============================================================
    // AUDIO LEVEL — Nudge Up/Down + Display
    // ============================================================

    function updateAudioDisplay() {
        csInterface.evalScript('$._editflow.getAudioLevel()', function(result) {
            try {
                var info = JSON.parse(result);
                var display = document.getElementById('audio-level-display');
                if (info.error) {
                    display.textContent = '— dB';
                    display.style.color = '#666';
                    return;
                }
                var db = info.db;
                display.textContent = (db > 0 ? '+' : '') + db + ' dB';
                if (db > 0) {
                    display.style.color = '#81c784'; // green
                } else if (db < 0) {
                    display.style.color = '#f87171'; // red
                } else {
                    display.style.color = '#4fc3f7'; // blue = 0
                }
            } catch(e) {
                document.getElementById('audio-level-display').textContent = '— dB';
            }
        });
    }

    // Nudge UP (+1 dB)
    (function() {
        var btn = document.getElementById('btn-audio-up');
        if (!btn) return;
        btn.addEventListener('click', function() {
            csInterface.evalScript('$._editflow.nudgeAudioLevel("1")', function(result) {
                console.log('[AUDIO] Up:', result);
                handleJSXResult(result);
                updateAudioDisplay();
            });
        });
    })();

    // Nudge DOWN (-1 dB)
    (function() {
        var btn = document.getElementById('btn-audio-down');
        if (!btn) return;
        btn.addEventListener('click', function() {
            csInterface.evalScript('$._editflow.nudgeAudioLevel("-1")', function(result) {
                console.log('[AUDIO] Down:', result);
                handleJSXResult(result);
                updateAudioDisplay();
            });
        });
    })();



    // Update display periodically
    setInterval(updateAudioDisplay, 3000);
    updateAudioDisplay();

    // ============================================================
    // SCALE BUTTONS
    // ============================================================
    function bindScaleButton(buttonId, scaleValue) {
        var el = document.getElementById(buttonId);
        if (!el) {
            console.log("[BIND] " + buttonId + " NOT FOUND");
            return;
        }
        el.addEventListener("click", function() {
            console.log("[->JSX] applyScale: " + scaleValue);
            csInterface.evalScript(
                '$._editflow.applyScale("' + scaleValue + '")',
                function(result) {
                    console.log("[<-JSX] applyScale result:", result);
                    handleJSXResult(result);
                }
            );
        });
        console.log("[BIND] " + buttonId + " OK");
    }
    bindScaleButton("btn-scale-115", "115");
    bindScaleButton("btn-scale-130", "130");
    bindScaleButton("btn-scale-150", "150");
    bindScaleButton("btn-scale-175", "175");
    bindScaleButton("btn-scale-200", "200");
    bindScaleButton("btn-scale-reset", "100");



    // ============================================================
    // ALIGN & TRANSFORM v2 — LIVE INFO BAR + SMART ALIGNMENT
    // ============================================================

    // ---- LIVE INFO BAR ----
    function updateClipInfo() {
        csInterface.evalScript('$._editflow.getSequenceInfo()', function(seqResult) {
            try {
                var seq = JSON.parse(seqResult);
                if (seq.error) {
                    document.getElementById('seq-info').textContent = '⚠️ ' + seq.error;
                    return;
                }
                document.getElementById('seq-info').textContent =
                    '📺 ' + seq.resolution + ' — ' + seq.orientation +
                    ' (center: ' + seq.centerX + ', ' + seq.centerY + ')';
            } catch(e) {
                document.getElementById('seq-info').textContent = '📺 Error reading sequence';
            }
        });

        csInterface.evalScript('$._editflow.getClipPositionInfo()', function(result) {
            try {
                var info = JSON.parse(result);

                if (info.error) {
                    document.getElementById('pos-info').style.display = 'none';
                    document.getElementById('offset-info').style.display = 'none';
                    document.getElementById('scale-info').style.display = 'none';
                    document.getElementById('coord-type-info').style.display = 'none';
                    return;
                }

                // Position
                document.getElementById('pos-info').style.display = 'block';
                document.getElementById('current-pos').textContent =
                    'X=' + Math.round(info.posX * 100) / 100 +
                    '  Y=' + Math.round(info.posY * 100) / 100;
                document.getElementById('center-pos').textContent =
                    'X=' + info.centerX + '  Y=' + info.centerY;

                // Offset
                document.getElementById('offset-info').style.display = 'block';
                var offsetEl = document.getElementById('offset-text');
                if (info.isCentered) {
                    offsetEl.textContent = '✅ Centered!';
                    offsetEl.style.color = '#81c784';
                } else {
                    var xDir = info.offsetX > 0 ? 'right' : 'left';
                    var yDir = info.offsetY > 0 ? 'down' : 'up';
                    offsetEl.textContent =
                        '⚠️ Off-center: ' +
                        Math.abs(info.offsetX) + 'px ' + xDir + ', ' +
                        Math.abs(info.offsetY) + 'px ' + yDir;
                    offsetEl.style.color = '#ffb74d';
                }

                // Scale
                document.getElementById('scale-info').style.display = 'block';
                document.getElementById('current-scale').textContent = info.scale + '%';

                // Coord type
                document.getElementById('coord-type-info').style.display = 'block';
                document.getElementById('coord-type-text').textContent =
                    '🔧 Component: ' + info.component +
                    ' | Coords: ' + info.coordType +
                    ' | Clip: ' + info.clipName;

                // Update placeholders
                document.getElementById('pos-x').placeholder = Math.round(info.posX * 100) / 100;
                document.getElementById('pos-y').placeholder = Math.round(info.posY * 100) / 100;
                document.getElementById('scale-value').placeholder = Math.round(info.scale);

            } catch(e) {
                console.log('[CLIP-INFO] Parse error:', e, result);
            }
        });
    }

    // Refresh button
    document.getElementById('refresh-clip-info').addEventListener('click', function() {
        updateClipInfo();
    });

    // Auto-refresh every 2 seconds
    setInterval(updateClipInfo, 2000);

    // Initial update
    updateClipInfo();

    // ---- ALIGNMENT BUTTONS (7 directions) ----
    function bindAlignV2(buttonId, direction) {
        var el = document.getElementById(buttonId);
        if (!el) { console.log("[BIND] " + buttonId + " NOT FOUND"); return; }
        el.addEventListener("click", function() {
            console.log("[ALIGN] " + direction);
            csInterface.evalScript(
                '$._editflow.alignClip("' + direction + '")',
                function(result) {
                    console.log("[ALIGN] Result:", result);
                    handleJSXResult(result);
                    updateClipInfo();
                }
            );
        });
        console.log("[BIND] " + buttonId + " OK");
    }

    bindAlignV2("align-left", "left");
    bindAlignV2("align-right", "right");
    bindAlignV2("align-center-h", "centerH");
    bindAlignV2("align-top", "top");
    bindAlignV2("align-bottom", "bottom");
    bindAlignV2("align-center-v", "centerV");
    bindAlignV2("align-center-both", "centerBoth");

    // ---- NUDGE ARROWS (move clip by step) ----
    function bindNudge(buttonId, direction) {
        var el = document.getElementById(buttonId);
        if (!el) return;
        el.addEventListener("click", function() {
            var step = document.getElementById("nudge-step").value || "10";
            csInterface.evalScript(
                '$._editflow.nudgePosition("' + direction + '","' + step + '")',
                function(result) {
                    console.log("[NUDGE] " + direction + ":", result);
                    updateClipInfo(); // instant feedback
                }
            );
        });
    }
    bindNudge("nudge-left", "left");
    bindNudge("nudge-right", "right");
    bindNudge("nudge-up", "up");
    bindNudge("nudge-down", "down");

    // ---- MANUAL POSITION ----
    (function() {
        var btn = document.getElementById("apply-position");
        var posX = document.getElementById("pos-x");
        var posY = document.getElementById("pos-y");
        if (!btn || !posX || !posY) return;

        function applyPosition() {
            var x = posX.value;
            var y = posY.value;
            if (!x || !y) return;
            console.log("[POSITION] " + x + "," + y);
            csInterface.evalScript(
                '$._editflow.setPosition("' + x + '","' + y + '")',
                function(result) {
                    console.log("[POSITION] Result:", result);
                    handleJSXResult(result);
                    updateClipInfo();
                }
            );
        }

        btn.addEventListener("click", applyPosition);
        posX.addEventListener("keydown", function(e) { if (e.keyCode === 13) applyPosition(); });
        posY.addEventListener("keydown", function(e) { if (e.keyCode === 13) applyPosition(); });
        console.log("[BIND] apply-position OK");
    })();

    // ---- MANUAL SCALE ----
    (function() {
        var btn = document.getElementById("apply-scale");
        var scaleInput = document.getElementById("scale-value");
        if (!btn || !scaleInput) return;

        function applyScale() {
            var s = scaleInput.value;
            if (!s) return;
            console.log("[SCALE] " + s + "%");
            csInterface.evalScript(
                '$._editflow.setScaleValue("' + s + '")',
                function(result) {
                    console.log("[SCALE] Result:", result);
                    handleJSXResult(result);
                    updateClipInfo();
                }
            );
        }

        btn.addEventListener("click", applyScale);
        scaleInput.addEventListener("keydown", function(e) { if (e.keyCode === 13) applyScale(); });
        console.log("[BIND] apply-scale OK");
    })();

    // ============================================================
    // EXPORT PATH BROWSER
    // ============================================================
    (function() {
        var browseBtn = document.getElementById("btn-export-browse");
        if (browseBtn) {
            browseBtn.addEventListener("click", function() {
                csInterface.evalScript('Folder.selectDialog("Select Export Folder").fsName', function(result) {
                    if (result && result !== "null" && result !== "undefined" && result !== "EvalScript error.") {
                        document.getElementById("export-path").value = result;
                        console.log("[Export] Save path set: " + result);
                    }
                });
            });
            console.log("[BIND] btn-export-browse OK");
        }
    })();



    // ============================================================
    // WORKING BUTTONS — kept exactly as-is
    // ============================================================

    safeBind("btn-beat-markers", function() {
        if (!fsModule || operationRunning || !dsp) return;
        var band = document.getElementById("beat-band-select").value;
        showProgress("Finding audio...", 5);
        csInterface.evalScript('$._editflow.getAudioMedia()', function(raw) {
            var r = safeParse(raw); if (!r || !r.mediaPath) { hideProgress(); return; }
            showProgress("Reading file...", 15);
            fsModule.readFile(r.mediaPath, function(err, buffer) {
                if (err) { showStatus("Can't read file.", "red"); hideProgress(); return; }
                var ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
                showProgress("Detecting beats...", 30);
                dsp.decodeAudio(ab).then(function(audioBuf) {
                    var prec = document.getElementById("beat-precision-select").value;
                    dsp.detectBeats(audioBuf, band, prec, function(pct) {
                        showProgress("Detecting " + pct + "%", 30 + pct * 0.6);
                    }).then(function(beats) {
                        showProgress("Placing markers...", 95);
                        csInterface.evalScript('$._editflow.placeBeatMarkers("[' + beats.join(",") + ']",' + (r.timelineStart||0) + ')', function(res) {
                            showProgress("Done!", 100); setTimeout(hideProgress, 2000);
                            handleJSXResult(res);
                        });
                    });
                }).catch(function() { showStatus("Decode failed.", "red"); hideProgress(); });
            });
        });
    });

    // ============================================================
    // AI CAPTIONS — Whisper transcription + animated captions
    // ============================================================
    safeBind("btn-generate-captions", function() {
        if (!fsModule || !execModule || !osModule) {
            showStatus("Node modules unavailable.", "red"); return;
        }
        if (operationRunning) return;

        var lang  = document.getElementById("cap-language").value;
        var model = document.getElementById("cap-model").value;
        var style = document.getElementById("cap-style").value;
        var anim  = document.getElementById("cap-animation").value;
        var font  = document.getElementById("cap-font").value;
        var size  = document.getElementById("cap-size").value;
        var color = document.getElementById("cap-color").value;
        var hl    = document.getElementById("cap-highlight").value;

        var statusLine = document.getElementById("cap-status");
        function setStatus(t) { if (statusLine) statusLine.textContent = t; }

        showProgress("Finding audio...", 3);
        setStatus("Reading selection…");
        csInterface.evalScript('$._editflow.getAudioMedia()', function(raw) {
            var info = safeParse(raw);
            if (!info || !info.mediaPath) {
                hideProgress(); setStatus(""); showStatus("Select an audio/video clip first.", "red"); return;
            }
            var mediaPath = info.mediaPath;
            var timelineStart = info.timelineStart || 0;
            var clipIn  = info.clipIn  || 0;
            var clipOut = info.clipOut || 0;
            var clipDur = info.duration || 0;

            var transcriber = extensionPath + "/bin/transcriber.py";
            if (!fsModule.existsSync(transcriber)) {
                hideProgress(); setStatus(""); showStatus("transcriber.py missing.", "red"); return;
            }
            var outBase = osModule.tmpdir() + "/efp_caps_" + Date.now();

            function shq(s) { return '"' + String(s).replace(/(["\\$`])/g, "\\$1") + '"'; }
            var cmd = "/usr/bin/env python3 " + shq(transcriber) + " " + shq(mediaPath) + " " + shq(outBase) +
                      " --lang " + shq(lang) + " --model " + shq(model);
            // Trim to the actual selection so we don't transcribe the whole source file
            if (clipDur > 0.1 && clipOut > clipIn) {
                cmd += " --start " + clipIn.toFixed(3) + " --end " + clipOut.toFixed(3);
            }

            var modelSize = ({tiny:75, base:140, small:460, medium:1500, large:3000})[model] || 460;
            var trimNote = (clipDur > 0.1) ? (" · " + clipDur.toFixed(1) + "s of " + (info.clipName || "clip")) : "";
            showProgress("Transcribing with Whisper (" + model + ")…", 15);
            setStatus("Whisper " + model + trimNote + " · model = " + modelSize + " MB on first run");
            console.log("[Captions] running:", cmd);
            console.log("[Captions] clip in/out:", clipIn, clipOut, "duration:", clipDur);

            // Whisper jobs can be slow; allow up to 30 min and a big stdout buffer
            var opts = { maxBuffer: 16 * 1024 * 1024, timeout: 30 * 60 * 1000 };
            execModule(cmd, opts, function(err, stdout, stderr) {
                if (err) {
                    hideProgress(); setStatus("");
                    console.log("[Captions] err:", err.message, "\nstderr:", stderr);
                    showStatus("Transcription failed: " + (err.message || "see console").slice(0, 80), "red");
                    return;
                }
                var summary = safeParse(stdout) || {};
                console.log("[Captions] summary:", summary);
                if (summary.status !== "success") {
                    hideProgress(); setStatus("");
                    showStatus("Transcriber error: " + (summary.message || "unknown"), "red");
                    return;
                }

                showProgress("Placing " + summary.segments + " captions…", 80);
                setStatus("Detected " + summary.language + " · " + summary.words + " words · " + summary.segments + " segments");

                // Build the JSX config object as JSON-ish text safe to paste into evalScript
                var cfg = {
                    style: style, animation: anim, font: font,
                    size: size, color: color, highlight: hl,
                    offsetSecs: timelineStart
                };
                var cfgStr = JSON.stringify(cfg).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                var jsonEsc = summary.json.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

                csInterface.evalScript(
                    '$._editflow.placeAnimatedCaptions("' + jsonEsc + '","' + cfgStr + '")',
                    function(res) {
                        showProgress("Done!", 100); setTimeout(hideProgress, 2500);
                        console.log("[Captions] place result:", res);
                        handleJSXResult(res);
                        var r = safeParse(res);
                        if (r && r.placed) {
                            setStatus("✅ " + summary.words + " words placed (" + style + " · " + anim + ")");
                        } else if (r) {
                            setStatus("⚠️ SRT imported to project — drag it onto a captions track.");
                        }
                    }
                );
            });
        });
    });

    safeBind("btn-clear-markers", function() {
        showConfirm("Clear Markers", "Delete all markers?", function() {
            csInterface.evalScript('$._editflow.clearMarkers()', function(res) {
                console.log("[<-JSX] clearMarkers:", res);
                handleJSXResult(res);
            });
        });
    });

    safeBind("btn-export-selected", function() {
        if (!foundPresetPath || !fsModule) { showStatus("No export preset.", "red"); return; }
        var fileName = (document.getElementById("export-filename").value || "").trim();
        var savePath = (document.getElementById("export-path").value || "").trim();
        console.log("[Export] File: " + (fileName || "(auto)") + " | Path: " + (savePath || "(default)"));
        showProgress("Preparing...", 10);
        modifyPresetBitrate(function(tmp, br) {
            showProgress("Exporting (" + br + " Mbps)...", 40);
            var fnEsc = fileName.replace(/\\/g,"\\\\").replace(/"/g,'\\"');
            var fpEsc = savePath.replace(/\\/g,"\\\\").replace(/"/g,'\\"');
            console.log("[Export] Bitrate: " + br + " Mbps");
            csInterface.evalScript('$._editflow.exportCustom("' + tmp.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '", "' + fnEsc + '", "' + fpEsc + '")', function(res) {
                showProgress("Done!", 100); setTimeout(hideProgress, 2000);
                console.log("[<-JSX] exportCustom:", res);
                handleJSXResult(res);
                try { fsModule.unlinkSync(tmp); } catch(e) {}
            });
        });
    });

    safeBind("btn-export-all", function() {
        if (!foundPresetPath || !fsModule) { showStatus("No export preset.", "red"); return; }
        var savePath = (document.getElementById("export-path").value || "").trim();
        console.log("[Export All] Path: " + (savePath || "(default)"));
        showProgress("Batch exporting...", 10);
        modifyPresetBitrate(function(tmp, br) {
            showProgress("Exporting (" + br + " Mbps)...", 30);
            csInterface.evalScript('$._editflow.exportAll("' + tmp.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '")', function(res) {
                showProgress("Done!", 100); setTimeout(hideProgress, 2000);
                handleJSXResult(res);
                try { fsModule.unlinkSync(tmp); } catch(e) {}
            });
        });
    });

    safeBind("btn-paste-clipboard", function() { pasteFromClipboard(); });

    // SETTINGS
    safeBind("btn-settings", function() {
        document.getElementById("cfg-voice-1").value = settings.voice[0];
        document.getElementById("cfg-voice-2").value = settings.voice[1];
        document.getElementById("cfg-voice-3").value = settings.voice[2];
        document.getElementById("cfg-music-1").value = settings.music[0];
        document.getElementById("cfg-music-2").value = settings.music[1];
        document.getElementById("cfg-music-3").value = settings.music[2];
        document.getElementById("cfg-scale-1").value = settings.scale[0];
        document.getElementById("cfg-scale-2").value = settings.scale[1];
        document.getElementById("cfg-scale-3").value = settings.scale[2];
        document.getElementById("cfg-scale-4").value = settings.scale[3];
        document.getElementById("cfg-scale-5").value = settings.scale[4];
        document.getElementById("cfg-bitrate").value = settings.bitrate;
        document.getElementById("settings-overlay").classList.remove("hidden");
    });
    safeBind("btn-settings-save", function() {
        settings.voice = [+document.getElementById("cfg-voice-1").value, +document.getElementById("cfg-voice-2").value, +document.getElementById("cfg-voice-3").value];
        settings.music = [+document.getElementById("cfg-music-1").value, +document.getElementById("cfg-music-2").value, +document.getElementById("cfg-music-3").value];
        settings.scale = [+document.getElementById("cfg-scale-1").value, +document.getElementById("cfg-scale-2").value, +document.getElementById("cfg-scale-3").value, +document.getElementById("cfg-scale-4").value, +document.getElementById("cfg-scale-5").value];
        settings.bitrate = +document.getElementById("cfg-bitrate").value;
        saveSettings(); applySettingsToUI();
        document.getElementById("settings-overlay").classList.add("hidden");
        showStatus("Settings saved.", "green");
    });
    safeBind("btn-settings-cancel", function() { document.getElementById("settings-overlay").classList.add("hidden"); });
    safeBind("btn-welcome-close", function() { document.getElementById("welcome-modal").classList.add("hidden"); });

    // ESC key
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") {
            var ids = ["settings-overlay", "confirm-modal", "welcome-modal"];
            for (var i = 0; i < ids.length; i++) {
                var el = document.getElementById(ids[i]);
                if (el) el.classList.add("hidden");
            }
        }
    });







    // Clipboard paste listener
    document.addEventListener("paste", function(ev) {
        var items = (ev.clipboardData || window.clipboardData).items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) { ev.preventDefault(); importBlob(items[i].getAsFile()); return; }
        }
    });

    checkFirstLaunch();

    // Step 4: Self-check — verify all expected buttons exist
    var expectedButtons = [
        "btn-voice-2", "btn-voice-3", "btn-voice-5",
        "btn-music-9", "btn-music-16", "btn-music-21",
        "btn-audio-reset",
        "btn-scale-115", "btn-scale-130", "btn-scale-150", "btn-scale-175", "btn-scale-200", "btn-scale-reset",
        "btn-paste-clipboard", "btn-beat-markers", "btn-clear-markers",
        "btn-export-selected", "btn-export-all", "btn-export-browse",
        "align-left", "align-right", "align-top", "align-bottom",
        "align-center-both", "apply-position", "apply-scale"
    ];
    var missing = [];
    for (var i = 0; i < expectedButtons.length; i++) {
        if (!document.getElementById(expectedButtons[i])) {
            missing.push(expectedButtons[i]);
        }
    }
    if (missing.length > 0) {
        console.log("[CRITICAL] Missing button IDs in HTML: " + missing.join(", "));
    } else {
        console.log("[OK] All button IDs found in HTML");
    }
});

// ── HELPERS ──────────────────────────────────────────────────
function safeBind(id, fn) {
    var el = document.getElementById(id);
    if (el) {
        el.addEventListener("click", fn);
        console.log("[BIND] " + id + " OK");
    } else {
        console.log("[BIND] " + id + " NOT FOUND — check HTML id");
    }
}

function safeParse(raw) {
    if (!raw || raw === "undefined" || raw === "null" || raw === "EvalScript error.") return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
}

function handleJSXResult(result) {
    if (!result || result === "undefined" || result === "null") {
        showStatus("No response from Premiere.", "red");
        return;
    }
    if (result === "EvalScript error.") {
        showStatus("JSX error. Reopen panel.", "red");
        return;
    }
    try {
        var r = JSON.parse(result);
        showStatus(r.message || "Done.", r.status === "success" ? "green" : "red");
    } catch(e) {
        console.log("[ERROR] Parse failed:", result);
        showStatus("Unexpected response", "red");
    }
}

function showStatus(msg, color) {
    var box = document.getElementById("status-box");
    var txt = document.getElementById("status-text");
    if (!box || !txt) return;
    if (color === "green") box.className = "status-box status-success";
    else if (color === "red") box.className = "status-box status-error";
    else if (color === "orange") box.className = "status-box status-warning";
    else box.className = "status-box status-info";
    txt.innerText = msg;
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(function() {
        box.className = "status-box status-info";
        txt.innerText = "Ready.";
    }, 5000);
}

function showConfirm(title, text, onYes) {
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-text").textContent = text;
    document.getElementById("confirm-modal").classList.remove("hidden");
    var y = document.getElementById("btn-confirm-yes");
    var n = document.getElementById("btn-confirm-no");
    var ny = y.cloneNode(true); y.parentNode.replaceChild(ny, y);
    var nn = n.cloneNode(true); n.parentNode.replaceChild(nn, n);
    ny.addEventListener("click", function() { document.getElementById("confirm-modal").classList.add("hidden"); onYes(); });
    nn.addEventListener("click", function() { document.getElementById("confirm-modal").classList.add("hidden"); });
}

function showProgress(msg, pct) {
    document.getElementById("progress-container").classList.remove("hidden");
    document.getElementById("progress-text").innerText = msg;
    document.getElementById("progress-fill").style.width = (pct || 0) + "%";
    operationRunning = true;
}

function hideProgress() {
    document.getElementById("progress-container").classList.add("hidden");
    document.getElementById("progress-fill").style.width = "0%";
    operationRunning = false;
}

// ── SETTINGS ─────────────────────────────────────────────────
function loadSettings() {
    try {
        if (fsModule && fsModule.existsSync(configPath)) {
            var d = JSON.parse(fsModule.readFileSync(configPath, "utf8"));
            if (d.voice) settings.voice = d.voice;
            if (d.music) settings.music = d.music;
            if (d.scale) settings.scale = d.scale;
            if (d.bitrate) settings.bitrate = d.bitrate;
        }
    } catch(e) {}
    applySettingsToUI();
}
function saveSettings() { try { if (fsModule) fsModule.writeFileSync(configPath, JSON.stringify(settings, null, 2), "utf8"); } catch(e) {} }
function applySettingsToUI() {
    var bi = document.getElementById("batch-bitrate-input");
    if (bi) bi.value = settings.bitrate;
}
function findExportPreset() {
    if (!execModule) return;
    execModule('find /Applications -name "*.epr" -path "*Match*Source*High*" 2>/dev/null | head -1', function(e, o) {
        if (o && o.trim()) foundPresetPath = o.trim();
    });
}
function checkFirstLaunch() {
    try {
        if (!fsModule) return;
        var flag = extensionPath + "/.v16_launched";
        if (!fsModule.existsSync(flag)) {
            var m = document.getElementById("welcome-modal");
            if (m) m.classList.remove("hidden");
            fsModule.writeFileSync(flag, "1", "utf8");
        }
    } catch(e) {}
}

// ── FFMPEG SILENCE PARSER ────────────────────────────────────
function parseFFmpegSilence(output, padding) {
    var silences = [], starts = [], ends = [], lines = output.split("\n");
    for (var i = 0; i < lines.length; i++) {
        var sm = lines[i].match(/silence_start:\s*([\d.]+)/);
        var em = lines[i].match(/silence_end:\s*([\d.]+)/);
        if (sm) starts.push(parseFloat(sm[1]));
        if (em) ends.push(parseFloat(em[1]));
    }
    for (var i = 0; i < Math.min(starts.length, ends.length); i++) {
        var s = starts[i] + (padding||0);
        var e = ends[i] - (padding||0);
        if (e > s) silences.push({start: Math.round(s*1000)/1000, end: Math.round(e*1000)/1000});
    }
    return silences;
}

// ── EXPORT PRESET ────────────────────────────────────────────
function modifyPresetBitrate(cb) {
    if (!foundPresetPath || !fsModule) return;
    var br = document.getElementById("batch-bitrate-input").value;
    fsModule.readFile(foundPresetPath, "utf8", function(e, xml) {
        if (e) { showStatus("Can't read preset.", "red"); return; }
        var lines = xml.split("\n"), inB = false;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].indexOf("ADBEVideoTargetBitrate") !== -1) inB = true;
            if (inB && lines[i].indexOf("<ParamValue>") !== -1) { lines[i] = "\t\t<ParamValue>" + br + ".</ParamValue>"; inB = false; }
        }
        var tmp = osModule.tmpdir() + "/efp_" + Date.now() + ".epr";
        fsModule.writeFileSync(tmp, lines.join("\n"), "utf8");
        cb(tmp, br);
    });
}

// ── CLIPBOARD ────────────────────────────────────────────────
function pasteFromClipboard() {
    if (!execModule) { showStatus("NodeJS required.", "red"); return; }
    var ps = document.getElementById("paste-status"); if (ps) ps.innerText = "Reading...";
    var tmp = osModule.tmpdir() + "/efp_paste_" + Date.now() + ".png";
    var sc = "osascript -e 'try' -e 'set d to the clipboard as \u00abclass PNGf\u00bb' -e 'set f to open for access POSIX file \"" + tmp + "\" with write permission' -e 'write d to f' -e 'close access f' -e 'return \"ok\"' -e 'on error' -e 'return \"no\"' -e 'end try'";
    execModule(sc, function(e, o) {
        if (e || o.trim() === "no") { if (ps) ps.innerText = "No image."; return; }
        if (!fsModule.existsSync(tmp)) { if (ps) ps.innerText = "Failed."; return; }
        if (ps) ps.innerText = "Importing...";
        csInterface.evalScript('$._editflow.importClipboardImage("' + tmp.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '")', function(res) {
            if (ps) ps.innerText = "Done!";
            handleJSXResult(res);
        });
    });
}
function importBlob(blob) {
    if (!fsModule) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var buf = Buffer.from(new Uint8Array(e.target.result));
        var tmp = osModule.tmpdir() + "/efp_paste_" + Date.now() + ".png";
        fsModule.writeFileSync(tmp, buf);
        csInterface.evalScript('$._editflow.importClipboardImage("' + tmp.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '")', function(res) {
            handleJSXResult(res);
        });
    };
    reader.readAsArrayBuffer(blob);
}



