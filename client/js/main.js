// main.js - EditFlow Pro v17 — Production Build
// ES5 only. Direct csInterface.evalScript for ALL buttons.

// Global error boundary — prevents silent crashes
window.onerror = function(msg, url, line) {
    console.error("[EFP] Uncaught error:", msg, "at", url, "line", line);
    try { showStatus("An unexpected error occurred.", "red"); } catch(e) {}
    return true;
};

var csInterface = null, dsp = null;
var fsModule = null, osModule = null, execModule = null;
var foundPresetPath = null, extensionPath = "", configPath = "";
var operationRunning = false, statusTimer = null;
var DEFAULT_SETTINGS = {
    language: "en",
    audioStep: 1,
    showWelcome: true,
    autoRefresh: true,
    scale: [115, 130, 150, 175, 200],
    moveStep: [5, 10, 20, 50],
    transformScale: [75, 100, 110, 125, 150],
    captions: {
        language: "auto",
        model: "large",
        style: "phrase",
        animation: "pop",
        font: "Inter",
        size: "72",
        color: "#ffffff",
        highlight: "#1F8FFF"
    },
    bitrate: 10,
    exportPath: "",
    filenamePattern: "sequence",
    groqApiKey: ""
};
var settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
var currentLang = "en";

var i18n = {
    en: {
        audio_title: "Audio Level",
        audio_desc: "Select an audio clip → Nudge ±1 dB or set a quick preset level.",
        audio_down: "▼ −1 dB",
        audio_up: "▲ +1 dB",
        scale_title: "Static Scale",
        scale_desc: "Instant cut-in resize of selected clips. No keyframes.",
        transform_title: "Transform & Tools",
        transform_reset_tip: "Reset position to center + scale to 100%",
        transform_left_tip: "Move Left",
        transform_up_tip: "Move Up",
        transform_down_tip: "Move Down",
        transform_right_tip: "Move Right",
        transform_step: "Move Step",
        transform_px: "pixels",
        transform_scl: "Scale %",
        transform_tools: "Tools",
        transform_desc: "Move, scale, and adjust selected clips directly on the timeline.",
        transform_fit_tip: "Scale clip to fit inside the sequence frame",
        transform_anchor_tip: "Reset anchor point to center of frame",
        transform_fit: "Fit",
        transform_anchor: "Anchor",
        audio_quick: "Quick",
        transform_set: "Set",
        paste_title: "Paste from Web",
        paste_desc: "Copy any image from a browser → click Paste. Added to your Project bin ready to drag in.",
        paste_btn: "Paste Image from Internet",
        export_title: "Export Engine",
        export_file: "File",
        export_file_ph: "sequence name",
        export_saveto: "Save to",
        export_browse: "Browse",
        export_selected: "Export Selected Clip",
        export_capture: "📷 Capture Frame",
        captions_title: "Fast Captions",
        captions_desc: "Lightning-fast, studio-grade transcription. Auto-detect any language and get perfectly synced editable subtitles in seconds.",
        cap_generate: "⚡ Generate Editable Subtitles",
        settings_title: "Settings",
        tab_general: "General",
        tab_presets: "Presets",
        tab_captions: "Captions",
        tab_export: "Export",
        tab_about: "About",
        cfg_language: "Default Language",
        cfg_audio_step: "Audio Nudge Step (dB)",
        cfg_show_welcome_text: "Show welcome screen on launch",
        cfg_auto_refresh_text: "Auto-refresh clip info every 2 sec",
        cfg_scale_presets: "Static Scale Presets (%)",
        cfg_step_presets: "Move Step Presets (pixels)",
        cfg_tscale_presets: "Transform Scale Chips (%)",
        cfg_cap_lang: "Default Language",
        cfg_cap_style: "Default Segmentation",
        cfg_bitrate: "Default Bitrate (Mbps)",
        cfg_export_path: "Default Export Folder",
        cfg_filename_pattern: "Default Filename Pattern",
        cfg_reset: "Reset All Settings to Defaults",
        about_tagline: "Professional one-click editing tools for Adobe Premiere Pro",
        about_developed: "Developed by",
        about_developer: "Developer",
        about_contact: "Contact Us",
        about_rights: "All rights reserved.",
        btn_cancel: "Cancel",
        btn_save: "Save Changes",
        confirm_title: "Confirm",
        confirm_text: "Are you sure?",
        confirm_yes: "Confirm",
        welcome_btn: "Get Started",
        welcome_tagline: "Professional one-click editing tools",
        welcome_f1: "Audio presets · Quick volume · Static scale",
        welcome_f2: "AI captions · Auto-transcribe 15+ languages",
        welcome_f3: "Transform tools · Fit to frame · Web paste",
        welcome_dont_show: "Don't show this again",
        welcome_made_by: "Crafted by",
        status_ready: "EditFlow Pro · ready",
        task_report: "Task Report",
        setup_api_title: "Activate Free Captions",
        setup_api_desc: "For lightning-fast transcription, connect your free speech engine.",
        setup_api_step1: "Click the button below to log in and get your free API key.",
        setup_api_step2: "Paste it here:",
        setup_api_get: "Get Free Key ↗",
        setup_api_activate: "Activate Now",
        setup_api_cancel: "Cancel",
        settings_api_get: "Get Free Key ↗",
        settings_api_steps: "1. Click 'Get Free Key' above & log in.<br>2. Click 'Create API Key' & copy it.<br>3. Paste the key in the box above.",
        sfx_title: "SFX Library",
        sfx_desc: "Drag-free sound effects. Preview, then add directly to your timeline at the playhead.",
        sfx_search_ph: "Search sounds...",
        sfx_cat_all: "All",
        sfx_no_sounds: "No sounds found",
        sfx_added: "Added to timeline ✓",
        sfx_count: "{n} sounds"
    },
    ar: {
        audio_title: "مستوى الصوت",
        audio_desc: "حدد مقطع صوتي → اضبط ±١ ديسيبل أو اختر مستوى سريع.",
        audio_down: "▼ −1 dB",
        audio_up: "▲ +1 dB",
        scale_title: "تغيير الحجم",
        scale_desc: "تغيير حجم المقاطع فورياً. بدون إطارات مفتاحية.",
        transform_title: "التحويل والأدوات",
        transform_reset_tip: "إعادة الموضع للمركز + الحجم إلى 100%",
        transform_left_tip: "تحريك يسار",
        transform_up_tip: "تحريك لأعلى",
        transform_down_tip: "تحريك لأسفل",
        transform_right_tip: "تحريك يمين",
        transform_step: "مدى التحريك",
        transform_px: "بكسل",
        transform_scl: "الحجم %",
        transform_tools: "أدوات",
        transform_desc: "حرّك وغيّر حجم واضبط المقاطع مباشرةً على التايملاين.",
        transform_fit_tip: "تغيير الحجم لملء إطار السيكونس",
        transform_anchor_tip: "إعادة تعيين نقطة الارتكاز للمركز",
        transform_fit: "Fit",
        transform_anchor: "Anchor",
        audio_quick: "سريع",
        transform_set: "تطبيق",
        paste_title: "لصق من الويب",
        paste_desc: "انسخ أي صورة من المتصفح → اضغط لصق. تضاف إلى ملفات المشروع جاهزة للسحب.",
        paste_btn: "لصق صورة من الإنترنت",
        export_title: "محرك التصدير",
        export_file: "الملف",
        export_file_ph: "اسم التسلسل",
        export_saveto: "حفظ في",
        export_browse: "استعراض",
        export_selected: "تصدير المقطع المحدد",
        export_capture: "📷 التقاط إطار",
        captions_title: "ترجمة سريعة",
        captions_desc: "تفريغ صوتي فائق السرعة بدقة استوديو احترافية. كشف تلقائي لأي لغة وترجمة متزامنة قابلة للتعديل في ثوانٍ.",
        cap_lang: "اللغة",
        cap_accuracy: "الدقة",
        cap_style: "النمط",
        cap_generate_srt: "⚡ إنشاء ترجمة قابلة للتعديل",
        settings_title: "الإعدادات",
        tab_general: "عام",
        tab_presets: "القيم المسبقة",
        tab_captions: "الترجمة",
        tab_export: "التصدير",
        tab_about: "حول",
        cfg_language: "اللغة الافتراضية",
        cfg_audio_step: "مقدار تعديل الصوت (dB)",
        cfg_show_welcome_text: "إظهار شاشة الترحيب عند فتح الأداة",
        cfg_auto_refresh_text: "تحديث معلومات المقطع كل ثانيتين تلقائياً",
        cfg_scale_presets: "قيم الحجم الثابت المسبقة (%)",
        cfg_step_presets: "قيم مدى التحريك المسبقة (بكسل)",
        cfg_tscale_presets: "قيم تكبير التحويل (%)",
        cfg_cap_lang: "اللغة الافتراضية للترجمة",
        cfg_cap_accuracy: "الدقة الافتراضية",
        cfg_cap_style: "تقسيم النص الافتراضي",
        cfg_bitrate: "معدل البت الافتراضي (Mbps)",
        cfg_export_path: "مجلد التصدير الافتراضي",
        cfg_filename_pattern: "نمط اسم الملف الافتراضي",
        cfg_reset: "استعادة جميع الإعدادات الافتراضية",
        about_tagline: "أدوات احترافية بكبسة زر لـ Adobe Premiere Pro",
        about_developed: "تطوير",
        about_developer: "المطور",
        about_contact: "تواصل معنا",
        about_rights: "جميع الحقوق محفوظة.",
        btn_cancel: "إلغاء",
        btn_save: "حفظ التغييرات",
        confirm_title: "تأكيد",
        confirm_text: "هل أنت متأكد؟",
        confirm_yes: "تأكيد",
        welcome_btn: "ابدأ الآن",
        welcome_tagline: "أدوات احترافية بكبسة زر",
        welcome_f1: "صوت سريع · مستويات جاهزة · تكبير ثابت",
        welcome_f2: "ترجمة AI · تفريغ تلقائي لأكثر من ١٥ لغة",
        welcome_f3: "أدوات تحويل · ملائمة الإطار · لصق من الويب",
        welcome_dont_show: "لا تظهر هذه الرسالة مرة أخرى",
        welcome_made_by: "صُنع بإتقان بواسطة",
        status_ready: "EditFlow Pro · جاهز",
        task_report: "تقرير المهمة",
        setup_api_title: "تفعيل الترجمة المجانية",
        setup_api_desc: "للحصول على تفريغ فائق السرعة، قم بربط محرك التفريغ المجاني.",
        setup_api_step1: "اضغط على الزر أدناه لتسجيل الدخول والحصول على مفتاح API مجاني.",
        setup_api_step2: "ألصقه هنا:",
        setup_api_get: "احصل على المفتاح مجاناً ↗",
        setup_api_activate: "تفعيل الآن",
        setup_api_cancel: "إلغاء",
        settings_api_get: "احصل على المفتاح مجاناً ↗",
        settings_api_steps: "١. اضغط 'احصل على المفتاح مجاناً' وسجل دخولك.<br>٢. اضغط 'Create API Key' وانسخ الكود.<br>٣. ألصق الكود في المربع أعلاه.",
        sfx_title: "مكتبة المؤثرات",
        sfx_desc: "مؤثرات صوتية بضغطة زر. استمع أولاً ثم أضفها مباشرةً إلى التايملاين.",
        sfx_search_ph: "بحث عن مؤثر...",
        sfx_cat_all: "الكل",
        sfx_no_sounds: "لا توجد مؤثرات",
        sfx_added: "تمت الإضافة للتايملاين ✓",
        sfx_count: "{n} مؤثر صوتي"
    }
};

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
    // AUDIO LEVEL — Nudge Up/Down
    // ============================================================

    // Nudge UP (+step dB)
    (function() {
        var btn = document.getElementById('btn-audio-up');
        if (!btn) return;
        btn.addEventListener('click', function() {
            var step = settings.audioStep || 1;
            csInterface.evalScript('$._editflow.nudgeAudioLevel("' + step + '")', function(result) {
                console.log('[AUDIO] Up:', result);
                handleJSXResult(result);
            });
        });
    })();

    // Nudge DOWN (-step dB)
    (function() {
        var btn = document.getElementById('btn-audio-down');
        if (!btn) return;
        btn.addEventListener('click', function() {
            var step = settings.audioStep || 1;
            csInterface.evalScript('$._editflow.nudgeAudioLevel("-' + step + '")', function(result) {
                console.log('[AUDIO] Down:', result);
                handleJSXResult(result);
            });
        });
    })();





    // ============================================================
    // ALIGN & TRANSFORM v2 — LIVE INFO BAR + SMART ALIGNMENT
    // ============================================================

    // ---- LIVE INFO BAR ----
    function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
    function setStyle(id, prop, v) { var el = document.getElementById(id); if (el) el.style[prop] = v; }
    function setPlaceholder(id, v) { var el = document.getElementById(id); if (el) el.placeholder = v; }

    function updateClipInfo() {
        csInterface.evalScript('$._editflow.getSequenceInfo()', function(seqResult) {
            try {
                var seq = JSON.parse(seqResult);
                if (seq.error) { setText('seq-info', seq.error); return; }
                setText('seq-info', seq.resolution + ' — ' + seq.orientation +
                    ' (center: ' + seq.centerX + ', ' + seq.centerY + ')');
            } catch(e) { setText('seq-info', 'Error reading sequence'); }
        });

        csInterface.evalScript('$._editflow.getClipPositionInfo()', function(result) {
            try {
                var info = JSON.parse(result);
                if (!info.error) {
                    setPlaceholder('scale-value', Math.round(info.scale));
                }
            } catch(e) {}
        });
    }

    // Reset clip transform button
    document.getElementById('reset-clip-transform').addEventListener('click', function() {
        csInterface.evalScript('$._editflow.resetClipTransform()', function(result) {
            console.log('[RESET] transform:', result);
            handleJSXResult(result);
            updateClipInfo();
        });
    });

    // Auto-refresh every 2 seconds (toggleable via settings)
    var autoRefreshTimer = null;
    function startAutoRefresh() {
        if (autoRefreshTimer) return;
        autoRefreshTimer = setInterval(updateClipInfo, 2000);
    }
    function stopAutoRefresh() {
        if (autoRefreshTimer) { clearInterval(autoRefreshTimer); autoRefreshTimer = null; }
    }
    window.__refreshAuto = function() {
        if (settings.autoRefresh) startAutoRefresh(); else stopAutoRefresh();
    };
    window.__refreshAuto();
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

    // ---- PRESET CHIPS — step size ----
    (function() {
        var chips = document.querySelectorAll('.step-chip');
        var stepInput = document.getElementById('nudge-step');
        for (var i = 0; i < chips.length; i++) {
            (function(chip) {
                chip.addEventListener('click', function() {
                    for (var j = 0; j < chips.length; j++) chips[j].classList.remove('chip-active');
                    chip.classList.add('chip-active');
                    if (stepInput) stepInput.value = chip.getAttribute('data-val');
                });
            })(chips[i]);
        }
        // typing a custom value clears chip highlight
        if (stepInput) {
            stepInput.addEventListener('input', function() {
                for (var j = 0; j < chips.length; j++) chips[j].classList.remove('chip-active');
            });
        }
    })();

    // ---- PRESET CHIPS — scale ----
    (function() {
        var chips = document.querySelectorAll('.scale-chip');
        var scaleInput = document.getElementById('scale-value');
        for (var i = 0; i < chips.length; i++) {
            (function(chip) {
                chip.addEventListener('click', function() {
                    for (var j = 0; j < chips.length; j++) chips[j].classList.remove('chip-active');
                    chip.classList.add('chip-active');
                    if (scaleInput) {
                        scaleInput.value = chip.getAttribute('data-val');
                        // auto-apply on chip click
                        csInterface.evalScript(
                            '$._editflow.setScaleValue("' + chip.getAttribute('data-val') + '")',
                            function(result) {
                                console.log("[SCALE-CHIP] Result:", result);
                                handleJSXResult(result);
                                updateClipInfo();
                            }
                        );
                    }
                });
            })(chips[i]);
        }
        if (scaleInput) {
            scaleInput.addEventListener('input', function() {
                for (var j = 0; j < chips.length; j++) chips[j].classList.remove('chip-active');
            });
        }
    })();

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
                    updateClipInfo();
                }
            );
        });
    }
    bindNudge("nudge-left", "left");
    bindNudge("nudge-right", "right");
    bindNudge("nudge-up", "up");
    bindNudge("nudge-down", "down");

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
    // AUDIO QUICK LEVELS — Voice / SFX / BGM preset chips
    // ============================================================
    (function() {
        var chips = document.querySelectorAll('.audio-level-chip');
        for (var i = 0; i < chips.length; i++) {
            (function(chip) {
                chip.addEventListener('click', function() {
                    var db = chip.getAttribute('data-db');
                    console.log('[AUDIO-QUICK] Set ' + db + ' dB');
                    csInterface.evalScript(
                        '$._editflow.setAudioLevel("' + db + '")',
                        function(result) {
                            console.log('[AUDIO-QUICK] Result:', result);
                            handleJSXResult(result);
                        }
                    );
                });
            })(chips[i]);
        }
    })();

    // ============================================================
    // TRANSFORM PRO TOOLS — Fit, Center Anchor
    // ============================================================

    safeBind("btn-fit-frame", function() {
        console.log('[FIT] Fit to frame');
        csInterface.evalScript(
            '$._editflow.fitToFrame("fit")',
            function(result) {
                console.log('[FIT] Result:', result);
                handleJSXResult(result);
                updateClipInfo();
            }
        );
    });

    safeBind("btn-center-anchor", function() {
        console.log('[ANCHOR] Center anchor point');
        csInterface.evalScript(
            '$._editflow.centerAnchorPoint()',
            function(result) {
                console.log('[ANCHOR] Result:', result);
                handleJSXResult(result);
            }
        );
    });

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



    // ============================================================
    // AI CAPTIONS — Whisper transcription + animated captions
    // ============================================================




    // Shows a professional download prompt when the AI engine binary is missing.
    // Injected dynamically so the HTML stays clean.
    function showCaptionDownloadBanner() {
        var existing = document.getElementById('cap-download-banner');
        if (existing) { existing.style.display = 'block'; return; }
        var banner = document.createElement('div');
        banner.id = 'cap-download-banner';
        banner.style.cssText = [
            'background:rgba(31,143,255,0.10)',
            'border:1px solid rgba(31,143,255,0.35)',
            'border-radius:8px',
            'padding:14px 16px',
            'margin:8px 0 4px',
            'text-align:center'
        ].join(';');
        banner.innerHTML =
            '<p style="font-size:13px;font-weight:600;color:#1F8FFF;margin:0 0 5px 0;">' +
                '⬇️ AI Engine not installed' +
            '</p>' +
            '<p style="font-size:11px;color:var(--text-mute);margin:0 0 10px 0;line-height:1.6;">' +
                'The AI caption engine requires a one-time download.<br>' +
                'It’s a ~25 MB standalone binary — no Python or pip needed.' +
            '</p>' +
            '<a id="cap-dl-btn" href="#" style="' +
                'display:inline-block;background:#1F8FFF;color:#fff;' +
                'border-radius:6px;padding:7px 20px;font-size:12px;' +
                'font-weight:600;text-decoration:none;cursor:pointer;' +
            '">Download AI Engine →</a>' +
            '<p style="font-size:10px;color:var(--text-mute);margin:8px 0 0 0;">' +
                'Works offline after the first download' +
            '</p>';
        var statusEl = document.getElementById('cap-status');
        if (statusEl && statusEl.parentNode) {
            statusEl.parentNode.insertBefore(banner, statusEl);
        }
        var dlBtn = document.getElementById('cap-dl-btn');
        if (dlBtn) {
            dlBtn.addEventListener('click', function(e) {
                e.preventDefault();
                csInterface.openURLInDefaultBrowser(
                    'https://github.com/ahmednajm1/editflow-pro/releases/latest'
                );
            });
        }
    }

    safeBind("btn-generate-captions", function() {
        if (!fsModule || !execModule || !osModule) {
            showStatus("Node modules unavailable.", "red"); return;
        }
        if (operationRunning) return;

        var lang  = document.getElementById("cap-language").value;
        var model = document.getElementById("cap-model").value;
        var style = document.getElementById("cap-style").value;

        var statusLine = document.getElementById("cap-status");
        function setStatus(t) { if (statusLine) statusLine.textContent = t; }
        function shq(s) { return '"' + String(s).replace(/(["\\$`])/g, "\\$1") + '"'; }
        var opts = { maxBuffer: 16 * 1024 * 1024, timeout: 30 * 60 * 1000 };

        showProgress("Finding audio...", 3);
        setStatus("Reading selection…");

        csInterface.evalScript('$._editflow.getAudioMedia()', function(raw) {
            var info = safeParse(raw);
            if (!info) {
                hideProgress(); setStatus(""); showStatus("Select an audio/video clip first.", "red"); return;
            }

            var EFP_BIN_DIR = osModule.homedir() + "/Library/Application Support/EditFlowPro";
            var transcriberBin = EFP_BIN_DIR + "/whisper_runner";
            if (!fsModule.existsSync(transcriberBin)) {
                hideProgress(); setStatus(""); showCaptionDownloadBanner(); return;
            }
            var outBase = osModule.tmpdir() + "/efp_caps_" + Date.now();
            var apiKey = settings.groqApiKey || "";
            if (!apiKey) {
                hideProgress(); setStatus("");
                var setupModal = document.getElementById("setup-api-modal");
                if (setupModal) {
                    setupModal.classList.remove("hidden");
                    var setupInput = document.getElementById("setup-api-input");
                    if (setupInput) setupInput.value = "";
                    
                    // Bind cancel
                    safeBind("btn-setup-api-close", function() {
                        setupModal.classList.add("hidden");
                    });
                    
                    // Bind save
                    safeBind("btn-setup-api-save", function() {
                        if (setupInput && setupInput.value.trim().length > 10) {
                            settings.groqApiKey = setupInput.value.trim();
                            var gk = document.getElementById("cfg-groq-key");
                            if (gk) gk.value = settings.groqApiKey;
                            saveSettings();
                            setupModal.classList.add("hidden");
                            showStatus("Connected successfully! Click Generate again.", "green");
                        } else {
                            showStatus("Please paste a valid API key starting with gsk_", "red");
                        }
                    });
                } else {
                    showStatus("API key required. Go to Settings \u2699 and enter your free key.", "red");
                }
                return;
            }

            // ── Determine media path and timeline info ──
            // Variables used by dispatch logic below

            function runTranscriber(mPath, tlStart, cIn, cOut, cDur) {
                var cmd = shq(transcriberBin) + " " + shq(mPath) + " " + shq(outBase) +
                          " --lang " + shq(lang) + " --model " + shq(model) +
                          " --api-key " + shq(apiKey);
                if (cDur > 0.1 && cOut > cIn) {
                    cmd += " --start " + cIn.toFixed(3) + " --end " + cOut.toFixed(3);
                }
                var modelSize = ({tiny:75, base:140, small:460, medium:1500, large:3000})[model] || 460;
                var trimNote = (cDur > 0.1) ? (" · " + cDur.toFixed(1) + "s") : "";
                showProgress("Analyzing speech (" + model + ")…", 15);
                setStatus("AI speech recognition" + trimNote + " · model = " + modelSize + " MB on first run");
                console.log("[Captions] running:", cmd);

                execModule(cmd, opts, function(err, stdout, stderr) {
                if (err) {
                    hideProgress(); setStatus("");
                    console.log("[Captions] err:", err.message, "\nstdout:", stdout, "\nstderr:", stderr);
                    // whisper_runner writes JSON to stdout even on failure — parse it first
                    var errData = safeParse(stdout);
                    if (errData && errData.message) {
                        showStatus("Caption error: " + errData.message.slice(0, 120), "red");
                    } else {
                        showStatus("Transcription failed: " + (stderr || err.message || "unknown").slice(0, 100), "red");
                    }
                    return;
                }
                var summary = safeParse(stdout) || {};
                console.log("[Captions] summary:", summary);
                if (summary.status !== "success") {
                    hideProgress(); setStatus("");
                    showStatus("Transcriber error: " + (summary.message || "unknown"), "red");
                    return;
                }

                setStatus("Detected " + summary.language + " · " + summary.words + " words · " + summary.segments + " segments");

                // ── SRT MODE ONLY: generate synced captions directly ──
                console.log("[Captions] placing synced editable captions");
                showProgress("Syncing captions to timeline…", 75);
                setStatus("Building timeline-synced captions…");
                fallbackSRT(summary, style, "none", "Arial", 72, "#FFFFFF", "#FFFFFF", tlStart, setStatus);
                return;
                });
            }  // end runTranscriber()

            // ── Single clip (backward compat) ──
            if (info.status === "success" && info.mediaPath) {
                runTranscriber(info.mediaPath, info.timelineStart || 0,
                               info.clipIn || 0, info.clipOut || 0, info.duration || 0);
            }
            // ── Multi-clip: extract and concatenate audio ──
            else if (info.status === "multi" && info.clips && info.clips.length > 0) {
                var clips = info.clips;
                var firstTlStart = clips[0].timelineStart || 0;
                var totalDur = 0;
                console.log("[Captions] Multi-clip mode: " + clips.length + " clips selected");
                showProgress("Extracting audio from " + clips.length + " clips…", 8);
                setStatus("Combining " + clips.length + " clips for transcription…");

                // Build ffmpeg concat filter: extract the used portion from each clip
                var ffmpegBin = EFP_BIN_DIR + "/ffmpeg";
                if (!fsModule.existsSync(ffmpegBin)) ffmpegBin = "/opt/homebrew/bin/ffmpeg";
                if (!fsModule.existsSync(ffmpegBin)) ffmpegBin = "/usr/local/bin/ffmpeg";
                if (!fsModule.existsSync(ffmpegBin)) ffmpegBin = "ffmpeg"; // last resort: try PATH

                var concatList = osModule.tmpdir() + "/efp_concat_" + Date.now() + ".txt";
                var partFiles = [];
                var pending = clips.length;
                var extractError = null;

                clips.forEach(function(clip, idx) {
                    var partFile = osModule.tmpdir() + "/efp_part_" + Date.now() + "_" + idx + ".wav";
                    partFiles.push(partFile);
                    var extractCmd = shq(ffmpegBin) + " -y -hide_banner -loglevel error" +
                        " -i " + shq(clip.mediaPath);
                    if (clip.clipOut > clip.clipIn && clip.duration > 0.1) {
                        extractCmd += " -ss " + (clip.clipIn || 0).toFixed(3) +
                                      " -to " + (clip.clipOut || 0).toFixed(3);
                    }
                    // Extract to WAV to avoid MP3 padding/drift when concatenating
                    extractCmd += " -vn -ac 1 -ar 16000 -c:a pcm_s16le " + shq(partFile);

                    execModule(extractCmd, opts, function(err2) {
                        if (err2) extractError = err2;
                        pending--;
                        if (pending === 0) {
                            if (extractError) {
                                hideProgress(); setStatus("");
                                showStatus("Audio extraction failed: " + (extractError.message || "").slice(0,100), "red");
                                return;
                            }
                            // Build concat list file
                            var listContent = partFiles.map(function(f) {
                                return "file '" + f.replace(/'/g, "'\\''") + "'";
                            }).join("\n");
                            fsModule.writeFileSync(concatList, listContent, "utf8");

                            // Concatenate all parts
                            var combinedFile = osModule.tmpdir() + "/efp_combined_" + Date.now() + ".wav";
                            var concatCmd = shq(ffmpegBin) + " -y -hide_banner -loglevel error" +
                                " -f concat -safe 0 -i " + shq(concatList) +
                                " -c copy " + shq(combinedFile);

                            execModule(concatCmd, opts, function(err3) {
                                // Cleanup part files
                                partFiles.forEach(function(f) { try { fsModule.unlinkSync(f); } catch(e){} });
                                try { fsModule.unlinkSync(concatList); } catch(e){}

                                if (err3) {
                                    hideProgress(); setStatus("");
                                    showStatus("Audio concat failed: " + (err3.message || "").slice(0,100), "red");
                                    return;
                                }

                                // Run transcriber on combined audio (no --start/--end since we already trimmed)
                                runTranscriber(combinedFile, firstTlStart, 0, 0, 0);
                            });
                        }
                    });
                });
            } else if (!info.mediaPath) {
                hideProgress(); setStatus(""); showStatus("Select an audio/video clip first.", "red"); return;
            } else {
                // Fallback: treat as single clip
                runTranscriber(info.mediaPath, info.timelineStart || 0,
                               info.clipIn || 0, info.clipOut || 0, info.duration || 0);
            }
        });
    });

    // SRT generation — creates timeline-synced captions via Premiere Caption API
    function fallbackSRT(summary, style, anim, font, size, color, hl, timelineStart, setStatus) {
        showProgress("Placing captions on timeline…", 80);
        setStatus("Building synced captions (" + style + " mode)…");
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
                handleJSXResult(res);
                var r = safeParse(res);
                if (r && r.placed) {
                    setStatus("✅ " + r.groups + " captions synced on timeline (" + style + ")");
                } else if (r && r.groups) {
                    setStatus("✅ " + r.groups + " captions ready → drag from EFP_Captions bin to Caption track (timing is synced)");
                } else {
                    setStatus("Caption generation completed.");
                }
            }
        );
    }

    // (Upgrade Caption to Graphic has been removed due to Adobe API limitations in recent Premiere builds)



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

    // Helper: Find built-in PNG Preset for native capture
    var foundPngPreset = null;
    function findPngPreset() {
        if (!fsModule || foundPngPreset) return foundPngPreset;
        var paths = [
            "/Applications/Adobe Premiere Pro 2026/Adobe Premiere Pro 2026.app/Contents/MediaIO/systempresets/3F3F3F3F_504E4720/PNG Sequence (Match Source).epr",
            "/Applications/Adobe Premiere Pro 2025/Adobe Premiere Pro 2025.app/Contents/MediaIO/systempresets/3F3F3F3F_504E4720/PNG Sequence (Match Source).epr",
            "/Applications/Adobe Premiere Pro 2024/Adobe Premiere Pro 2024.app/Contents/MediaIO/systempresets/3F3F3F3F_504E4720/PNG Sequence (Match Source).epr",
            "/Applications/Adobe Premiere Pro (Beta)/Adobe Premiere Pro (Beta).app/Contents/MediaIO/systempresets/3F3F3F3F_504E4720/PNG Sequence (Match Source).epr"
        ];
        for (var i = 0; i < paths.length; i++) {
            if (fsModule.existsSync(paths[i])) { foundPngPreset = paths[i]; return paths[i]; }
        }
        return null;
    }

    safeBind("btn-capture-frame", function() {
        if (!execModule || !fsModule) {
            showStatus("System modules not available.", "red");
            return;
        }
        
        var pngPreset = findPngPreset();
        
        // If we have the PNG preset, use NATIVE TIMELINE RENDER (100% accurate, captures zooms/effects)
        if (pngPreset) {
            console.log('[CAPTURE] Using Native MediaDirect...');
            showProgress("Rendering frame...", 30);
            
            var safeTempDir = osModule.tmpdir().replace(/\\/g, "/");
            var safePreset = pngPreset.replace(/\\/g, "/");
            
            csInterface.evalScript('$._editflow.exportNativeFrame("' + safePreset + '", "' + safeTempDir + '")', function(res) {
                try {
                    var r = JSON.parse(res);
                    if (r.status !== "success" || r.method !== "media_direct") {
                        showProgress("", 0); hideProgress();
                        handleJSXResult(res);
                        return;
                    }
                    
                    showProgress("Saving to clipboard...", 60);
                    var baseName = r.baseName;
                    var tempDir = r.tempDir;
                    var checks = 0;
                    var expectedFile = null;
                    
                    var interval = setInterval(function() {
                        checks++;
                        // Search for the file in the temp directory (Premiere appends dynamic zeroes like '0.png' or '00000.png')
                        try {
                            var files = fsModule.readdirSync(tempDir);
                            for (var i = 0; i < files.length; i++) {
                                if (files[i].indexOf(baseName) === 0 && files[i].indexOf('.png') > -1) {
                                    expectedFile = tempDir + "/" + files[i];
                                    break;
                                }
                            }
                        } catch(e) {}

                        if (expectedFile && fsModule.existsSync(expectedFile)) {
                            clearInterval(interval);
                            // Restore In/Out points immediately
                            csInterface.evalScript('$._editflow.restoreInOut("' + r.oldIn + '", "' + r.oldOut + '")');
                            copyFrameToClipboard(expectedFile, 'PNG');
                        } else if (checks > 40) { // 10 seconds timeout
                            clearInterval(interval);
                            csInterface.evalScript('$._editflow.restoreInOut("' + r.oldIn + '", "' + r.oldOut + '")');
                            showProgress("", 0); hideProgress();
                            showStatus("Capture timeout.", "red");
                        }
                    }, 250);
                } catch(e) {
                    showProgress("", 0); hideProgress();
                    handleJSXResult(res);
                }
            });
            return;
        }

        // FALLBACK: ffmpeg Extraction (fast, but no timeline effects/zooms)
        console.log('[CAPTURE] Starting fast ffmpeg capture...');
        showProgress("Reading playhead...", 30);
        csInterface.evalScript('$._editflow.getPlayheadFrameInfo()', function(result) {
            console.log('[CAPTURE] Info:', result);
            try {
                var r = JSON.parse(result);
                if (r.status !== "success") {
                    showProgress("", 0); hideProgress();
                    handleJSXResult(result);
                    return;
                }
                
                // If Premiere handled the export natively (via exportFramePNG in v24.0+)
                if (r.method === "native" && r.path) {
                    copyFrameToClipboard(r.path, 'PNG');
                    return;
                }

                if (!r.mediaPath) {
                    showProgress("", 0); hideProgress();
                    showStatus("No media path found.", "red");
                    return;
                }

                var pngPath = osModule.tmpdir() + '/editflow_frame_' + Date.now() + '.png';
                showProgress("Extracting frame...", 60);

                // Escape media path for shell
                var safeMedia = r.mediaPath.replace(/'/g, "'\\''");
                var safePng = pngPath.replace(/'/g, "'\\''");

                // ffmpeg: Exact frame extraction (accurate seek by placing -ss AFTER -i)
                var binPath = extensionPath + "/bin";
                var cmd = "export PATH=\"" + binPath + ":/opt/homebrew/bin:/usr/local/bin:$PATH\" && " +
                    "ffmpeg -y" +
                    " -i '" + safeMedia + "'" +
                    " -ss " + r.sourceTime.toFixed(6) +
                    " -map 0:v:0 -vframes 1 -q:v 2" +
                    " '" + safePng + "'";

                execModule(cmd, function(ffErr, ffOut, ffStderr) {
                    if (!fsModule.existsSync(pngPath)) {
                        showProgress("", 0); hideProgress();
                        var detail = ffStderr ? ffStderr.substring(ffStderr.lastIndexOf('\n', ffStderr.length - 2) + 1).trim() : "unknown";
                        showStatus("Capture failed: " + detail.substring(0, 120), "red");
                        return;
                    }
                    copyFrameToClipboard(pngPath, 'PNG');
                });
            } catch(e) {
                showProgress("", 0); hideProgress();
                handleJSXResult(result);
            }
        });

        function copyFrameToClipboard(imgPath, type) {
            showProgress("Copying to clipboard...", 90);
            var asClass = type === 'TIFF' ? '\u00ABclass TIFF\u00BB' : '\u00ABclass PNGf\u00BB';
            var scptPath = imgPath.replace(/\.[^.]+$/, '.applescript');
            var scptBody = 'set the clipboard to (read (POSIX file "' + imgPath + '") as ' + asClass + ')';
            try {
                fsModule.writeFileSync(scptPath, scptBody, 'utf8');
                execModule('osascript "' + scptPath + '"', function(clipErr) {
                    try { fsModule.unlinkSync(scptPath); } catch(e) {}
                    showProgress("Done!", 100); setTimeout(hideProgress, 2000);
                    if (clipErr) {
                        showStatus("Frame saved to: " + imgPath, "green");
                    } else {
                        showStatus("Frame copied! Cmd+V to paste.", "green");
                    }
                });
            } catch(wErr) {
                showProgress("Done!", 100); setTimeout(hideProgress, 2000);
                showStatus("Frame saved to: " + imgPath, "green");
            }
        }
    });

    safeBind("btn-paste-clipboard", function() { pasteFromClipboard(); });

    // SETTINGS
    safeBind("btn-settings", function() {
        populateSettingsForm();
        document.getElementById("settings-overlay").classList.remove("hidden");
    });
    safeBind("btn-settings-save", function() {
        readSettingsForm();
        saveSettings();
        applySettingsToUI();
        document.getElementById("settings-overlay").classList.add("hidden");
        showStatus("Settings saved.", "green");
    });
    safeBind("btn-settings-cancel", function() { document.getElementById("settings-overlay").classList.add("hidden"); });
    safeBind("btn-settings-close",  function() { document.getElementById("settings-overlay").classList.add("hidden"); });

    // Settings tabs
    var tabs = document.querySelectorAll('.settings-tab');
    for (var t = 0; t < tabs.length; t++) {
        (function(tab) {
            tab.addEventListener('click', function() {
                var name = tab.getAttribute('data-tab');
                var allTabs = document.querySelectorAll('.settings-tab');
                for (var i = 0; i < allTabs.length; i++) allTabs[i].classList.remove('settings-tab-active');
                tab.classList.add('settings-tab-active');
                var allSecs = document.querySelectorAll('.settings-section');
                for (var j = 0; j < allSecs.length; j++) {
                    allSecs[j].classList.toggle('settings-section-active', allSecs[j].getAttribute('data-section') === name);
                }
            });
        })(tabs[t]);
    }

    // Reset to defaults
    safeBind("btn-reset-defaults", function() {
        if (!confirm("Reset all settings to defaults?")) return;
        settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        saveSettings();
        populateSettingsForm();
        applySettingsToUI();
        showStatus("Defaults restored.", "green");
    });

    // Browse for default export folder in settings
    safeBind("btn-cfg-browse-path", function() {
        if (!csInterface) return;
        try {
            var result = window.cep.fs.showOpenDialog(false, true, "Choose default export folder", "");
            if (result.data && result.data.length > 0) {
                document.getElementById("cfg-export-path").value = result.data[0];
            }
        } catch(e) { console.log("Browse error:", e); }
    });

    safeBind("btn-welcome-close", function() {
        var dontShow = document.getElementById("welcome-dont-show");
        if (dontShow && dontShow.checked) {
            settings.showWelcome = false;
            saveSettings();
        }
        document.getElementById("welcome-modal").classList.add("hidden");
    });

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

    // ============================================================
    // LANGUAGE TOGGLE — AR / EN
    // ============================================================
    (function() {
        var btn = document.getElementById('btn-lang-toggle');
        if (!btn) return;
        btn.addEventListener('click', function() {
            currentLang = (currentLang === 'en') ? 'ar' : 'en';
            applyLanguage(currentLang);
        });
    })();

    // Step 4: Self-check — verify all expected buttons exist
    var expectedButtons = [
        "btn-audio-up", "btn-audio-down",
        "reset-clip-transform", "apply-scale",
        "btn-paste-clipboard",
        "btn-export-selected", "btn-capture-frame", "btn-export-browse"
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

// ── LANGUAGE ─────────────────────────────────────────────────
function applyLanguage(lang) {
    var t = i18n[lang] || i18n.en;
    var html = document.documentElement;
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    html.setAttribute('lang', lang);

    var btn = document.getElementById('btn-lang-toggle');
    if (btn) {
        var langText = btn.querySelector('.lang-text');
        if (langText) langText.textContent = lang === 'ar' ? 'EN' : 'عر';
    }

    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
        var key = els[i].getAttribute('data-i18n');
        if (t[key]) els[i].textContent = t[key];
    }

    var titleEls = document.querySelectorAll('[data-i18n-title]');
    for (var j = 0; j < titleEls.length; j++) {
        var tKey = titleEls[j].getAttribute('data-i18n-title');
        if (t[tKey]) titleEls[j].setAttribute('title', t[tKey]);
    }

    var phEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var k = 0; k < phEls.length; k++) {
        var pKey = phEls[k].getAttribute('data-i18n-placeholder');
        if (t[pKey]) phEls[k].setAttribute('placeholder', t[pKey]);
    }
}

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

var _progressTimer = null;
var _progressStartTime = 0;
var _progressTargetPct = 0;
var _progressCurrentPct = 0;

function showProgress(msg, pct) {
    var container = document.getElementById("progress-container");
    var textEl = document.getElementById("progress-text");
    var fillEl = document.getElementById("progress-fill");
    container.classList.remove("hidden");
    fillEl.classList.remove("done");
    textEl.innerText = msg;
    _progressTargetPct = pct || 0;
    fillEl.style.width = _progressTargetPct + "%";
    _progressCurrentPct = _progressTargetPct;
    operationRunning = true;

    // Start elapsed timer if this is the "Analyzing" step (where the wait happens)
    if (pct <= 15 && pct > 0) {
        _progressStartTime = Date.now();
        if (_progressTimer) clearInterval(_progressTimer);
        _progressTimer = setInterval(function() {
            var elapsed = Math.floor((Date.now() - _progressStartTime) / 1000);
            var mins = Math.floor(elapsed / 60);
            var secs = elapsed % 60;
            var timeStr = mins > 0 ? mins + "m " + secs + "s" : secs + "s";

            // Smoothly advance bar from current position toward 70% (but never past it)
            // This gives visual feedback that progress is happening
            if (_progressCurrentPct < 70) {
                _progressCurrentPct += 0.5; // advance ~0.5% per second
                fillEl.style.width = Math.min(_progressCurrentPct, 70) + "%";
            }

            textEl.innerText = msg + "  ⏱ " + timeStr;
        }, 1000);
    }
}

function hideProgress() {
    if (_progressTimer) { clearInterval(_progressTimer); _progressTimer = null; }
    var container = document.getElementById("progress-container");
    var fillEl = document.getElementById("progress-fill");
    fillEl.style.width = "100%";
    fillEl.classList.add("done");
    // Let the 100% animation play, then hide
    setTimeout(function() {
        container.classList.add("hidden");
        fillEl.style.width = "0%";
        fillEl.classList.remove("done");
        _progressCurrentPct = 0;
    }, 1500);
    operationRunning = false;
}

// ── SETTINGS ─────────────────────────────────────────────────
function loadSettings() {
    try {
        if (fsModule && fsModule.existsSync(configPath)) {
            var d = JSON.parse(fsModule.readFileSync(configPath, "utf8"));
            // Merge known keys (preserve defaults for missing)
            if (d.language) settings.language = d.language;
            if (typeof d.audioStep === "number") settings.audioStep = d.audioStep;
            if (typeof d.showWelcome === "boolean") settings.showWelcome = d.showWelcome;
            if (typeof d.autoRefresh === "boolean") settings.autoRefresh = d.autoRefresh;
            if (d.scale && d.scale.length === 5) settings.scale = d.scale;
            if (d.moveStep && d.moveStep.length === 4) settings.moveStep = d.moveStep;
            if (d.transformScale && d.transformScale.length === 5) settings.transformScale = d.transformScale;
            if (d.captions && typeof d.captions === "object") {
                for (var k in DEFAULT_SETTINGS.captions) {
                    if (d.captions[k] !== undefined) settings.captions[k] = d.captions[k];
                }
            }
            if (typeof d.bitrate === "number") settings.bitrate = d.bitrate;
            if (typeof d.exportPath === "string") settings.exportPath = d.exportPath;
            if (typeof d.groqApiKey === "string") settings.groqApiKey = d.groqApiKey;
        }
    } catch(e) { console.log("[loadSettings] error:", e); }
    if (settings.language && typeof applyLanguage === "function") {
        currentLang = settings.language;
        applyLanguage(currentLang);
    }
    applySettingsToUI();
}
function saveSettings() {
    try {
        if (fsModule) fsModule.writeFileSync(configPath, JSON.stringify(settings, null, 2), "utf8");
    } catch(e) { console.log("[saveSettings] error:", e); }
}
function applySettingsToUI() {
    // Bitrate input in Export section
    var bi = document.getElementById("batch-bitrate-input");
    if (bi) bi.value = settings.bitrate;

    // Default export path
    var ep = document.getElementById("export-path");
    if (ep && settings.exportPath && !ep.value) ep.value = settings.exportPath;

    // Static Scale buttons (5 main + 1 reset)
    var scaleBtns = document.querySelectorAll('.scale-preset:not([data-reset])');
    for (var i = 0; i < scaleBtns.length && i < settings.scale.length; i++) {
        scaleBtns[i].textContent = settings.scale[i];
        scaleBtns[i].setAttribute('data-scale', settings.scale[i]);
    }

    // Move Step chips
    var stepChips = document.querySelectorAll('.step-chip');
    for (var s = 0; s < stepChips.length && s < settings.moveStep.length; s++) {
        stepChips[s].textContent = settings.moveStep[s];
        stepChips[s].setAttribute('data-val', settings.moveStep[s]);
    }
    var stepInput = document.getElementById('nudge-step');
    if (stepInput && settings.moveStep[0]) stepInput.value = settings.moveStep[0];

    // Transform Scale chips
    var tscaleChips = document.querySelectorAll('.scale-chip');
    for (var c = 0; c < tscaleChips.length && c < settings.transformScale.length; c++) {
        tscaleChips[c].textContent = settings.transformScale[c];
        tscaleChips[c].setAttribute('data-val', settings.transformScale[c]);
    }

    // Caption defaults
    setSel("cap-language",  settings.captions.language);
    setSel("cap-model",     settings.captions.model);
    setSel("cap-style",     settings.captions.style);
}
function setSel(id, val) {
    var el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = String(val);
}

function populateSettingsForm() {
    setSel("cfg-language", settings.language);
    setSel("cfg-audio-step", String(settings.audioStep));
    var sw = document.getElementById("cfg-show-welcome");   if (sw) sw.checked = !!settings.showWelcome;
    var ar = document.getElementById("cfg-auto-refresh");   if (ar) ar.checked = !!settings.autoRefresh;

    for (var i = 1; i <= 5; i++) {
        var sEl = document.getElementById("cfg-scale-" + i);
        if (sEl) sEl.value = settings.scale[i-1];
        var tEl = document.getElementById("cfg-tscale-" + i);
        if (tEl) tEl.value = settings.transformScale[i-1];
    }
    for (var j = 1; j <= 4; j++) {
        var stEl = document.getElementById("cfg-step-" + j);
        if (stEl) stEl.value = settings.moveStep[j-1];
    }

    setSel("cfg-cap-language",  settings.captions.language);
    setSel("cfg-cap-model",     settings.captions.model);
    setSel("cfg-cap-style",     settings.captions.style);

    var gk = document.getElementById("cfg-groq-key");        if (gk) gk.value = settings.groqApiKey || "";
    var br = document.getElementById("cfg-bitrate");       if (br) br.value = settings.bitrate;
    var ep = document.getElementById("cfg-export-path");   if (ep) ep.value = settings.exportPath || "";
    setSel("cfg-filename-pattern", settings.filenamePattern);
}

function readSettingsForm() {
    settings.language    = (document.getElementById("cfg-language")   || {value:"en"}).value;
    settings.audioStep   = +(document.getElementById("cfg-audio-step")|| {value:1}).value || 1;
    settings.showWelcome = !!(document.getElementById("cfg-show-welcome") || {}).checked;
    settings.autoRefresh = !!(document.getElementById("cfg-auto-refresh") || {}).checked;

    var newScale = [], newTScale = [], newStep = [];
    for (var i = 1; i <= 5; i++) {
        newScale.push( + (document.getElementById("cfg-scale-"  + i) || {value:settings.scale[i-1]}).value );
        newTScale.push(+ (document.getElementById("cfg-tscale-" + i) || {value:settings.transformScale[i-1]}).value );
    }
    for (var j = 1; j <= 4; j++) {
        newStep.push(+ (document.getElementById("cfg-step-" + j) || {value:settings.moveStep[j-1]}).value );
    }
    settings.scale = newScale;
    settings.transformScale = newTScale;
    settings.moveStep = newStep;

    settings.captions.language  = (document.getElementById("cfg-cap-language")  || {value:settings.captions.language}).value;
    settings.captions.model     = (document.getElementById("cfg-cap-model")     || {value:settings.captions.model}).value;
    settings.captions.style     = (document.getElementById("cfg-cap-style")     || {value:settings.captions.style}).value;

    settings.bitrate    = +(document.getElementById("cfg-bitrate")     || {value:settings.bitrate}).value || 10;
    settings.groqApiKey = (document.getElementById("cfg-groq-key") || {value:""}).value;
    settings.exportPath =  (document.getElementById("cfg-export-path") || {value:""}).value;
    settings.filenamePattern = (document.getElementById("cfg-filename-pattern") || {value:"sequence"}).value;

    if (settings.language !== currentLang) {
        currentLang = settings.language;
        applyLanguage(currentLang);
    }
    if (typeof window.__refreshAuto === "function") window.__refreshAuto();
}
function findExportPreset() {
    if (!fsModule) return;
    // Try direct known paths first (fast)
    var knownPaths = [
        "/Applications/Adobe Media Encoder 2026/Adobe Media Encoder 2026.app/Contents/MediaIO/systempresets/4E49434B_48323634/00 - Match Source - High bitrate.epr",
        "/Applications/Adobe Media Encoder 2025/Adobe Media Encoder 2025.app/Contents/MediaIO/systempresets/4E49434B_48323634/00 - Match Source - High bitrate.epr",
        "/Applications/Adobe Media Encoder 2024/Adobe Media Encoder 2024.app/Contents/MediaIO/systempresets/4E49434B_48323634/00 - Match Source - High bitrate.epr"
    ];
    for (var i = 0; i < knownPaths.length; i++) {
        try {
            if (fsModule.existsSync(knownPaths[i])) {
                foundPresetPath = knownPaths[i];
                console.log("[EFP] Preset found (direct): " + foundPresetPath);
                return;
            }
        } catch(e) {}
    }
    // Fallback: search with find
    if (!execModule) return;
    execModule('find /Applications -name "*.epr" -path "*Match*Source*High*" 2>/dev/null | head -1', function(e, o) {
        if (o && o.trim()) {
            foundPresetPath = o.trim();
            console.log("[EFP] Preset found (find): " + foundPresetPath);
        }
    });
}
function checkFirstLaunch() {
    try {
        var m = document.getElementById("welcome-modal");
        if (!m) return;
        // Show whenever user hasn't opted out via settings
        if (settings.showWelcome) m.classList.remove("hidden");
    } catch(e) {}
}



// ── EXPORT PRESET ────────────────────────────────────────────
function modifyPresetBitrate(cb) {
    if (!foundPresetPath || !fsModule) return;
    var brEl = document.getElementById("batch-bitrate-input");
    var br = (brEl ? brEl.value : null) || String(settings.bitrate || 10);
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


// ============================================================
// SFX LIBRARY — 1-Click Sound Effects
// ============================================================
(function() {
    var sfxCatalog = null;
    var sfxSounds = [];
    var sfxCurrentCat = "all";
    var sfxCurrentSearch = "";
    var sfxPlayingId = null;
    var sfxAudio = null;

    function getSFXBasePath() {
        if (typeof extensionPath !== "undefined" && extensionPath) {
            return extensionPath + "/sfx/";
        }
        return "";
    }

    function loadSFXCatalog() {
        var basePath = getSFXBasePath();
        if (!basePath) {
            console.log("[SFX] No extension path, cannot load catalog");
            return;
        }
        var catalogFile = basePath + "catalog.json";
        try {
            if (typeof fsModule !== "undefined" && fsModule) {
                if (!fsModule.existsSync(catalogFile)) {
                    console.log("[SFX] catalog.json not found at:", catalogFile);
                    return;
                }
                var data = fsModule.readFileSync(catalogFile, "utf-8");
                sfxCatalog = JSON.parse(data);
                sfxSounds = sfxCatalog.sounds || [];
                console.log("[SFX] Loaded catalog:", sfxSounds.length, "sounds");
                renderCategories();
                renderSoundList();
            }
        } catch(e) {
            console.warn("[SFX] Failed to load catalog:", e.message);
        }
    }

    function renderCategories() {
        var container = document.getElementById("sfx-categories");
        if (!container || !sfxCatalog) return;

        container.innerHTML = "";

        var allBtn = document.createElement("button");
        allBtn.className = "sfx-cat-btn sfx-cat-active";
        allBtn.setAttribute("data-cat", "all");
        allBtn.textContent = (typeof currentLang !== "undefined" && currentLang === "ar") ? "الكل" : "All";
        allBtn.addEventListener("click", function() { selectCategory("all"); });
        container.appendChild(allBtn);

        var cats = sfxCatalog.categories || [];
        for (var i = 0; i < cats.length; i++) {
            var cat = cats[i];
            var hasSound = false;
            for (var j = 0; j < sfxSounds.length; j++) {
                if (sfxSounds[j].category === cat.id) { hasSound = true; break; }
            }
            if (!hasSound) continue;

            var btn = document.createElement("button");
            btn.className = "sfx-cat-btn";
            btn.setAttribute("data-cat", cat.id);
            var label = cat.icon + " ";
            if (typeof currentLang !== "undefined" && currentLang === "ar" && cat.name_ar) {
                label += cat.name_ar;
            } else {
                label += cat.name;
            }
            btn.textContent = label;
            (function(catId) {
                btn.addEventListener("click", function() { selectCategory(catId); });
            })(cat.id);
            container.appendChild(btn);
        }
    }

    function selectCategory(catId) {
        sfxCurrentCat = catId;
        var btns = document.querySelectorAll(".sfx-cat-btn");
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle("sfx-cat-active", btns[i].getAttribute("data-cat") === catId);
        }
        renderSoundList();
    }

    function getFilteredSounds() {
        var result = [];
        var search = sfxCurrentSearch.toLowerCase();
        for (var i = 0; i < sfxSounds.length; i++) {
            var s = sfxSounds[i];
            if (sfxCurrentCat !== "all" && s.category !== sfxCurrentCat) continue;
            if (search && s.name.toLowerCase().indexOf(search) === -1) continue;
            result.push(s);
        }
        return result;
    }

    function renderSoundList() {
        var listEl = document.getElementById("sfx-list");
        var statusEl = document.getElementById("sfx-status");
        if (!listEl) return;

        var filtered = getFilteredSounds();
        listEl.innerHTML = "";

        if (filtered.length === 0) {
            var emptyDiv = document.createElement("div");
            emptyDiv.className = "sfx-empty";
            emptyDiv.innerHTML = '<span class="sfx-empty-icon">🔇</span><span>' +
                ((typeof currentLang !== "undefined" && currentLang === "ar") ? "لا توجد مؤثرات" : "No sounds found") + '</span>';
            listEl.appendChild(emptyDiv);
            if (statusEl) statusEl.textContent = "";
            return;
        }

        for (var i = 0; i < filtered.length; i++) {
            listEl.appendChild(createSoundRow(filtered[i]));
        }

        if (statusEl) {
            var countText = (typeof currentLang !== "undefined" && currentLang === "ar")
                ? filtered.length + " مؤثر صوتي"
                : filtered.length + " sounds";
            statusEl.textContent = countText;
        }
    }

    function createSoundRow(sound) {
        var row = document.createElement("div");
        row.className = "sfx-row";
        row.setAttribute("data-sfx-id", sound.id);

        var playBtn = document.createElement("button");
        playBtn.className = "sfx-play-btn";
        playBtn.innerHTML = "▶";
        playBtn.title = "Preview";
        playBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            togglePreview(sound, playBtn, row);
        });

        var nameSpan = document.createElement("span");
        nameSpan.className = "sfx-name";
        nameSpan.textContent = sound.name;

        var durSpan = document.createElement("span");
        durSpan.className = "sfx-duration";
        durSpan.textContent = sound.duration || "--";

        var addBtn = document.createElement("button");
        addBtn.className = "sfx-add-btn";
        addBtn.innerHTML = "➕";
        addBtn.title = "Add to timeline at playhead";
        addBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            addSFXToTimeline(sound, addBtn);
        });

        row.appendChild(playBtn);
        row.appendChild(nameSpan);
        row.appendChild(durSpan);
        row.appendChild(addBtn);

        row.addEventListener("dblclick", function() {
            addSFXToTimeline(sound, addBtn);
        });

        return row;
    }

    var WAVE_HTML = '<span class="sfx-wave"><span class="sfx-wave-bar"></span><span class="sfx-wave-bar"></span><span class="sfx-wave-bar"></span><span class="sfx-wave-bar"></span><span class="sfx-wave-bar"></span></span>';

    function togglePreview(sound, playBtn, row) {
        if (!sfxAudio) sfxAudio = document.getElementById("sfx-audio-preview");
        if (!sfxAudio) return;

        if (sfxPlayingId === sound.id) {
            sfxAudio.pause();
            sfxAudio.currentTime = 0;
            sfxPlayingId = null;
            playBtn.classList.remove("sfx-playing");
            playBtn.innerHTML = "▶";
            row.classList.remove("sfx-row-playing");
            removeWave(row);
            return;
        }

        stopAllPreviews();

        var basePath = getSFXBasePath();
        var filePath = basePath + sound.file;
        var fileUrl = "file:///" + filePath.replace(/\\/g, "/");

        sfxAudio.src = fileUrl;
        sfxAudio.play().then(function() {
            sfxPlayingId = sound.id;
            playBtn.classList.add("sfx-playing");
            playBtn.innerHTML = "⏸";
            row.classList.add("sfx-row-playing");
            addWave(row);
        }).catch(function(err) {
            console.warn("[SFX] Preview failed:", err.message);
            sfxAudio.src = filePath;
            sfxAudio.play().catch(function(err2) {
                console.warn("[SFX] Preview fallback failed:", err2.message);
            });
        });

        sfxAudio.onended = function() {
            sfxPlayingId = null;
            playBtn.classList.remove("sfx-playing");
            playBtn.innerHTML = "▶";
            row.classList.remove("sfx-row-playing");
            removeWave(row);
        };
    }

    function addWave(row) {
        removeWave(row);
        var nameEl = row.querySelector(".sfx-name");
        if (nameEl) {
            var w = document.createElement("span");
            w.className = "sfx-wave";
            w.innerHTML = '<span class="sfx-wave-bar"></span><span class="sfx-wave-bar"></span><span class="sfx-wave-bar"></span><span class="sfx-wave-bar"></span><span class="sfx-wave-bar"></span>';
            nameEl.parentNode.insertBefore(w, nameEl.nextSibling);
        }
    }

    function removeWave(row) {
        var existing = row.querySelector(".sfx-wave");
        if (existing) existing.parentNode.removeChild(existing);
    }

    function stopAllPreviews() {
        if (sfxAudio) { sfxAudio.pause(); sfxAudio.currentTime = 0; }
        sfxPlayingId = null;
        var playBtns = document.querySelectorAll(".sfx-play-btn");
        for (var i = 0; i < playBtns.length; i++) {
            playBtns[i].classList.remove("sfx-playing");
            playBtns[i].innerHTML = "▶";
        }
        var rows = document.querySelectorAll(".sfx-row");
        for (var j = 0; j < rows.length; j++) {
            rows[j].classList.remove("sfx-row-playing");
            removeWave(rows[j]);
        }
    }

    function addSFXToTimeline(sound, addBtn) {
        var basePath = getSFXBasePath();
        var filePath = basePath + sound.file;
        var escapedPath = filePath.replace(/\\/g, "/").replace(/"/g, '\\"');

        console.log("[SFX] Adding to timeline:", escapedPath);

        if (typeof csInterface !== "undefined") {
            csInterface.evalScript(
                '$._editflow.importSFXToTimeline("' + escapedPath + '")',
                function(result) {
                    console.log("[SFX] Result:", result);
                    if (typeof handleJSXResult === "function") handleJSXResult(result);
                    addBtn.classList.add("sfx-added");
                    addBtn.innerHTML = "✓";
                    setTimeout(function() {
                        addBtn.classList.remove("sfx-added");
                        addBtn.innerHTML = "➕";
                    }, 1500);
                }
            );
        }
    }

    function initSFXSearch() {
        var searchInput = document.getElementById("sfx-search");
        if (!searchInput) return;
        searchInput.addEventListener("input", function() {
            sfxCurrentSearch = searchInput.value;
            renderSoundList();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() {
            initSFXSearch();
            setTimeout(loadSFXCatalog, 500);
        });
    } else {
        initSFXSearch();
        setTimeout(loadSFXCatalog, 500);
    }

    window.reloadSFXLibrary = function() {
        if (sfxCatalog) { renderCategories(); renderSoundList(); }
    };
})();
