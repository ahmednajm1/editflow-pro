// main.js - EditFlow Pro v17 — Production Build
// ES5 only. Direct csInterface.evalScript for ALL buttons.

// Global error boundary — prevents silent crashes
window.onerror = function(msg, url, line) {
    console.error("[EFP] Uncaught error:", msg, "at", url, "line", line);
    try { showStatus("An unexpected error occurred.", "red"); } catch(e) {}
    return true;
};

var CURRENT_VERSION = "1.3.30";
var csInterface = null, dsp = null;
var fsModule = null, osModule = null, pathModule = null, execModule = null, execFileModule = null, spawnModule = null;
var foundPresetPath = null, extensionPath = "", configPath = "";
var operationRunning = false, statusTimer = null;
var activeCaptionProcess = null, activeClipboardProcess = null;
var EFP_BIN_DIR = "";
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
        wordsPerCaption: 3,
        wordsMin: 3,
        wordsMax: 5,
        animation: "pop",
        font: "Inter",
        size: "72",
        color: "#ffffff",
        highlight: "#1F8FFF"
    },
    bitrate: 10,
    exportPath: "",
    filenamePattern: "sequence",
    groqApiKey: "",
    favoriteSfx: [],
    downloadPath: "",
    downloadQuality: "1080",
    downloadPlacement: "timeline",
    refineProvider: "groq",
    refineModel: "",
    refineEnabled: false,
    refineMode: "fix",
    refineLang: "English",
    anthropicApiKey: "",
    openaiApiKey: "",
    ytdlpLastUpdate: 0
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
        cap_words_per: "Words/cap",
        cap_words_per_hint: "words per caption",
        cap_words_from: "from",
        cap_words_to: "to",
        cap_words_range_hint: "words · smart split at pauses",
        cfg_cap_words_per: "Words per caption",
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
        btn_stop: "Stop",
        btn_save: "Save Changes",
        confirm_title: "Confirm",
        confirm_text: "Are you sure?",
        confirm_yes: "Confirm",
        welcome_btn: "Get Started",
        welcome_tagline: "Professional one-click editing tools",
        welcome_f1: "Auto-transcribe and translate in 15+ languages",
        welcome_f2: "200 Cinematic SFX ready to inject into your timeline",
        welcome_f3: "Dynamic Subtitles with instant professional animations",
        welcome_f4: "Smart Tools: Transform, Web Paste & Frame Capture",
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
        sfx_count: "{n} sounds",
        help_tutorials: "Video Tutorials",
        help_contact: "Contact & Help",
        audio_voice: "Voice",
        audio_sfx: "SFX",
        audio_bgm: "BGM",
        dl_title: "Import from Link",
        cap_refine: "Refine with a stronger AI",
        cap_refine_fix: "Fix errors and wording",
        cap_refine_translate: "Fix, then translate to…",
        cap_refine_hint: "Timings are preserved. Set the provider under Settings → Captions.",
        cap_refine_working: "Refining the transcript…",
        cap_refine_done: "Refined {n} segments ✓",
        cap_refine_failed: "Refinement skipped — using the raw transcript.",
        cap_refine_err_key: "No API key for the selected refinement provider. Add it under Settings → Captions.",
        cfg_refine_title: "✨ AI Text Refinement",
        cfg_refine_desc: "Which model cleans up and translates the transcript. Groq uses the free key above.",
        cfg_refine_groq: "Groq · free (uses the key above)",
        cfg_refine_claude: "Claude · best for Arabic",
        cfg_refine_gpt: "GPT",
        cfg_anthropic_key: "Anthropic API Key",
        cfg_openai_key: "OpenAI API Key",
        cfg_refine_model: "Model (optional override)",
        cfg_refine_model_ph: "leave empty for the recommended model",
        cfg_cap_accuracy: "Default Accuracy",
        cap_lang: "Lang",
        cap_style: "Style",
        dl_place: "Place",
        dl_place_timeline: "Current sequence, at the playhead",
        dl_place_newseq: "New sequence matching the video",
        dl_place_bin: "Project bin only",
        dl_saveto: "Save to",
        dl_path_ph: "Movies/EditFlow Downloads",
        dl_open_folder: "Open folder",
        dl_desc: "Paste a YouTube or Instagram link to bring your own or licensed footage straight onto the timeline.",
        dl_url_ph: "Paste a video link\u2026",
        dl_paste: "Paste",
        dl_fetch: "Fetch",
        dl_quality: "Quality",
        dl_q_1080: "1080p \u00b7 instant, Premiere-ready",
        dl_q_max: "Highest available \u00b7 converts, slower",
        dl_trim: "Clip range (optional)",
        dl_from_ph: "from 0:30",
        dl_to_ph: "to 1:45",
        dl_trim_hint: "Grabs only this part of the video instead of the whole file.",
        dl_cookies: "Sign-in",
        dl_cookies_none: "No sign-in",
        dl_to_timeline: "Place on the timeline at the playhead",
        dl_btn: "Download & Import",
        dl_installing: "Setting up the download engine (one time)\u2026",
        dl_fetching: "Reading the link\u2026",
        dl_preparing: "Preparing\u2026",
        dl_downloading: "Downloading\u2026",
        dl_merging: "Merging video and audio\u2026",
        dl_checking: "Checking the codec\u2026",
        dl_converting: "Converting for Premiere\u2026",
        dl_importing: "Importing into Premiere\u2026",
        dl_done: "Done \u2713",
        dl_cancelled: "Download cancelled.",
        dl_err_nourl: "Paste a link first.",
        dl_err_info: "Could not read that link.",
        dl_err_login: "This post needs a sign-in. Pick your browser under Sign-in and try again.",
        dl_err_bot: "YouTube is asking to confirm you are not a bot. Pick your browser under Sign-in, or wait a few minutes and retry.",
        dl_err_format: "No Premiere-friendly format for this video. Try Highest available quality.",
        dl_err_unsupported: "That link is not supported.",
        dl_err_network: "Network problem. Check your connection and try again.",
        dl_err_generic: "Download failed. Try again, or check the link.",
        dl_err_nofile: "The download finished but the file could not be found.",
        dl_err_convert: "Conversion for Premiere failed.",
        dl_err_time: "Use a time like 0:30 or 1:02:15.",
        dl_err_clipboard: "Could not read the clipboard.",
        dl_err_folder: "That save folder cannot be used. Pick another one.",
        dl_err_ffmpeg: "FFmpeg is required for downloads. Install it, then try again.",
        cfg_download_path: "Downloads Folder",
        cfg_download_path_ph: "Movies/EditFlow Downloads"
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
        cap_words_per: "كلمات/مقطع",
        cap_words_per_hint: "كلمة لكل مقطع",
        cap_words_from: "من",
        cap_words_to: "إلى",
        cap_words_range_hint: "كلمة · تقسيم ذكي عند الوقفات",
        cfg_cap_words_per: "عدد الكلمات في المقطع",
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
        btn_stop: "إيقاف",
        btn_save: "حفظ التغييرات",
        confirm_title: "تأكيد",
        confirm_text: "هل أنت متأكد؟",
        confirm_yes: "تأكيد",
        welcome_btn: "ابدأ الآن",
        welcome_tagline: "أدوات احترافية بكبسة زر",
        welcome_f1: "تفريغ وترجمة تلقائية لأكثر من ١٥ لغة",
        welcome_f2: "٢٠٠ مؤثر صوتي سينمائي جاهز للإضافة للتايملاين",
        welcome_f3: "ترجمة نصية تفاعلية مع حركات احترافية فورية",
        welcome_f4: "أدوات ذكية: التحويل، لصق من الويب، والتقاط الإطارات",
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
        sfx_count: "{n} مؤثر صوتي",
        help_tutorials: "شروحات الفيديو",
        help_contact: "الدعم والمساعدة",
        audio_voice: "صوت",
        audio_sfx: "مؤثرات",
        audio_bgm: "موسيقى",
        dl_title: "\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0645\u0646 \u0631\u0627\u0628\u0637",
        cap_refine: "\u062a\u062d\u0633\u064a\u0646 \u0628\u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0623\u0642\u0648\u0649",
        cap_refine_fix: "\u062a\u0635\u062d\u064a\u062d \u0627\u0644\u0623\u062e\u0637\u0627\u0621 \u0648\u0627\u0644\u0635\u064a\u0627\u063a\u0629",
        cap_refine_translate: "\u062a\u0635\u062d\u064a\u062d \u062b\u0645 \u062a\u0631\u062c\u0645\u0629 \u0625\u0644\u0649\u2026",
        cap_refine_hint: "\u0627\u0644\u062a\u0648\u0642\u064a\u062a\u0627\u062a \u0645\u062d\u0641\u0648\u0638\u0629. \u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0632\u0648\u0651\u062f \u0645\u0646 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u2190 \u0627\u0644\u062a\u0631\u062c\u0645\u0629.",
        cap_refine_working: "\u062c\u0627\u0631\u064a \u062a\u062d\u0633\u064a\u0646 \u0627\u0644\u0646\u0635\u2026",
        cap_refine_done: "\u062a\u0645 \u062a\u062d\u0633\u064a\u0646 {n} \u0645\u0642\u0637\u0639\u0627\u064b \u2713",
        cap_refine_failed: "\u062a\u064f\u062e\u0637\u0651\u064a \u0627\u0644\u062a\u062d\u0633\u064a\u0646 \u2014 \u0627\u0633\u062a\u064f\u062e\u062f\u0645 \u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064a.",
        cap_refine_err_key: "\u0644\u0627 \u064a\u0648\u062c\u062f \u0645\u0641\u062a\u0627\u062d API \u0644\u0644\u0645\u0632\u0648\u0651\u062f \u0627\u0644\u0645\u062e\u062a\u0627\u0631. \u0623\u0636\u0641\u0647 \u0645\u0646 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u2190 \u0627\u0644\u062a\u0631\u062c\u0645\u0629.",
        cfg_refine_title: "\u2728 \u062a\u062d\u0633\u064a\u0646 \u0627\u0644\u0646\u0635 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a",
        cfg_refine_desc: "\u0623\u064a \u0645\u0648\u062f\u064a\u0644 \u064a\u0646\u0642\u0651\u062d \u0627\u0644\u0646\u0635 \u0648\u064a\u062a\u0631\u062c\u0645\u0647. \u062e\u064a\u0627\u0631 Groq \u064a\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0645\u0641\u062a\u0627\u062d \u0627\u0644\u0645\u062c\u0627\u0646\u064a \u0623\u0639\u0644\u0627\u0647.",
        cfg_refine_groq: "Groq \xb7 \u0645\u062c\u0627\u0646\u064a (\u064a\u0633\u062a\u062e\u062f\u0645 \u0627\u0644\u0645\u0641\u062a\u0627\u062d \u0623\u0639\u0644\u0627\u0647)",
        cfg_refine_claude: "Claude \xb7 \u0627\u0644\u0623\u0641\u0636\u0644 \u0644\u0644\u0639\u0631\u0628\u064a\u0629",
        cfg_refine_gpt: "GPT",
        cfg_anthropic_key: "\u0645\u0641\u062a\u0627\u062d Anthropic API",
        cfg_openai_key: "\u0645\u0641\u062a\u0627\u062d OpenAI API",
        cfg_refine_model: "\u0627\u0644\u0645\u0648\u062f\u064a\u0644 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)",
        cfg_refine_model_ph: "\u0627\u062a\u0631\u0643\u0647 \u0641\u0627\u0631\u063a\u0627\u064b \u0644\u0644\u0645\u0648\u062f\u064a\u0644 \u0627\u0644\u0645\u0648\u0635\u0649 \u0628\u0647",
        cap_generate: "\u26a1 \u062a\u0648\u0644\u064a\u062f \u062a\u0631\u062c\u0645\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062a\u0639\u062f\u064a\u0644",
        dl_place: "\u0627\u0644\u0648\u0636\u0639",
        dl_place_timeline: "\u0627\u0644\u0633\u064a\u0643\u0648\u064a\u0646\u0633 \u0627\u0644\u062d\u0627\u0644\u064a\u060c \u0639\u0646\u062f \u0627\u0644\u0645\u0624\u0634\u0631",
        dl_place_newseq: "\u0633\u064a\u0643\u0648\u064a\u0646\u0633 \u062c\u062f\u064a\u062f \u0628\u0645\u0642\u0627\u0633 \u0627\u0644\u0641\u064a\u062f\u064a\u0648",
        dl_place_bin: "\u0645\u062c\u0644\u062f \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0641\u0642\u0637",
        dl_saveto: "\u0627\u0644\u062d\u0641\u0638 \u0641\u064a",
        dl_path_ph: "Movies/EditFlow Downloads",
        dl_open_folder: "\u0641\u062a\u062d \u0627\u0644\u0645\u062c\u0644\u062f",
        dl_desc: "\u0627\u0644\u0635\u0642 \u0631\u0627\u0628\u0637 \u064a\u0648\u062a\u064a\u0648\u0628 \u0623\u0648 \u0627\u0646\u0633\u062a\u063a\u0631\u0627\u0645 \u0644\u0625\u062d\u0636\u0627\u0631 \u0645\u0648\u0627\u062f\u0643 \u0623\u0648 \u0627\u0644\u0645\u0648\u0627\u062f \u0627\u0644\u0645\u0631\u062e\u0651\u0635\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0625\u0644\u0649 \u0627\u0644\u062a\u0627\u064a\u0645 \u0644\u0627\u064a\u0646.",
        dl_url_ph: "\u0627\u0644\u0635\u0642 \u0631\u0627\u0628\u0637 \u0627\u0644\u0641\u064a\u062f\u064a\u0648\u2026",
        dl_paste: "\u0644\u0635\u0642",
        dl_fetch: "\u062c\u0644\u0628",
        dl_quality: "\u0627\u0644\u062c\u0648\u062f\u0629",
        dl_q_1080: "1080p \u00b7 \u0641\u0648\u0631\u064a \u0648\u062c\u0627\u0647\u0632 \u0644\u0628\u0631\u064a\u0645\u064a\u0631",
        dl_q_max: "\u0623\u0639\u0644\u0649 \u062c\u0648\u062f\u0629 \u0645\u062a\u0627\u062d\u0629 \u00b7 \u064a\u062d\u0648\u0651\u0644\u060c \u0623\u0628\u0637\u0623",
        dl_trim: "\u0645\u0642\u0637\u0639 \u0645\u062d\u062f\u062f (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)",
        dl_from_ph: "\u0645\u0646 0:30",
        dl_to_ph: "\u0625\u0644\u0649 1:45",
        dl_trim_hint: "\u064a\u0646\u0632\u0651\u0644 \u0647\u0630\u0627 \u0627\u0644\u062c\u0632\u0621 \u0641\u0642\u0637 \u0628\u062f\u0644 \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0643\u0627\u0645\u0644.",
        dl_cookies: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
        dl_cookies_none: "\u0628\u062f\u0648\u0646 \u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644",
        dl_to_timeline: "\u0636\u0639\u0647 \u0641\u064a \u0627\u0644\u062a\u0627\u064a\u0645 \u0644\u0627\u064a\u0646 \u0639\u0646\u062f \u0627\u0644\u0645\u0624\u0634\u0631",
        dl_btn: "\u062a\u062d\u0645\u064a\u0644 \u0648\u0627\u0633\u062a\u064a\u0631\u0627\u062f",
        dl_installing: "\u062a\u062c\u0647\u064a\u0632 \u0645\u062d\u0631\u0643 \u0627\u0644\u062a\u062d\u0645\u064a\u0644 (\u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629)\u2026",
        dl_fetching: "\u062c\u0627\u0631\u064a \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u0631\u0627\u0628\u0637\u2026",
        dl_preparing: "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0636\u064a\u0631\u2026",
        dl_downloading: "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644\u2026",
        dl_merging: "\u062f\u0645\u062c \u0627\u0644\u0635\u0648\u0631\u0629 \u0648\u0627\u0644\u0635\u0648\u062a\u2026",
        dl_checking: "\u0641\u062d\u0635 \u0627\u0644\u0643\u0648\u062f\u0643\u2026",
        dl_converting: "\u062a\u062d\u0648\u064a\u0644 \u0644\u064a\u062a\u0648\u0627\u0641\u0642 \u0645\u0639 \u0628\u0631\u064a\u0645\u064a\u0631\u2026",
        dl_importing: "\u0627\u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0625\u0644\u0649 \u0628\u0631\u064a\u0645\u064a\u0631\u2026",
        dl_done: "\u062a\u0645 \u2713",
        dl_cancelled: "\u0623\u064f\u0644\u063a\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644.",
        dl_err_nourl: "\u0627\u0644\u0635\u0642 \u0631\u0627\u0628\u0637\u0627\u064b \u0623\u0648\u0644\u0627\u064b.",
        dl_err_info: "\u062a\u0639\u0630\u0651\u0631\u062a \u0642\u0631\u0627\u0621\u0629 \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637.",
        dl_err_login: "\u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u0634\u0648\u0631 \u064a\u062d\u062a\u0627\u062c \u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644. \u0627\u062e\u062a\u0631 \u0645\u062a\u0635\u0641\u062d\u0643 \u0645\u0646 \u062e\u0627\u0646\u0629 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0648\u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.",
        dl_err_bot: "\u064a\u0648\u062a\u064a\u0648\u0628 \u064a\u0637\u0644\u0628 \u0627\u0644\u062a\u0623\u0643\u062f \u0645\u0646 \u0623\u0646\u0643 \u0644\u0633\u062a \u0631\u0648\u0628\u0648\u062a. \u0627\u062e\u062a\u0631 \u0645\u062a\u0635\u0641\u062d\u0643 \u0645\u0646 \u062e\u0627\u0646\u0629 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644\u060c \u0623\u0648 \u0627\u0646\u062a\u0638\u0631 \u062f\u0642\u0627\u0626\u0642 \u0648\u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.",
        dl_err_format: "\u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u064a\u063a\u0629 \u0645\u0646\u0627\u0633\u0628\u0629 \u0644\u0628\u0631\u064a\u0645\u064a\u0631 \u0644\u0647\u0630\u0627 \u0627\u0644\u0641\u064a\u062f\u064a\u0648. \u062c\u0631\u0651\u0628 \u062e\u064a\u0627\u0631 \u0623\u0639\u0644\u0649 \u062c\u0648\u062f\u0629 \u0645\u062a\u0627\u062d\u0629.",
        dl_err_unsupported: "\u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 \u063a\u064a\u0631 \u0645\u062f\u0639\u0648\u0645.",
        dl_err_network: "\u0645\u0634\u0643\u0644\u0629 \u0641\u064a \u0627\u0644\u0634\u0628\u0643\u0629. \u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u062a\u0635\u0627\u0644\u0643 \u0648\u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.",
        dl_err_generic: "\u0641\u0634\u0644 \u0627\u0644\u062a\u062d\u0645\u064a\u0644. \u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0623\u0648 \u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0631\u0627\u0628\u0637.",
        dl_err_nofile: "\u0627\u0646\u062a\u0647\u0649 \u0627\u0644\u062a\u062d\u0645\u064a\u0644 \u0644\u0643\u0646 \u062a\u0639\u0630\u0651\u0631 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0644\u0641.",
        dl_err_convert: "\u0641\u0634\u0644 \u0627\u0644\u062a\u062d\u0648\u064a\u0644 \u0644\u0635\u064a\u063a\u0629 \u0628\u0631\u064a\u0645\u064a\u0631.",
        dl_err_time: "\u0627\u0633\u062a\u062e\u062f\u0645 \u0635\u064a\u063a\u0629 \u0648\u0642\u062a \u0645\u062b\u0644 0:30 \u0623\u0648 1:02:15.",
        dl_err_clipboard: "\u062a\u0639\u0630\u0651\u0631\u062a \u0642\u0631\u0627\u0621\u0629 \u0627\u0644\u062d\u0627\u0641\u0638\u0629.",
        dl_err_folder: "\u062a\u0639\u0630\u0651\u0631 \u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0645\u062c\u0644\u062f \u0627\u0644\u062d\u0641\u0638. \u0627\u062e\u062a\u0631 \u0645\u062c\u0644\u062f\u0627\u064b \u0622\u062e\u0631.",
        dl_err_ffmpeg: "\u0627\u0644\u062a\u062d\u0645\u064a\u0644 \u064a\u062d\u062a\u0627\u062c FFmpeg. \u062b\u0628\u0651\u062a\u0647 \u062b\u0645 \u0623\u0639\u062f \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.",
        cfg_download_path: "\u0645\u062c\u0644\u062f \u0627\u0644\u062a\u062d\u0645\u064a\u0644\u0627\u062a",
        cfg_download_path_ph: "Movies/EditFlow Downloads"
    }
};

document.addEventListener("DOMContentLoaded", function() {
    try { fsModule = require("fs"); } catch(e) { console.warn("[EFP] No fs:", e.message); }
    try { osModule = require("os"); } catch(e) { console.warn("[EFP] No os:", e.message); }
    try { pathModule = require("path"); } catch(e) { console.warn("[EFP] No path:", e.message); }
    try {
        var rawExec = require("child_process").exec;
        execModule = function(cmd, opts, callback) {
            if (typeof opts === 'function') {
                callback = opts;
                opts = undefined;
            }
            var isWin = (osModule && osModule.platform() === "win32");
            console.log("[EFP exec] Windows: " + isWin + ", Command:", cmd);
            return rawExec(cmd, opts, callback);
        };
        var rawExecFile = require("child_process").execFile;
        execFileModule = function(file, args, opts, callback) {
            if (typeof opts === 'function') {
                callback = opts;
                opts = undefined;
            }
            console.log("[EFP execFile] File:", file, "Args:", args);
            return rawExecFile(file, args, opts, callback);
        };
        // spawn is needed by the Web Downloader: exec/execFile only report back
        // once the process exits, which is useless for a multi-minute download
        // that has to stream live progress out of stdout.
        var rawSpawn = require("child_process").spawn;
        spawnModule = function(file, args, opts) {
            console.log("[EFP spawn] File:", file, "Args:", args);
            return rawSpawn(file, args, opts || {});
        };
    } catch(e) { console.warn("[EFP] No exec/execFile/spawn:", e.message); }

    try {
        csInterface = new CSInterface();
        extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
        if (osModule && pathModule) {
            var userData = pathModule.join(osModule.homedir(), "Library", "Application Support", "EditFlowPro");
            configPath = pathModule.join(userData, "editflow_config.json");
            EFP_BIN_DIR = pathModule.join(userData, "tools");
        } else {
            configPath = extensionPath + "/editflow_config.json"; // fallback
            EFP_BIN_DIR = extensionPath + "/bin";
        }
        if (fsModule) { loadSettings(); findExportPreset(); }
        try { dsp = new DSPTools(); } catch(e) {}

        // Bind progress cancel button
        safeBind("btn-progress-cancel", function() {
            if (activeCaptionProcess) {
                try {
                    activeCaptionProcess.kill('SIGTERM');
                    console.log("[Cancel] Sent SIGTERM to activeCaptionProcess");
                } catch(e) {
                    console.warn("[Cancel] Error killing process:", e.message);
                }
                activeCaptionProcess = null;
            }
            hideProgress();
            var statusLine = document.getElementById("cap-status");
            if (statusLine) statusLine.textContent = "Captioning cancelled.";
            showStatus("Captioning cancelled by user.", "orange");
        });
    } catch(e) {
        console.log("[CRITICAL] CSInterface init failed:", e.message);
    }

    function hideSplashScreen() {
        var splash = document.getElementById("splash-screen");
        if (splash) {
            // Keep it visible for at least 600ms for a premium feel
            setTimeout(function() {
                splash.style.opacity = "0";
                setTimeout(function() { splash.style.display = "none"; }, 500);
            }, 600);
        }
    }

    var vBadge = document.getElementById("version-badge");
    if (vBadge) vBadge.innerHTML = "v" + CURRENT_VERSION;
    var aboutVer = document.getElementById("about-version");
    if (aboutVer) aboutVer.innerHTML = "Version " + CURRENT_VERSION;

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
                    hideSplashScreen();
                });
            });
        } else {
            showStatus("EditFlow Pro ready.", "green");
            hideSplashScreen();
        }
    });

    // Step 6: Check for Updates
    checkForUpdates();

    // ============================================================
    // UPDATE CHECKER
    // ============================================================
    function checkForUpdates() {
        var remoteUrl = "https://www.najmedia.com/editflow/version.json?t=" + new Date().getTime();
        fetch(remoteUrl)
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data && data.version && data.version !== CURRENT_VERSION) {
                    showUpdateBanner(data.version, data.url, data.hot_update_url);
                }
            })
            .catch(function(err) { console.log("[EFP] Update check failed:", err); });
    }

    function showUpdateBanner(newVer, downloadUrl, hotUpdateUrl) {
        var banner = document.getElementById("update-banner");
        var msg = document.getElementById("update-text-msg");
        var btnNow = document.getElementById("btn-update-now");
        var btnDismiss = document.getElementById("btn-update-dismiss");
        
        if (!banner || !msg) return;
        
        msg.innerHTML = currentLang === "ar" ? "تحديث جديد متاح (" + newVer + ")" : "Update " + newVer + " Available!";
        
        if (hotUpdateUrl) {
            btnNow.innerHTML = currentLang === "ar" ? "تحديث فوري ⚡" : "Update Instantly ⚡";
        } else {
            btnNow.innerHTML = currentLang === "ar" ? "تنزيل" : "Download";
        }
        
        banner.classList.add("visible");
        
        btnNow.onclick = function() {
            if (hotUpdateUrl) {
                startHotUpdate(hotUpdateUrl, downloadUrl, newVer);
            } else {
                var targetUrl = downloadUrl;
                var isWin = (osModule && osModule.platform() === "win32");
                if (isWin && targetUrl.indexOf(".pkg") !== -1) {
                    targetUrl = "https://www.najmedia.com/editflow/EditFlow%20Pro%20Installer.exe";
                }
                csInterface.openURLInDefaultBrowser(targetUrl);
                banner.classList.remove("visible");
            }
        };
        
        btnDismiss.onclick = function() {
            banner.classList.remove("visible");
        };
    }

    function startHotUpdate(hotUpdateUrl, downloadUrl, newVer) {
        var banner = document.getElementById("update-banner");
        var msg = document.getElementById("update-text-msg");
        var btnNow = document.getElementById("btn-update-now");
        var btnDismiss = document.getElementById("btn-update-dismiss");

        if (!banner || !msg || !btnNow) return;

        // Disable UI
        btnNow.disabled = true;
        btnNow.style.opacity = "0.5";
        btnNow.style.pointerEvents = "none";
        if (btnDismiss) btnDismiss.style.display = "none";

        msg.innerHTML = currentLang === "ar" ? "جاري تحميل التحديث... ⏳" : "Downloading update... ⏳";
        btnNow.innerHTML = "...";

        if (!execModule || !fsModule || !osModule || !extensionPath) {
            console.error("[HotUpdate] Required Node modules missing.");
            showHotUpdateError();
            return;
        }

        var tempZipPath = pathModule.join(osModule.tmpdir(), "efp_update_" + Date.now() + ".zip");
        
        function nativeDownload(url, dest, callback) {
            var https = require("https");
            var fs = require("fs");
            var file = fs.createWriteStream(dest);
            var request = https.get(url, function(response) {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    file.close();
                    try { fs.unlinkSync(dest); } catch(e) {}
                    return nativeDownload(response.headers.location, dest, callback);
                }
                if (response.statusCode !== 200) {
                    file.close();
                    try { fs.unlinkSync(dest); } catch(e) {}
                    return callback(new Error("HTTP status " + response.statusCode));
                }
                response.pipe(file);
                file.on('finish', function() {
                    file.close(function() {
                        callback(null);
                    });
                });
            });
            request.on('error', function(err) {
                file.close();
                try { fs.unlinkSync(dest); } catch(e) {}
                callback(err);
            });
            request.setTimeout(60000, function() {
                request.abort();
                file.close();
                try { fs.unlinkSync(dest); } catch(e) {}
                callback(new Error("Download timeout"));
            });
        }

        function proceedToUnzip() {
            if (!fsModule.existsSync(tempZipPath) || fsModule.statSync(tempZipPath).size < 100) {
                console.error("[HotUpdate] Downloaded file is empty or missing.");
                showHotUpdateError();
                return;
            }

            // Step 2: Unzip
            msg.innerHTML = currentLang === "ar" ? "جاري تثبيت الملفات... 🛠️" : "Installing files... 🛠️";
            var unzipCmd;
            if (osModule && osModule.platform() === "win32") {
                unzipCmd = 'powershell -Command "Expand-Archive -LiteralPath \'' + tempZipPath + '\' -DestinationPath \'' + extensionPath + '\' -Force"';
            } else {
                unzipCmd = 'unzip -o "' + tempZipPath + '" -d "' + extensionPath + '"';
            }
            console.log("[HotUpdate] Extracting:", unzipCmd);

            execModule(unzipCmd, function(unzipErr, unzipStdout, unzipStderr) {
                // Clean up the temp zip
                try { fsModule.unlinkSync(tempZipPath); } catch(e) {}

                if (unzipErr) {
                    console.error("[HotUpdate] Extraction failed:", unzipErr.message, unzipStderr);
                    var errStr = ((unzipStderr || "") + " " + unzipErr.message).toLowerCase();
                    if (errStr.indexOf("permission") !== -1 || 
                        errStr.indexOf("access") !== -1 || 
                        errStr.indexOf("unauthorized") !== -1) {
                        
                        var isWin = (osModule && osModule.platform() === "win32");
                        msg.innerHTML = currentLang === "ar" ? 
                            "فشل التحديث بسبب الصلاحيات. يرجى التثبيت يدوياً." : 
                            "Failed due to permissions. Reinstall manually.";
                            
                        btnNow.disabled = false;
                        btnNow.style.opacity = "1";
                        btnNow.style.pointerEvents = "auto";
                        if (btnDismiss) btnDismiss.style.display = "block";
                        
                        if (isWin) {
                            btnNow.innerHTML = currentLang === "ar" ? "تنزيل الـ EXE" : "Download EXE";
                            btnNow.onclick = function() {
                                csInterface.openURLInDefaultBrowser("https://www.najmedia.com/editflow/EditFlow%20Pro%20Installer.exe");
                                banner.classList.remove("visible");
                            };
                        } else {
                            btnNow.innerHTML = currentLang === "ar" ? "تنزيل الـ PKG" : "Download PKG";
                            btnNow.onclick = function() {
                                csInterface.openURLInDefaultBrowser(downloadUrl);
                                banner.classList.remove("visible");
                            };
                        }
                    } else {
                        showHotUpdateError();
                    }
                    return;
                }

                // Step 3: Success! Reload page
                msg.innerHTML = currentLang === "ar" ? "اكتمل التحديث بنجاح! جاري التنشيط... 🎉" : "Update complete! Activating... 🎉";
                setTimeout(function() {
                    location.reload();
                }, 1500);
            });
        }

        // Try native download first, fallback to curl
        nativeDownload(hotUpdateUrl, tempZipPath, function(nativeErr) {
            if (nativeErr) {
                console.warn("[HotUpdate] Native download failed, falling back to curl...", nativeErr.message);
                var downloadCmd = 'curl -L -f -s -o "' + tempZipPath + '" "' + hotUpdateUrl + '"';
                execModule(downloadCmd, function(curlErr) {
                    if (curlErr) {
                        console.error("[HotUpdate] curl download failed too:", curlErr.message);
                        showHotUpdateError();
                        return;
                    }
                    proceedToUnzip();
                });
            } else {
                proceedToUnzip();
            }
        });

        function showHotUpdateError() {
            var isWin = (osModule && osModule.platform() === "win32");
            var fallbackUrl = downloadUrl;
            if (isWin && fallbackUrl.indexOf(".pkg") !== -1) {
                fallbackUrl = "https://www.najmedia.com/editflow/EditFlow%20Pro%20Installer.exe";
            }

            msg.innerHTML = currentLang === "ar" ? "فشل التحديث التلقائي! يرجى تحميله يدوياً." : "Auto-update failed! Please install manually.";
            btnNow.disabled = false;
            btnNow.style.opacity = "1";
            btnNow.style.pointerEvents = "auto";
            if (btnDismiss) btnDismiss.style.display = "block";
            
            if (isWin) {
                btnNow.innerHTML = currentLang === "ar" ? "تنزيل الـ EXE" : "Download EXE";
            } else {
                btnNow.innerHTML = currentLang === "ar" ? "تنزيل الـ PKG" : "Download PKG";
            }

            btnNow.onclick = function() {
                csInterface.openURLInDefaultBrowser(fallbackUrl);
                banner.classList.remove("visible");
            };
        }
    }



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
                csInterface.evalScript('(function() { var f = Folder.selectDialog("Select Export Folder"); return f ? f.fsName : ""; })()', function(result) {
                    if (result && result !== "null" && result !== "undefined" && result !== "EvalScript error." && result !== "") {
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
        showStatus("AI Engine binary not found in installation. Please reinstall EditFlow Pro.", "red");
    }

    // ── Built-in JS Transcriber (no Python needed) ──────────────────────────
    // Replicates transcriber.py logic using Node.js built-in modules.
    // Used as fallback on Windows when Python is unavailable.
    function jsTranscribe(mPath, outBase, lang, apiKey, cIn, cOut, progressCb, callback) {
        var https = require("https");
        var http  = require("http");

        var mp3Path = outBase + ".mp3";
        var isWin = (osModule && osModule.platform() === "win32");

        // ── Ensure ffmpeg is available ──
        function ensureFFmpeg(cb) {
            ensureFFmpegGlobal(progressCb, cb);
        }

        ensureFFmpeg(function(err, ffmpegBin) {
            if (err) {
                callback({ status: "error", message: "ffmpeg setup failed: " + err });
                return;
            }

            // Step 1: Extract audio to MP3
            progressCb("Extracting audio…", 10);
            var args = ["-y", "-hide_banner", "-loglevel", "error", "-i", mPath];
            if (cIn > 0) args.push("-ss", cIn.toFixed(3));
            if (cOut > cIn && cOut > 0) args.push("-to", cOut.toFixed(3));
            args.push("-ac", "1", "-ar", "16000", "-b:a", "64k", mp3Path);

            console.log("[jsTranscribe] running execFile:", ffmpegBin, args);
            execFileModule(ffmpegBin, args, { maxBuffer: 16 * 1024 * 1024, timeout: 120000 }, function(err) {
                if (err) {
                    callback({ status: "error", message: "Audio extraction failed: " + (err.message || "").slice(0, 800) });
                    return;
                }
            if (!fsModule.existsSync(mp3Path)) {
                callback({ status: "error", message: "Audio extraction produced no output." });
                return;
            }

            // Step 2: Send to Groq API
            progressCb("Sending to AI…", 30);
            var fileData = fsModule.readFileSync(mp3Path);
            var boundary = "efp" + Date.now() + Math.random().toString(36).substr(2);

            var fields = {
                model: "whisper-large-v3",
                response_format: "verbose_json",
                temperature: "0"
            };
            if (lang && lang !== "auto") fields.language = lang;

            var bodyParts = [];
            for (var key in fields) {
                bodyParts.push("--" + boundary + "\r\nContent-Disposition: form-data; name=\"" + key + "\"\r\n\r\n" + fields[key] + "\r\n");
            }
            // timestamp granularities
            bodyParts.push("--" + boundary + '\r\nContent-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\nword\r\n');
            bodyParts.push("--" + boundary + '\r\nContent-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\nsegment\r\n');

            // file field
            var fileHeader = "--" + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="audio.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n';
            var fileFooter = "\r\n--" + boundary + "--\r\n";

            var headerBuf = Buffer.from(fileHeader, "utf8");
            var footerBuf = Buffer.from(fileFooter, "utf8");
            var fieldsBuf = Buffer.from(bodyParts.join(""), "utf8");
            var fullBody = Buffer.concat([fieldsBuf, headerBuf, fileData, footerBuf]);

            // Cleanup mp3
            try { fsModule.unlinkSync(mp3Path); } catch(e) {}

            var reqOpts = {
                hostname: "api.groq.com",
                port: 443,
                path: "/openai/v1/audio/transcriptions",
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + apiKey,
                    "Content-Type": "multipart/form-data; boundary=" + boundary,
                    "Content-Length": fullBody.length,
                    "User-Agent": "EditFlowPro/1.0"
                }
            };

            console.log("[jsTranscribe] Calling Groq API, body size:", fullBody.length);
            progressCb("AI analyzing speech…", 50);

            var req = https.request(reqOpts, function(res) {
                var chunks = [];
                res.on("data", function(d) { chunks.push(d); });
                res.on("end", function() {
                    var body = Buffer.concat(chunks).toString("utf8");
                    console.log("[jsTranscribe] Groq status:", res.statusCode);

                    if (res.statusCode !== 200) {
                        callback({ status: "error", message: "Groq API " + res.statusCode + ": " + body.slice(0, 200) });
                        return;
                    }

                    try {
                        var groqResult = JSON.parse(body);
                    } catch(e) {
                        callback({ status: "error", message: "Invalid Groq response" });
                        return;
                    }

                    // Step 3: Build EFP JSON + SRT
                    progressCb("Building captions…", 70);
                    var resultLang = groqResult.language || "unknown";
                    var resultDur = groqResult.duration || 0;
                    var words = groqResult.words || [];
                    var segments = groqResult.segments || [];
                    var segs = [];

                    for (var si = 0; si < segments.length; si++) {
                        var g = segments[si];
                        var gs = g.start || 0, ge = g.end || 0;
                        var wList = [];
                        for (var wi = 0; wi < words.length; wi++) {
                            var w = words[wi];
                            if (w.start >= gs && w.start <= ge) {
                                var wText = (w.word || "").trim();
                                var wParts = wText.split(/\s+/);
                                if (wParts.length <= 1) {
                                    wList.push({ start: Math.round(w.start * 1000) / 1000, end: Math.round(w.end * 1000) / 1000, text: wText });
                                } else {
                                    var subDur = (w.end - w.start) / wParts.length;
                                    for (var pi = 0; pi < wParts.length; pi++) {
                                        wList.push({
                                            start: Math.round((w.start + pi * subDur) * 1000) / 1000,
                                            end:   Math.round((w.start + (pi + 1) * subDur) * 1000) / 1000,
                                            text:  wParts[pi]
                                        });
                                    }
                                }
                            }
                        }
                        // Clamp stretched words (max 3s)
                        for (var ci = 0; ci < wList.length; ci++) {
                            if (wList[ci].end - wList[ci].start > 3.0) {
                                wList[ci].end = Math.round((wList[ci].start + 3.0) * 1000) / 1000;
                            }
                        }
                        segs.push({ start: Math.round(gs * 1000) / 1000, end: Math.round(ge * 1000) / 1000, text: (g.text || "").trim(), words: wList });
                    }

                    // Write EFP JSON
                    var efpData = { language: resultLang, duration: Math.round(resultDur * 1000) / 1000, segments: segs };
                    var jsonPath = outBase + ".efp.json";
                    fsModule.writeFileSync(jsonPath, JSON.stringify(efpData, null, 2), "utf8");

                    // Write SRT
                    function ts(t) {
                        var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = Math.floor(t % 60), ms = Math.floor(t * 1000 % 1000);
                        return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s + "," + (ms < 100 ? (ms < 10 ? "00" : "0") : "") + ms;
                    }
                    var srtLines = [];
                    for (var i = 0; i < segs.length; i++) {
                        srtLines.push(String(i + 1), ts(segs[i].start) + " --> " + ts(segs[i].end), segs[i].text, "");
                    }
                    var srtPath = outBase + ".srt";
                    fsModule.writeFileSync(srtPath, srtLines.join("\n"), "utf8");

                    var totalWords = 0;
                    for (var j = 0; j < segs.length; j++) totalWords += (segs[j].words || []).length;

                    callback({
                        status: "success",
                        segments: segs.length,
                        words: totalWords,
                        language: resultLang,
                        duration: resultDur,
                        json: jsonPath,
                        srt: srtPath
                    });
                });
            });
            req.on("error", function(e) {
                callback({ status: "error", message: "Network error: " + e.message });
            });
            req.setTimeout(180000, function() {
                req.destroy();
                callback({ status: "error", message: "Groq API timeout (3 min)" });
            });
            req.write(fullBody);
            req.end();
        });
        }); // end ensureFFmpeg
    }

    safeBind("btn-generate-captions", function() {
        if (!fsModule || !execModule || !osModule) {
            showStatus("Node modules unavailable.", "red"); return;
        }
        if (operationRunning) return;

        var lang  = document.getElementById("cap-language").value;
        var model = document.getElementById("cap-model").value;
        var style = document.getElementById("cap-style").value;
        var wordsMin = parseInt((document.getElementById("cap-words-per") || {value: "3"}).value, 10) || 3;
        var wordsMax = parseInt((document.getElementById("cap-words-max") || {value: "5"}).value, 10) || 5;
        if (wordsMin < 1) wordsMin = 1;
        if (wordsMax < wordsMin) wordsMax = wordsMin; // guard: max never below min
        if (wordsMax > 15) wordsMax = 15;
        // Persist the chosen range so it survives panel reloads.
        settings.captions.wordsMin = wordsMin;
        settings.captions.wordsMax = wordsMax;
        settings.captions.wordsPerCaption = wordsMin; // back-compat mirror
        saveSettings();
        var wordsPerCaption = wordsMin; // legacy var still used by jsTranscribe fallback path

        var statusLine = document.getElementById("cap-status");
        function setStatus(t) { if (statusLine) statusLine.textContent = t; }

        // Optional AI refinement between transcription and placement. Failures here
        // are non-fatal by design: the user still gets the raw Whisper captions.
        function withRefinement(summary, setStatus, next) {
            var opts = (typeof window.efpRefineOptions === "function") ? window.efpRefineOptions() : null;
            if (!opts || typeof window.efpRefineCaptions !== "function") return next(summary);

            showProgress(t_refine("cap_refine_working"), 78, false);
            setStatus(t_refine("cap_refine_working"));
            window.efpRefineCaptions(summary, opts,
                function(doneN, totalN) {
                    var pct = 78 + Math.round((doneN / Math.max(totalN, 1)) * 4);
                    showProgress(t_refine("cap_refine_working") + "  " + doneN + "/" + totalN, pct, false);
                },
                function(err, result, stats) {
                    if (err === "missing_key") {
                        showStatus(t_refine("cap_refine_err_key"), "orange");
                    } else if (err) {
                        console.error("[refine] " + err);
                        showStatus(t_refine("cap_refine_failed") + " " + err, "orange");
                    } else if (stats) {
                        setStatus(t_refine("cap_refine_done").replace("{n}", stats.changed));
                    }
                    next(result || summary);
                }
            );
        }
        function shq(s) {
            var isWin = (osModule && osModule.platform() === "win32");
            if (isWin) {
                return '"' + String(s) + '"';
            } else {
                return '"' + String(s).replace(/(["\\$`])/g, "\\$1") + '"';
            }
        }
        var opts = { maxBuffer: 16 * 1024 * 1024, timeout: 30 * 60 * 1000 };

        showProgress("Finding audio...", 3, true);
        setStatus("Reading selection…");

        csInterface.evalScript('$._editflow.getAudioMedia()', function(raw) {
            var info = safeParse(raw);
            if (!info) {
                hideProgress(); setStatus(""); showStatus("Select an audio/video clip first.", "red"); return;
            }

            var cmdPrefix = "";
            var hasTranscriber = false;
            var useJsTranscriber = false;
            
            function findPythonOnWindows() {
                if (!fsModule || !osModule) return "python";
                var userHome = osModule.homedir();
                var programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
                var localAppData = process.env["LocalAppData"] || (userHome + "\\AppData\\Local");
                var paths = [];
                var versions = ["Python313", "Python312", "Python311", "Python310", "Python39", "Python38"];
                for (var i = 0; i < versions.length; i++) {
                    paths.push(localAppData + "\\Programs\\Python\\" + versions[i] + "\\python.exe");
                }
                for (var i = 0; i < versions.length; i++) {
                    paths.push(programFiles + "\\Python\\" + versions[i] + "\\python.exe");
                }
                for (var i = 0; i < paths.length; i++) {
                    if (fsModule.existsSync(paths[i])) {
                        return shq(paths[i]);
                    }
                }
                return null;
            }

            if (osModule && osModule.platform() === "win32") {
                var winExe = extensionPath + "/bin/dist/whisper_runner.exe";
                if (fsModule.existsSync(winExe)) {
                    hasTranscriber = true;
                    cmdPrefix = shq(winExe);
                } else {
                    var pythonPath = findPythonOnWindows();
                    if (pythonPath && fsModule.existsSync(extensionPath + "/bin/transcriber.py")) {
                        hasTranscriber = true;
                        cmdPrefix = pythonPath + " " + shq(extensionPath + "/bin/transcriber.py");
                    } else {
                        // No Python, no EXE — use built-in JS transcriber
                        hasTranscriber = true;
                        useJsTranscriber = true;
                        console.log("[Captions] Using built-in JS transcriber (no Python needed)");
                    }
                }
            } else {
                var macBin = extensionPath + "/bin/dist/whisper_runner";
                if (fsModule.existsSync(macBin)) {
                    hasTranscriber = true;
                    cmdPrefix = shq(macBin);
                }
            }
            if (!hasTranscriber) {
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
                // ── Built-in JS transcriber (Windows, no Python) ──
                if (useJsTranscriber) {
                    var trimNote = (cDur > 0.1) ? (" · " + cDur.toFixed(1) + "s") : "";
                    showProgress("Analyzing speech…", 15, true);
                    setStatus("AI speech recognition" + trimNote + " · cloud engine");
                    console.log("[Captions] Using built-in JS transcriber");

                    jsTranscribe(mPath, outBase, lang, apiKey, cIn, cOut,
                        function(msg, pct) { showProgress(msg, pct, true); },
                        function(summary) {
                            if (summary.status !== "success") {
                                hideProgress(); setStatus("");
                                showStatus("Caption error: " + (summary.message || "unknown").slice(0, 120), "red");
                                return;
                            }
                            setStatus("Detected " + summary.language + " · " + summary.words + " words · " + summary.segments + " segments");
                            console.log("[Captions] placing synced editable captions");
                            showProgress("Syncing captions to timeline…", 75);
                            setStatus("Building timeline-synced captions…");
                            withRefinement(summary, setStatus, function(_s) {
                                fallbackSRT(_s, style, "none", "Arial", 72, "#FFFFFF", "#FFFFFF", tlStart, setStatus, wordsPerCaption, wordsMin, wordsMax);
                            });
                        }
                    );
                    return;
                }

                var cmd = cmdPrefix + " " + shq(mPath) + " " + shq(outBase) +
                          " --lang " + shq(lang) + " --model " + shq(model) +
                          " --api-key " + shq(apiKey);
                if (cDur > 0.1 && cOut > cIn) {
                    cmd += " --start " + cIn.toFixed(3) + " --end " + cOut.toFixed(3);
                }
                var modelSize = ({tiny:75, base:140, small:460, medium:1500, large:3000})[model] || 460;
                var trimNote = (cDur > 0.1) ? (" · " + cDur.toFixed(1) + "s") : "";
                showProgress("Analyzing speech (" + model + ")…", 15, true);
                setStatus("AI speech recognition" + trimNote + " · model = " + modelSize + " MB on first run");
                console.log("[Captions] running:", cmd);

                activeCaptionProcess = execModule(cmd, opts, function(err, stdout, stderr) {
                activeCaptionProcess = null;
                if (err) {
                    if (err.killed || err.signal === 'SIGTERM') {
                        hideProgress(); setStatus("Captioning cancelled.");
                        showStatus("Captioning cancelled by user.", "orange");
                        return;
                    }
                    hideProgress(); setStatus("");
                    console.log("[Captions] err:", err.message, "\nstdout:", stdout, "\nstderr:", stderr);
                    // whisper_runner writes JSON to stdout even on failure — parse it first
                    var errData = safeParse(stdout);
                    if (errData && errData.message) {
                        showStatus("Caption error: " + errData.message.slice(0, 120), "red");
                    } else {
                        showStatus("Transcription failed: " + (stderr || err.message || "unknown").slice(0, 800), "red");
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
                withRefinement(summary, setStatus, function(_s) {
                    fallbackSRT(_s, style, "none", "Arial", 72, "#FFFFFF", "#FFFFFF", tlStart, setStatus, wordsPerCaption, wordsMin, wordsMax);
                });
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
                showProgress("Extracting audio from " + clips.length + " clips…", 8, true);
                setStatus("Combining " + clips.length + " clips for transcription…");

                ensureFFmpegGlobal(function(msg, pct) { showProgress(msg, pct, true); }, function(err, ffmpegBin) {
                    if (err) {
                        hideProgress(); setStatus("");
                        showStatus("ffmpeg setup failed: " + err, "red");
                        return;
                    }

                    var concatList = osModule.tmpdir() + "/efp_concat_" + Date.now() + ".txt";
                    var partFiles = [];
                    var pending = clips.length;
                    var extractError = null;

                    clips.forEach(function(clip, idx) {
                        var partFile = osModule.tmpdir() + "/efp_part_" + Date.now() + "_" + idx + ".wav";
                        partFiles.push(partFile);
                        var extractArgs = ["-y", "-hide_banner", "-loglevel", "error", "-i", clip.mediaPath];
                        if (clip.clipOut > clip.clipIn && clip.duration > 0.1) {
                            extractArgs.push("-ss", (clip.clipIn || 0).toFixed(3), "-to", (clip.clipOut || 0).toFixed(3));
                        }
                        extractArgs.push("-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", partFile);

                        activeCaptionProcess = execFileModule(ffmpegBin, extractArgs, opts, function(err2) {
                            activeCaptionProcess = null;
                            if (err2) {
                                if (err2.killed || err2.signal === 'SIGTERM') {
                                    hideProgress(); setStatus("Captioning cancelled.");
                                    showStatus("Captioning cancelled by user.", "orange");
                                    return;
                                }
                                extractError = err2;
                            }
                            pending--;
                            if (pending === 0) {
                                if (extractError) {
                                    hideProgress(); setStatus("");
                                    showStatus("Audio extraction failed: " + (extractError.message || "").slice(0, 800), "red");
                                    return;
                                }
                                // Build concat list file
                                var listContent = partFiles.map(function(f) {
                                    return "file '" + f.replace(/'/g, "'\\''") + "'";
                                }).join("\n");
                                fsModule.writeFileSync(concatList, listContent, "utf8");

                                // Concatenate all parts
                                var combinedFile = osModule.tmpdir() + "/efp_combined_" + Date.now() + ".wav";
                                var concatArgs = ["-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", combinedFile];

                                activeCaptionProcess = execFileModule(ffmpegBin, concatArgs, opts, function(err3) {
                                    activeCaptionProcess = null;
                                    // Cleanup part files
                                    partFiles.forEach(function(f) { try { fsModule.unlinkSync(f); } catch(e){} });
                                    try { fsModule.unlinkSync(concatList); } catch(e){}

                                    if (err3) {
                                        if (err3.killed || err3.signal === 'SIGTERM') {
                                            hideProgress(); setStatus("Captioning cancelled.");
                                            showStatus("Captioning cancelled by user.", "orange");
                                            return;
                                        }
                                        hideProgress(); setStatus("");
                                        showStatus("Audio concat failed: " + (err3.message || "").slice(0, 800), "red");
                                        return;
                                    }

                                    // Run transcriber on combined audio (no --start/--end since we already trimmed)
                                    runTranscriber(combinedFile, firstTlStart, 0, 0, 0);
                                });
                            }
                        });
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
    function fallbackSRT(summary, style, anim, font, size, color, hl, timelineStart, setStatus, wordsPerCaption, wordsMin, wordsMax) {
        wordsPerCaption = parseInt(wordsPerCaption, 10) || 3;
        wordsMin = parseInt(wordsMin, 10) || wordsPerCaption;
        wordsMax = parseInt(wordsMax, 10) || Math.max(wordsMin, wordsPerCaption);
        if (wordsMax < wordsMin) wordsMax = wordsMin;
        showProgress("Placing captions on timeline…", 80);
        setStatus("Building synced captions (" + style + " mode)…");
        var cfg = {
            style: style, animation: anim, font: font,
            size: size, color: color, highlight: hl,
            offsetSecs: timelineStart,
            wordsPerCaption: wordsPerCaption,
            wordsMin: wordsMin,
            wordsMax: wordsMax
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
                    setStatus("✅ " + r.groups + " captions synced on timeline");
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
        
        // Windows: validate save path if specified — must be absolute (e.g. C:\Users\... or D:\...)
        var isWinExport = (osModule && osModule.platform() === "win32");
        if (isWinExport && savePath !== "") {
            var isAbsWin = /^[A-Za-z]:[\\\/]/.test(savePath);
            if (!isAbsWin) {
                showStatus("Invalid path. Use full path e.g. C:\\Users\\Ahmed\\Desktop", "red");
                return;
            }
        }

        function runExport(selectedPath) {
            // Cleanup old temp presets (older than 10 mins) to keep temp folder clean
            try {
                var tempDir = getSafeTempDir();
                var files = fsModule.readdirSync(tempDir);
                var now = Date.now();
                files.forEach(function(file) {
                    if (file.indexOf("efp_") === 0 && file.indexOf(".epr") !== -1) {
                        var filePath = pathModule.join(tempDir, file);
                        var stat = fsModule.statSync(filePath);
                        if (now - stat.mtimeMs > 600000) { // 10 minutes
                            try { fsModule.unlinkSync(filePath); } catch(err) {}
                        }
                    }
                });
            } catch(err) {}
            
            console.log("[Export] File: " + (fileName || "(auto)") + " | Path: " + selectedPath);
            showProgress("Preparing...", 10);
            modifyPresetBitrate(function(tmp, br) {
                showProgress("Exporting (" + br + " Mbps)...", 40);
                var fnEsc = fileName.replace(/\\/g,"\\\\").replace(/"/g,'\\"');
                var fpEsc = selectedPath.replace(/\\/g,"\\\\").replace(/"/g,'\\"');
                console.log("[Export] Bitrate: " + br + " Mbps");
                csInterface.evalScript('$._editflow.exportCustom("' + tmp.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '", "' + fnEsc + '", "' + fpEsc + '")', function(res) {
                    console.log("[<-JSX] exportCustom:", res);
                    // Delete the temp preset after a delay (e.g. 5 minutes) to give AME/Premiere ample time to read it
                    setTimeout(function() {
                        try { fsModule.unlinkSync(tmp); } catch(e) {}
                    }, 300000);
                    
                    var r = safeParse(res);
                    if (r && r.status === "success") {
                        if (r.queued) {
                            showProgress("Done!", 100); 
                            setTimeout(hideProgress, 2000);
                            showStatus("✅ Export queued in Adobe Media Encoder", "green");
                        } else {
                            showStatus("⏳ Exporting in background...", "blue");
                            pollExportFile(r.filePath, Date.now(), 600000); // 10 mins
                        }
                    } else {
                        showProgress("Export failed", 0);
                        setTimeout(hideProgress, 1000);
                        var errMsg = (r && r.message) ? r.message : "Export failed.";
                        showStatus(errMsg, "red");
                    }
                });
            });
        }

        if (savePath === "") {
            csInterface.evalScript('(function() { var f = Folder.selectDialog("Select Export Folder"); return f ? f.fsName : ""; })()', function(result) {
                if (result && result !== "null" && result !== "undefined" && result !== "EvalScript error." && result !== "") {
                    document.getElementById("export-path").value = result;
                    console.log("[Export] Save path set on empty: " + result);
                    settings.exportPath = result;
                    saveSettings();
                    runExport(result);
                } else {
                    showStatus("Export cancelled. Select a folder first.", "orange");
                }
            });
        } else {
            runExport(savePath);
        }
    });

    function pollExportFile(filePath, startTime, maxDurationMs) {
        if (!filePath || typeof filePath !== "string") {
            showProgress("Export failed", 0);
            setTimeout(hideProgress, 1000);
            showStatus("Export failed: invalid output path.", "red");
            return;
        }
        showProgress("Exporting (Direct)...", 45);
        var intervalMs = 2000;
        var checkFile = setInterval(function() {
            var elapsed = Date.now() - startTime;
            if (elapsed > maxDurationMs) {
                clearInterval(checkFile);
                showProgress("Export timed out", 0);
                setTimeout(hideProgress, 2000);
                showStatus("Export timed out. Please check if the file was created.", "red");
                return;
            }
            if (fsModule && fsModule.existsSync(filePath)) {
                try {
                    var stats = fsModule.statSync(filePath);
                    if (stats.size > 0) {
                        clearInterval(checkFile);
                        setTimeout(function() {
                            showProgress("Done!", 100);
                            setTimeout(hideProgress, 2000);
                            var fn = pathModule.basename(filePath);
                            showStatus("✅ Exported: " + fn, "green");
                        }, 2000);
                    }
                } catch(e) {}
            } else {
                var elapsedSecs = Math.floor(elapsed / 1000);
                var mins = Math.floor(elapsedSecs / 60);
                var secs = elapsedSecs % 60;
                var timeStr = mins > 0 ? mins + "m " + secs + "s" : secs + "s";
                showProgress("Exporting (Direct)... " + timeStr, 45);
            }
        }, intervalMs);
    }



    // Helper: Find built-in PNG Preset for native capture
    function getFFmpegPath() {
        if (!fsModule || !osModule) return "ffmpeg";
        var isWin = (osModule.platform() === "win32");
        var ext = isWin ? ".exe" : "";
        var bundled = extensionPath + "/bin/ffmpeg" + ext;
        if (fsModule.existsSync(bundled)) return bundled;
        var toolsDir;
        if (isWin) {
            toolsDir = osModule.homedir() + "\\AppData\\Roaming\\EditFlowPro\\tools";
        } else {
            toolsDir = osModule.homedir() + "/Library/Application Support/EditFlowPro/tools";
        }
        var toolsPath = toolsDir + (isWin ? "\\" : "/") + "ffmpeg" + ext;
        if (fsModule.existsSync(toolsPath)) return toolsPath;
        // CEP panels launched from Dock/Spotlight have a minimal PATH
        // (/usr/bin:/bin:/usr/sbin:/sbin) that excludes Homebrew/MacPorts, so a
        // bare "ffmpeg" spawn throws ENOENT even when ffmpeg is installed.
        // Probe the common install locations directly before giving up.
        if (!isWin) {
            var macCandidates = [
                "/opt/homebrew/bin/ffmpeg", // Apple Silicon Homebrew
                "/usr/local/bin/ffmpeg",    // Intel Homebrew
                "/opt/local/bin/ffmpeg",    // MacPorts
                "/usr/bin/ffmpeg"           // system
            ];
            for (var i = 0; i < macCandidates.length; i++) {
                if (fsModule.existsSync(macCandidates[i])) return macCandidates[i];
            }
        }
        return "ffmpeg";
    }
    // Exposed so the Web Downloader module (a separate top-level IIFE) can
    // resolve ffmpeg without duplicating the probe list, and can reuse the
    // one-time Windows auto-download instead of dead-ending the user.
    window.efpGetFFmpegPath = getFFmpegPath;
    window.efpEnsureFFmpeg = function(progressCb, cb) { ensureFFmpegGlobal(progressCb, cb); };

    function ensureFFmpegGlobal(progressCb, cb) {
        if (!fsModule || !osModule) return cb("Node modules not available");
        var isWin = (osModule.platform() === "win32");
        var ffmpegBin = getFFmpegPath();
        if (ffmpegBin !== "ffmpeg" && fsModule.existsSync(ffmpegBin)) {
            return cb(null, ffmpegBin);
        }
        if (!isWin) return cb(null, "ffmpeg");
        
        progressCb("Downloading ffmpeg (one-time)…", 5);
        console.log("[ensureFFmpegGlobal] ffmpeg not found, downloading...");
        
        var toolsDir = (process.env["APPDATA"] || (osModule.homedir() + "\\AppData\\Roaming")) + "\\EditFlowPro\\tools";
        var outPath = toolsDir + "\\ffmpeg.exe";
        
        try { fsModule.mkdirSync(toolsDir, { recursive: true }); } catch(e) {}
        
        if (fsModule.existsSync(outPath)) {
            console.log("[ensureFFmpegGlobal] ffmpeg already exists at:", outPath);
            return cb(null, outPath);
        }
        
        var downloadUrl = "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64";
        var dlCmd = 'curl.exe -L -o "' + outPath + '" "' + downloadUrl + '"';
        console.log("[ensureFFmpegGlobal] Download cmd:", dlCmd);
        
        execModule(dlCmd, { timeout: 180000, maxBuffer: 16 * 1024 * 1024 }, function(dlErr) {
            if (dlErr || !fsModule.existsSync(outPath)) {
                console.log("[ensureFFmpegGlobal] curl failed, trying PowerShell...", dlErr ? dlErr.message : "no file");
                var psCmd = 'powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri \'' + downloadUrl + '\' -OutFile \'' + outPath + '\' }"';
                execModule(psCmd, { timeout: 180000, maxBuffer: 16 * 1024 * 1024 }, function(psErr) {
                    if (psErr || !fsModule.existsSync(outPath)) {
                        return cb("ffmpeg download failed. Install ffmpeg manually.");
                    }
                    console.log("[ensureFFmpegGlobal] ffmpeg downloaded via PowerShell to:", outPath);
                    cb(null, outPath);
                });
                return;
            }
            console.log("[ensureFFmpegGlobal] ffmpeg downloaded via curl to:", outPath);
            cb(null, outPath);
        });
    }

    var foundPngPreset = null;
    function findPngPreset() {
        if (!fsModule || foundPngPreset) return foundPngPreset;
        var paths = [];
        var isWin = (osModule && osModule.platform() === "win32");
        if (isWin) {
            var programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
            var years = ["2027", "2026", "2025", "2024", "2023"];
            for (var i = 0; i < years.length; i++) {
                paths.push(programFiles + "\\Adobe\\Adobe Premiere Pro " + years[i] + "\\MediaIO\\systempresets\\3F3F3F3F_504E4720\\PNG Sequence (Match Source).epr");
            }
            paths.push(programFiles + "\\Adobe\\Adobe Premiere Pro (Beta)\\MediaIO\\systempresets\\3F3F3F3F_504E4720\\PNG Sequence (Match Source).epr");
        } else {
            paths = [
                "/Applications/Adobe Premiere Pro 2026/Adobe Premiere Pro 2026.app/Contents/MediaIO/systempresets/3F3F3F3F_504E4720/PNG Sequence (Match Source).epr",
                "/Applications/Adobe Premiere Pro 2025/Adobe Premiere Pro 2025.app/Contents/MediaIO/systempresets/3F3F3F3F_504E4720/PNG Sequence (Match Source).epr",
                "/Applications/Adobe Premiere Pro 2024/Adobe Premiere Pro 2024.app/Contents/MediaIO/systempresets/3F3F3F3F_504E4720/PNG Sequence (Match Source).epr",
                "/Applications/Adobe Premiere Pro (Beta)/Adobe Premiere Pro (Beta).app/Contents/MediaIO/systempresets/3F3F3F3F_504E4720/PNG Sequence (Match Source).epr"
            ];
        }
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
        
        showProgress("Reading playhead...", 20);
        console.log('[CAPTURE] Reading playhead frame info...');
        
        csInterface.evalScript('$._editflow.getPlayheadFrameInfo()', function(result) {
            console.log('[CAPTURE] Info:', result);
            try {
                var r = JSON.parse(result);
                if (r.status !== "success") {
                    showProgress("", 0); hideProgress();
                    handleJSXResult(result);
                    return;
                }
                
                // OPTION A: Premiere 24.0+ Native instant exportFramePNG
                if (r.method === "native" && r.path) {
                    copyFrameToClipboard(r.path, 'PNG');
                    return;
                }
                
                // OPTION B: Fallback to exportAsMediaDirect (Media Encoder) if PNG preset is found
                var pngPreset = findPngPreset();
                if (pngPreset) {
                    console.log('[CAPTURE] Falling back to Native MediaDirect...');
                    showProgress("Rendering frame...", 40);
                    
                    var safeTempDir = getSafeTempDir().replace(/\\/g, "/");
                    var safePreset = pngPreset.replace(/\\/g, "/");
                    
                    csInterface.evalScript('$._editflow.exportNativeFrame("' + safePreset + '", "' + safeTempDir + '")', function(res) {
                        try {
                            var nr = JSON.parse(res);
                            if (nr.status !== "success" || nr.method !== "media_direct") {
                                showProgress("", 0); hideProgress();
                                handleJSXResult(res);
                                return;
                            }
                            
                            showProgress("Saving to clipboard...", 70);
                            var baseName = nr.baseName;
                            var tempDir = nr.tempDir;
                            var checks = 0;
                            var expectedFile = null;
                            
                            var interval = setInterval(function() {
                                checks++;
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
                                    csInterface.evalScript('$._editflow.restoreInOut("' + nr.oldIn + '", "' + nr.oldOut + '")');
                                    copyFrameToClipboard(expectedFile, 'PNG');
                                } else if (checks > 40) { // 10 seconds timeout
                                    clearInterval(interval);
                                    csInterface.evalScript('$._editflow.restoreInOut("' + nr.oldIn + '", "' + nr.oldOut + '")');
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

                // OPTION C: Fallback to FFmpeg extraction
                if (!r.mediaPath) {
                    showProgress("", 0); hideProgress();
                    showStatus("No media path found.", "red");
                    return;
                }

                var pngPath = pathModule.join(getSafeTempDir(), 'editflow_frame_' + Date.now() + '.png');
                showProgress("Extracting frame...", 60);

                ensureFFmpegGlobal(function(msg, pct) { showProgress(msg, pct, true); }, function(err, ffmpegBin) {
                    if (err) {
                        showProgress("", 0); hideProgress();
                        showStatus("ffmpeg setup failed: " + err, "red");
                        return;
                    }
                    if (osModule && osModule.platform() === "win32") {
                        var args = ["-y", "-i", r.mediaPath, "-ss", r.sourceTime.toFixed(6), "-map", "0:v:0", "-vframes", "1", "-q:v", "2", pngPath];
                        execFileModule(ffmpegBin, args, function(ffErr, ffOut, ffStderr) {
                            if (!fsModule.existsSync(pngPath)) {
                                showProgress("", 0); hideProgress();
                                var detail = ffStderr ? ffStderr.substring(ffStderr.lastIndexOf('\n', ffStderr.length - 2) + 1).trim() : "unknown";
                                showStatus("Capture failed: " + detail.substring(0, 120), "red");
                                return;
                            }
                            copyFrameToClipboard(pngPath, 'PNG');
                        });
                    } else {
                        var safeMedia = r.mediaPath.replace(/'/g, "'\\''");
                        var safePng = pngPath.replace(/'/g, "'\\''");
                        var binPath = extensionPath + "/bin";
                        cmd = "export PATH=\"" + binPath + ":/opt/homebrew/bin:/usr/local/bin:$PATH\" && " +
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
                    }
                });
            } catch(e) {
                showProgress("", 0); hideProgress();
                handleJSXResult(result);
            }
        });

        function copyFrameToClipboard(imgPath, type) {
            showProgress("Copying to clipboard...", 90);
            var isWin = (osModule && osModule.platform() === "win32");
            if (isWin) {
                var safeTemp = getSafeTempDir();
                var safeImgPath = pathModule.join(safeTemp, "efp_clip_temp.png");
                try {
                    fsModule.copyFileSync(imgPath, safeImgPath);
                } catch(copyErr) {
                    console.error("[copyFrameToClipboard] Copy to safe path failed:", copyErr);
                    safeImgPath = imgPath;
                }
                
                var winPath = safeImgPath.replace(/\//g, "\\");
                var tempPs1 = pathModule.join(safeTemp, "efp_copy.ps1");
                var scriptContent = [
                    'Add-Type -AssemblyName System.Windows.Forms',
                    'Add-Type -AssemblyName System.Drawing',
                    '$inputPath = "' + winPath.replace(/"/g, '`"') + '"',
                    'if (Test-Path $inputPath) {',
                    '    $img = [System.Drawing.Image]::FromFile($inputPath)',
                    '    [System.Windows.Forms.Clipboard]::SetImage($img)',
                    '    $img.Dispose()',
                    '    exit 0',
                    '}',
                    'exit 1'
                ].join("\r\n");
                
                try {
                    fsModule.writeFileSync(tempPs1, scriptContent, 'utf8');
                    var psCmd = 'powershell -NoProfile -STA -ExecutionPolicy Bypass -File "' + tempPs1 + '"';
                    console.log("[copyFrameToClipboard] Running:", psCmd);
                    execModule(psCmd, function(clipErr) {
                        try { fsModule.unlinkSync(tempPs1); } catch(e) {}
                        try { fsModule.unlinkSync(safeImgPath); } catch(e) {}
                        showProgress("Done!", 100); setTimeout(hideProgress, 2000);
                        if (clipErr) {
                            console.error("[copyFrameToClipboard] Error:", clipErr.message);
                            showStatus("Frame saved to: " + imgPath, "green");
                        } else {
                            showStatus("Frame copied! Ctrl+V to paste.", "green");
                        }
                    });
                } catch(err) {
                    console.error("[copyFrameToClipboard] Script write failed:", err);
                    showProgress("Done!", 100); setTimeout(hideProgress, 2000);
                    showStatus("Frame saved to: " + imgPath, "green");
                }
            } else {
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
        }
    });

    safeBind("btn-paste-clipboard", function() { pasteFromClipboard(); });
    safeBind("btn-paste-cancel", function() { cancelPaste(); });

    // SETTINGS
    var helpBtn = document.getElementById("btn-help-toggle");
    var helpDrop = document.getElementById("help-dropdown");
    if (helpBtn && helpDrop) {
        helpBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            helpDrop.classList.toggle("show");
        });
        document.addEventListener("click", function(e) {
            if (helpDrop.classList.contains("show") && !helpDrop.contains(e.target) && e.target !== helpBtn) {
                helpDrop.classList.remove("show");
            }
        });
        
        var tutBtn = document.getElementById("btn-help-tutorials");
        if(tutBtn) tutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            helpDrop.classList.remove("show");
            if(window.csInterface) window.csInterface.openURLInDefaultBrowser("https://www.najmedia.com/editflow/");
        });
        
        var contactBtn = document.getElementById("btn-help-contact");
        if(contactBtn) contactBtn.addEventListener("click", function(e) {
            e.preventDefault();
            helpDrop.classList.remove("show");
            document.getElementById("settings-overlay").classList.remove("hidden");
            var aboutTab = document.querySelector(".settings-tab[data-tab='about']");
            if(aboutTab) setTimeout(function(){ aboutTab.click(); }, 100);
        });
    }

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
            // Same file:// trap as the downloader had - go through the JSX dialog.
            csInterface.evalScript(
                '(function() { var f = Folder.selectDialog("Choose default export folder"); return f ? f.fsName : ""; })()',
                function(result) {
                    if (result && result !== "null" && result !== "undefined" &&
                        result !== "EvalScript error." && result !== "") {
                        document.getElementById("cfg-export-path").value = result;
                    }
                }
            );
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
        "btn-paste-clipboard", "btn-paste-cancel",
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
function t_refine(key) {
    try {
        var tbl = i18n[currentLang] || i18n.en;
        return tbl[key] || i18n.en[key] || key;
    } catch (e) { return key; }
}

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
var _progressMessage = "";

function showProgress(msg, pct, showCancel) {
    var container = document.getElementById("progress-container");
    var textEl = document.getElementById("progress-text");
    var fillEl = document.getElementById("progress-fill");
    var cancelBtn = document.getElementById("btn-progress-cancel");
    container.classList.remove("hidden");
    fillEl.classList.remove("done");
    _progressMessage = msg;
    textEl.innerText = msg;
    _progressTargetPct = pct || 0;
    fillEl.style.width = _progressTargetPct + "%";
    _progressCurrentPct = _progressTargetPct;
    operationRunning = true;

    if (cancelBtn) {
        if (showCancel) {
            cancelBtn.classList.remove("hidden");
        } else {
            cancelBtn.classList.add("hidden");
        }
    }

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

            textEl.innerText = _progressMessage + "  ⏱ " + timeStr;
        }, 1000);
    } else {
        if (_progressTimer) {
            clearInterval(_progressTimer);
            _progressTimer = null;
        }
    }
}

function hideProgress() {
    if (_progressTimer) { clearInterval(_progressTimer); _progressTimer = null; }
    var container = document.getElementById("progress-container");
    var fillEl = document.getElementById("progress-fill");
    var cancelBtn = document.getElementById("btn-progress-cancel");
    fillEl.style.width = "100%";
    fillEl.classList.add("done");
    if (cancelBtn) cancelBtn.classList.add("hidden");
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
// CEP's cep.fs.showOpenDialog returns "file:///Users/..." (percent-encoded),
// which every fs call rejects. Older builds saved that straight into the config,
// silently breaking both the download folder and the export folder. Normalising
// on load heals any value already stored on disk.
function efpNormalizePath(p) {
    var v = (p || "").toString().trim();
    if (/^file:\/\//i.test(v)) {
        v = v.replace(/^file:\/\/(localhost)?/i, "");
        try { v = decodeURIComponent(v); } catch(e) {}
    }
    return v.replace(/[\/\\]+$/, "");
}

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
            if (typeof d.exportPath === "string") settings.exportPath = efpNormalizePath(d.exportPath);
            if (typeof d.groqApiKey === "string") settings.groqApiKey = d.groqApiKey;
            if (Array.isArray(d.favoriteSfx)) settings.favoriteSfx = d.favoriteSfx;
            if (typeof d.downloadPath === "string") settings.downloadPath = efpNormalizePath(d.downloadPath);
            if (typeof d.downloadQuality === "string") settings.downloadQuality = d.downloadQuality;
            if (typeof d.downloadPlacement === "string") settings.downloadPlacement = d.downloadPlacement;
            if (typeof d.refineProvider === "string") settings.refineProvider = d.refineProvider;
            if (typeof d.refineModel === "string") settings.refineModel = d.refineModel;
            if (typeof d.refineEnabled === "boolean") settings.refineEnabled = d.refineEnabled;
            if (typeof d.refineMode === "string") settings.refineMode = d.refineMode;
            if (typeof d.refineLang === "string") settings.refineLang = d.refineLang;
            if (typeof d.anthropicApiKey === "string") settings.anthropicApiKey = d.anthropicApiKey;
            if (typeof d.openaiApiKey === "string") settings.openaiApiKey = d.openaiApiKey;
            if (typeof d.ytdlpLastUpdate === "number") settings.ytdlpLastUpdate = d.ytdlpLastUpdate;
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
        if (fsModule && pathModule) {
            var dir = pathModule.dirname(configPath);
            if (!fsModule.existsSync(dir)) {
                fsModule.mkdirSync(dir, { recursive: true });
            }
        }
        if (!fsModule) return;
        // CRITICAL: editflow_config.json is SHARED with license.js, which stores
        // the activation under config.license. We must MERGE our settings into
        // the existing file — never overwrite it wholesale — or we wipe the
        // license (and any other keys license.js owns) on every settings save,
        // forcing the user back to the activation screen.
        var out = {};
        try {
            if (fsModule.existsSync(configPath)) {
                out = JSON.parse(fsModule.readFileSync(configPath, "utf8")) || {};
            }
        } catch(e) { out = {}; }
        for (var k in settings) {
            if (settings.hasOwnProperty(k)) out[k] = settings[k];
        }
        fsModule.writeFileSync(configPath, JSON.stringify(out, null, 2), "utf8");
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
    var wpcEl = document.getElementById("cap-words-per");
    if (wpcEl) wpcEl.value = settings.captions.wordsMin || settings.captions.wordsPerCaption || 3;
    var wpcMaxEl = document.getElementById("cap-words-max");
    if (wpcMaxEl) wpcMaxEl.value = settings.captions.wordsMax || 5;
    updateCapWordsPerVisibility();
}
function setSel(id, val) {
    var el = document.getElementById(id);
    if (el && val !== undefined && val !== null) el.value = String(val);
}

function updateCapWordsPerVisibility() {
    var styleEl = document.getElementById("cap-style");
    var rowEl   = document.getElementById("cap-words-per-row");
    if (!rowEl) return;
    rowEl.style.display = (styleEl && styleEl.value === "phrase") ? "flex" : "none";
}

var _capStyleEl = document.getElementById("cap-style");
if (_capStyleEl) _capStyleEl.addEventListener("change", updateCapWordsPerVisibility);

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
    var cfgWpcEl = document.getElementById("cfg-cap-words-per");
    if (cfgWpcEl) cfgWpcEl.value = settings.captions.wordsMin || settings.captions.wordsPerCaption || 3;
    var cfgWpcMaxEl = document.getElementById("cfg-cap-words-max");
    if (cfgWpcMaxEl) cfgWpcMaxEl.value = settings.captions.wordsMax || 5;

    var gk = document.getElementById("cfg-groq-key");        if (gk) gk.value = settings.groqApiKey || "";
    var ak = document.getElementById("cfg-anthropic-key");   if (ak) ak.value = settings.anthropicApiKey || "";
    var ok = document.getElementById("cfg-openai-key");      if (ok) ok.value = settings.openaiApiKey || "";
    var rm = document.getElementById("cfg-refine-model");    if (rm) rm.value = settings.refineModel || "";
    setSel("cfg-refine-provider", settings.refineProvider || "groq");
    if (typeof window.efpSyncRefineUI === "function") window.efpSyncRefineUI();
    var br = document.getElementById("cfg-bitrate");       if (br) br.value = settings.bitrate;
    var ep = document.getElementById("cfg-export-path");   if (ep) ep.value = settings.exportPath || "";
    var dp = document.getElementById("cfg-download-path"); if (dp) dp.value = settings.downloadPath || "";
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

    settings.captions.language      = (document.getElementById("cfg-cap-language")  || {value:settings.captions.language}).value;
    settings.captions.model         = (document.getElementById("cfg-cap-model")     || {value:settings.captions.model}).value;
    settings.captions.style         = (document.getElementById("cfg-cap-style")     || {value:settings.captions.style}).value;
    var _cfgMin = parseInt((document.getElementById("cfg-cap-words-per") || {value:"3"}).value, 10) || 3;
    var _cfgMax = parseInt((document.getElementById("cfg-cap-words-max") || {value:"5"}).value, 10) || 5;
    if (_cfgMin < 1) _cfgMin = 1;
    if (_cfgMax < _cfgMin) _cfgMax = _cfgMin;
    if (_cfgMax > 15) _cfgMax = 15;
    settings.captions.wordsMin = _cfgMin;
    settings.captions.wordsMax = _cfgMax;
    settings.captions.wordsPerCaption = _cfgMin; // back-compat mirror
    // Reflect settings-tab change back onto the main panel inputs immediately
    var _mpMin = document.getElementById("cap-words-per"); if (_mpMin) _mpMin.value = _cfgMin;
    var _mpMax = document.getElementById("cap-words-max"); if (_mpMax) _mpMax.value = _cfgMax;

    settings.bitrate    = +(document.getElementById("cfg-bitrate")     || {value:settings.bitrate}).value || 10;
    settings.groqApiKey = (document.getElementById("cfg-groq-key") || {value:""}).value;
    settings.anthropicApiKey = (document.getElementById("cfg-anthropic-key") || {value:""}).value;
    settings.openaiApiKey = (document.getElementById("cfg-openai-key") || {value:""}).value;
    settings.refineModel = (document.getElementById("cfg-refine-model") || {value:""}).value.trim();
    settings.refineProvider = (document.getElementById("cfg-refine-provider") || {value:"groq"}).value;
    settings.exportPath =  (document.getElementById("cfg-export-path") || {value:""}).value;
    settings.downloadPath = (document.getElementById("cfg-download-path") || {value:""}).value;
    settings.filenamePattern = (document.getElementById("cfg-filename-pattern") || {value:"sequence"}).value;

    if (settings.language !== currentLang) {
        currentLang = settings.language;
        applyLanguage(currentLang);
    }
    if (typeof window.__refreshAuto === "function") window.__refreshAuto();
}
function getClipboardDir() {
    if (!fsModule || !osModule || !pathModule) return "";
    var home = osModule.homedir();
    var clipboardDir = pathModule.join(home, "Documents", "EditFlowPro_Clipboard");
    try {
        if (!fsModule.existsSync(clipboardDir)) {
            fsModule.mkdirSync(clipboardDir, { recursive: true });
        }
        return clipboardDir;
    } catch(e) {
        return getSafeTempDir();
    }
}
function getSafeTempDir() {
    if (!fsModule || !osModule || !pathModule) return "";
    var isWin = (osModule.platform() === "win32");
    if (isWin) {
        var publicDir = process.env["PUBLIC"] || "C:\\Users\\Public";
        var safeDir = pathModule.join(publicDir, "EditFlowPro_Temp");
        try {
            if (!fsModule.existsSync(safeDir)) {
                fsModule.mkdirSync(safeDir, { recursive: true });
            }
            return safeDir;
        } catch(e) {
            return osModule.tmpdir();
        }
    }
    return osModule.tmpdir();
}
function findExportPreset() {
    if (!fsModule) return;
    var knownPaths = [];
    var isWin = (osModule && osModule.platform() === "win32");
    
    if (isWin) {
        var programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
        var years = ["2029", "2028", "2027", "2026", "2025", "2024", "2023", "2022", "2021", "2020"];
        for (var i = 0; i < years.length; i++) {
            knownPaths.push(programFiles + "\\Adobe\\Adobe Media Encoder " + years[i] + "\\MediaIO\\systempresets\\4E49434B_48323634\\00 - Match Source - High bitrate.epr");
            knownPaths.push(programFiles + "\\Adobe\\Adobe Premiere Pro " + years[i] + "\\MediaIO\\systempresets\\4E49434B_48323634\\00 - Match Source - High bitrate.epr");
        }
    } else {
        knownPaths = [
            "/Applications/Adobe Media Encoder 2026/Adobe Media Encoder 2026.app/Contents/MediaIO/systempresets/4E49434B_48323634/00 - Match Source - High bitrate.epr",
            "/Applications/Adobe Media Encoder 2025/Adobe Media Encoder 2025.app/Contents/MediaIO/systempresets/4E49434B_48323634/00 - Match Source - High bitrate.epr",
            "/Applications/Adobe Media Encoder 2024/Adobe Media Encoder 2024.app/Contents/MediaIO/systempresets/4E49434B_48323634/00 - Match Source - High bitrate.epr"
        ];
    }
    
    for (var i = 0; i < knownPaths.length; i++) {
        try {
            if (fsModule.existsSync(knownPaths[i])) {
                foundPresetPath = knownPaths[i];
                console.log("[EFP] Preset found (direct): " + foundPresetPath);
                return;
            }
        } catch(e) {}
    }
    
    // Fallback: search with command
    if (!execModule) return;
    if (isWin) {
        var adobeDir = (process.env["ProgramFiles"] || 'C:\\Program Files') + '\\Adobe';
        var winCmd = 'powershell -NoProfile -InputFormat None -Command "Get-ChildItem -Path \'' + adobeDir + '\\Adobe Premiere Pro *\', \'' + adobeDir + '\\Adobe Media Encoder *\' -Filter \'00 - Match Source - High bitrate.epr\' -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName -First 1"';
        execModule(winCmd, function(e, o) {
            if (o && o.trim()) {
                foundPresetPath = o.trim();
                console.log("[EFP] Preset found (PowerShell find): " + foundPresetPath);
            }
        });
    } else {
        execModule('find /Applications -name "*.epr" -path "*Match*Source*High*" 2>/dev/null | head -1', function(e, o) {
            if (o && o.trim()) {
                foundPresetPath = o.trim();
                console.log("[EFP] Preset found (find): " + foundPresetPath);
            }
        });
    }
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
        if (e || !xml) {
            console.error("[modifyPresetBitrate] Failed to read preset:", e);
            showStatus("Can't read preset.", "red");
            showProgress("Export failed", 0);
            setTimeout(hideProgress, 1000);
            return;
        }
        try {
            var lines = String(xml).split("\n");
            var inTarget = false, inMax = false;
            var targetVal = parseFloat(br) || 10.0;
            var maxVal = Math.max(targetVal, Math.round(targetVal * 1.2));
            
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].indexOf("ADBEVideoTargetBitrate") !== -1) {
                    inTarget = true;
                }
                if (inTarget && lines[i].indexOf("<ParamValue>") !== -1) { 
                    lines[i] = "\t\t<ParamValue>" + targetVal + ".</ParamValue>"; 
                    inTarget = false; 
                }
                
                if (lines[i].indexOf("ADBEVideoMaxBitrate") !== -1) {
                    inMax = true;
                }
                if (inMax && lines[i].indexOf("<ParamValue>") !== -1) { 
                    lines[i] = "\t\t<ParamValue>" + maxVal + ".</ParamValue>"; 
                    inMax = false; 
                }
            }
            var content = lines.join("\n");
            var tempDir = getSafeTempDir();
            var tmp = pathModule.join(tempDir, "efp_" + Date.now() + ".epr");
            try {
                fsModule.writeFileSync(tmp, content, "utf8");
            } catch(writeErr) {
                console.warn("[modifyPresetBitrate] Failed to write to tempDir, using os.tmpdir():", writeErr);
                tmp = pathModule.join(osModule.tmpdir(), "efp_" + Date.now() + ".epr");
                fsModule.writeFileSync(tmp, content, "utf8");
            }
            cb(tmp, br);
        } catch(err) {
            console.error("[modifyPresetBitrate] Error modifying preset:", err);
            showStatus("Error modifying preset: " + err.message, "red");
            showProgress("Export failed", 0);
            setTimeout(hideProgress, 1000);
        }
    });
}

// ── CLIPBOARD ────────────────────────────────────────────────
function pasteFromClipboard() {
    if (!execFileModule || !fsModule || !osModule || !pathModule) { showStatus("NodeJS required.", "red"); return; }
    var ps = document.getElementById("paste-status"); if (ps) ps.innerText = "Reading...";
    var cancelBtn = document.getElementById("btn-paste-cancel");
    if (cancelBtn) cancelBtn.classList.remove("hidden");
    var isWin = (osModule && osModule.platform() === "win32");
    
    var safeTemp = getSafeTempDir();
    var tmp;
    if (isWin) {
        tmp = pathModule.join(safeTemp, "efp_paste.png");
    } else {
        var clipboardDir = getClipboardDir();
        var uniqueName = "efp_paste_" + Date.now() + ".png";
        tmp = pathModule.join(clipboardDir, uniqueName);
    }
    
    if (isWin) {
        var winPath = tmp.replace(/\//g, "\\");
        var tempPs1 = pathModule.join(safeTemp, "efp_paste_script.ps1");
        var scriptContent = [
            'Add-Type -AssemblyName System.Windows.Forms',
            'Add-Type -AssemblyName System.Drawing',
            '$outputPath = "' + winPath.replace(/"/g, '`"') + '"',
            '$data = [System.Windows.Forms.Clipboard]::GetDataObject()',
            'if ($data -ne $null -and $data.GetDataPresent("PNG")) {',
            '    $stream = $data.GetData("PNG")',
            '    if ($stream -ne $null) {',
            '        $bytes = New-Object Byte[] $stream.Length',
            '        $stream.Read($bytes, 0, $stream.Length) | Out-Null',
            '        [System.IO.File]::WriteAllBytes($outputPath, $bytes)',
            '        $stream.Dispose()',
            '        exit 0',
            '    }',
            '}',
            'if ([System.Windows.Forms.Clipboard]::ContainsImage()) {',
            '    $img = [System.Windows.Forms.Clipboard]::GetImage()',
            '    if ($img -ne $null) {',
            '        $img.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)',
            '        $img.Dispose()',
            '        exit 0',
            '    }',
            '} elseif ([System.Windows.Forms.Clipboard]::ContainsFileDropList()) {',
            '    $files = [System.Windows.Forms.Clipboard]::GetFileDropList()',
            '    if ($files.Count -gt 0) {',
            '        $f = $files[0]',
            '        if ($f -match "\\.(png|jpg|jpeg|gif|bmp|tiff)$") {',
            '            Copy-Item $f $outputPath -Force',
            '            exit 0',
            '        }',
            '    }',
            '}',
            'exit 1'
        ].join("\r\n");

        try {
            fsModule.writeFileSync(tempPs1, scriptContent, 'utf8');
            var args = ['-NoProfile', '-STA', '-InputFormat', 'None', '-ExecutionPolicy', 'Bypass', '-File', tempPs1];
            console.log("[pasteFromClipboard] Running powershell with script:", tempPs1);
            activeClipboardProcess = execFileModule('powershell.exe', args, { timeout: 15000 }, function(e) {
                activeClipboardProcess = null;
                var cbBtn = document.getElementById("btn-paste-cancel");
                if (cbBtn) cbBtn.classList.add("hidden");
                try { fsModule.unlinkSync(tempPs1); } catch(err) {}
                if (e || !fsModule.existsSync(tmp)) {
                    console.error("[pasteFromClipboard] PowerShell error or output file missing.", e);
                    if (ps) ps.innerText = "No image.";
                    showStatus("No image in clipboard. Copy an image first.", "red");
                    return;
                }
                if (ps) ps.innerText = "Importing...";
                csInterface.evalScript('$._editflow.importClipboardImage("' + tmp.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '")', function(res) {
                    if (ps) ps.innerText = "Done!";
                    handleJSXResult(res);
                    try { fsModule.unlinkSync(tmp); } catch(e2) {}
                });
            });
        } catch(err) {
            activeClipboardProcess = null;
            if (cancelBtn) cancelBtn.classList.add("hidden");
            console.error("[pasteFromClipboard] Script write failed:", err);
            if (ps) ps.innerText = "Failed.";
            showStatus("Failed to access temporary directory.", "red");
        }
    } else {
        // ── macOS: AppleScript ──
        var args = [
            '-e', 'try',
            '-e', 'set d to the clipboard as \u00abclass PNGf\u00bb',
            '-e', 'set f to open for access POSIX file "' + tmp + '" with write permission',
            '-e', 'write d to f',
            '-e', 'close access f',
            '-e', 'return "ok"',
            '-e', 'on error',
            '-e', 'return "no"',
            '-e', 'end try'
        ];
        console.log("[pasteFromClipboard] Running osascript for clipboard");
        activeClipboardProcess = execFileModule('osascript', args, function(e, o) {
            activeClipboardProcess = null;
            var cbBtn = document.getElementById("btn-paste-cancel");
            if (cbBtn) cbBtn.classList.add("hidden");
            var out = o ? o.trim() : "";
            if (e || out === "no") {
                console.error("[pasteFromClipboard] osascript error or returned 'no':", e, out);
                if (ps) ps.innerText = "No image.";
                showStatus("No image in clipboard. Copy an image first.", "red");
                return;
            }
            if (!fsModule.existsSync(tmp)) {
                if (ps) ps.innerText = "Failed.";
                showStatus("Failed to write clipboard image file.", "red");
                return;
            }
            if (ps) ps.innerText = "Importing...";
            csInterface.evalScript('$._editflow.importClipboardImage("' + tmp.replace(/\\/g,"\\\\").replace(/"/g,'\\"') + '")', function(res) {
                if (ps) ps.innerText = "Done!";
                handleJSXResult(res);
                // On macOS, do not delete the file since it is linked project media
            });
        });
    }
}

function cancelPaste() {
    if (activeClipboardProcess) {
        try {
            activeClipboardProcess.kill('SIGTERM');
            console.log("[Cancel] Sent SIGTERM to activeClipboardProcess");
        } catch(e) {
            console.warn("[Cancel] Error killing clipboard process:", e.message);
        }
        activeClipboardProcess = null;
    }
    var ps = document.getElementById("paste-status");
    if (ps) ps.innerText = "Cancelled.";
    var cancelBtn = document.getElementById("btn-paste-cancel");
    if (cancelBtn) cancelBtn.classList.add("hidden");
    showStatus("Paste cancelled.", "orange");
}
function importBlob(blob) {
    if (!fsModule || !osModule || !pathModule) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var bufClass = (typeof Buffer !== "undefined" ? Buffer : require("buffer").Buffer);
        var buf = bufClass.from(new Uint8Array(e.target.result));
        var isWin = (osModule.platform() === "win32");
        var tmp;
        if (isWin) {
            tmp = osModule.tmpdir() + "/efp_paste_" + Date.now() + ".png";
        } else {
            var clipboardDir = getClipboardDir();
            tmp = pathModule.join(clipboardDir, "efp_paste_" + Date.now() + ".png");
        }
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
            var label = "";
            if (typeof currentLang !== "undefined" && currentLang === "ar" && cat.name_ar) {
                label = cat.name_ar;
            } else {
                label = cat.name;
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
        
        // SORTING: Favorites first
        result.sort(function(a, b) {
            var favs = settings.favoriteSfx || [];
            var aFav = favs.indexOf(a.id) > -1 ? 1 : 0;
            var bFav = favs.indexOf(b.id) > -1 ? 1 : 0;
            if (aFav !== bFav) return bFav - aFav; // 1 comes before 0
            return a.name.localeCompare(b.name);
        });
        
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

        var favBtn = document.createElement("button");
        var isFav = (settings.favoriteSfx || []).indexOf(sound.id) > -1;
        favBtn.className = "sfx-fav-btn" + (isFav ? " active" : "");
        favBtn.innerHTML = isFav ? "★" : "☆";
        favBtn.title = "Toggle Favorite";
        favBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            var favList = settings.favoriteSfx || [];
            var idx = favList.indexOf(sound.id);
            var isAdding = false;
            if (idx > -1) {
                favList.splice(idx, 1);
            } else {
                favList.push(sound.id);
                isAdding = true;
            }
            settings.favoriteSfx = favList;
            if (typeof saveSettings === "function") saveSettings();

            if (isAdding) {
                var floatTxt = document.createElement("div");
                floatTxt.className = "sfx-fav-float";
                floatTxt.textContent = "★";
                favBtn.appendChild(floatTxt);
                setTimeout(function() {
                    if (floatTxt.parentNode) floatTxt.parentNode.removeChild(floatTxt);
                    renderSoundList();
                }, 600);
                favBtn.classList.add("active");
                favBtn.innerHTML = "★";
            } else {
                renderSoundList();
            }
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
        row.appendChild(favBtn);
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

// =========================================================
// WEB DOWNLOADER — YouTube / Instagram -> Premiere timeline
// yt-dlp is provisioned on first use into the EditFlowPro tools dir rather
// than bundled: the shipped zip stays ~30MB, and yt-dlp can self-update when
// the sites change their extractors (which they do constantly).
// =========================================================
(function() {
    var YTDLP_URL_MAC = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos";
    var YTDLP_URL_WIN = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe";
    var UPDATE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

    var activeDownloadProc = null;
    var lastInfo = null;
    var busy = false;

    function isWin() { return !!(osModule && osModule.platform() === "win32"); }
    function el(id) { return document.getElementById(id); }

    function dlStatus(msg, isError) {
        var node = el("dl-status");
        if (!node) return;
        node.textContent = msg || "";
        node.style.whiteSpace = "pre-line";
        node.style.color = isError ? "#ff6b6b" : "";
    }

    function setBusy(state) {
        busy = state;
        var btn = el("btn-dl-download");
        var stop = el("btn-dl-cancel");
        if (btn) btn.disabled = state;
        if (stop) stop.classList[state ? "remove" : "add"]("hidden");
    }

    // ---------- tool provisioning ----------

    function getYtDlpPath() {
        if (!fsModule || !osModule) return null;
        var ext = isWin() ? ".exe" : "";
        var bundled = extensionPath + "/bin/yt-dlp" + ext;
        if (fsModule.existsSync(bundled)) return bundled;

        var toolsPath = EFP_BIN_DIR + (isWin() ? "\\" : "/") + "yt-dlp" + ext;
        if (fsModule.existsSync(toolsPath)) return toolsPath;

        if (!isWin()) {
            var candidates = ["/opt/homebrew/bin/yt-dlp", "/usr/local/bin/yt-dlp", "/opt/local/bin/yt-dlp"];
            for (var i = 0; i < candidates.length; i++) {
                if (fsModule.existsSync(candidates[i])) return candidates[i];
            }
        }
        return null;
    }

    function ensureYtDlp(cb) {
        if (!fsModule || !execModule) return cb("Node modules unavailable.");
        var found = getYtDlpPath();
        if (found) return cb(null, found);

        try { fsModule.mkdirSync(EFP_BIN_DIR, { recursive: true }); } catch(e) {}

        var outPath = EFP_BIN_DIR + (isWin() ? "\\yt-dlp.exe" : "/yt-dlp");
        var url = isWin() ? YTDLP_URL_WIN : YTDLP_URL_MAC;

        showProgress(t("dl_installing"), 18, false);
        dlStatus(t("dl_installing"));

        var curlCmd = (isWin() ? 'curl.exe' : 'curl') + ' -L --fail -o "' + outPath + '" "' + url + '"';
        execModule(curlCmd, { timeout: 300000, maxBuffer: 16 * 1024 * 1024 }, function(err) {
            if (!err && fsModule.existsSync(outPath)) return finishInstall(outPath, cb);

            if (!isWin()) return cb("Could not download the download engine. Check your connection.");
            var ps = 'powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri \'' + url + '\' -OutFile \'' + outPath + '\' }"';
            execModule(ps, { timeout: 300000, maxBuffer: 16 * 1024 * 1024 }, function(psErr) {
                if (psErr || !fsModule.existsSync(outPath)) {
                    return cb("Could not download the download engine. Check your connection.");
                }
                finishInstall(outPath, cb);
            });
        });
    }

    function finishInstall(outPath, cb) {
        if (!isWin()) {
            // curl does not set the quarantine flag, but the file still needs
            // the exec bit before it can be spawned.
            try { fsModule.chmodSync(outPath, 493); } catch(e) { console.warn("[dl] chmod failed:", e.message); }
        }
        cb(null, outPath);
    }

    // Fire-and-forget weekly self-update. Never blocks or fails a download.
    function maybeSelfUpdate(binPath) {
        try {
            var last = settings.ytdlpLastUpdate || 0;
            if (Date.now() - last < UPDATE_INTERVAL_MS) return;
            settings.ytdlpLastUpdate = Date.now();
            saveSettings();
            if (!execFileModule) return;
            execFileModule(binPath, ["-U"], { timeout: 120000 }, function(err) {
                console.log("[dl] self-update finished:", err ? err.message : "ok");
            });
        } catch(e) {}
    }

    // ---------- paths / args ----------

    // CEP's cep.fs.showOpenDialog hands back a "file:///Users/..." URL, which every
    // fs call rejects. Anything that reaches the panel gets normalised here so a
    // value already saved by the broken build self-heals on next use.
    function normalizePath(p) { return efpNormalizePath(p); }

    // existsSync alone is not enough: a folder can exist and still be unwritable.
    // Returns null when usable, otherwise a short reason code.
    function folderProblem(dir) {
        if (!dir) return "empty";
        try { fsModule.mkdirSync(dir, { recursive: true }); } catch(e) {}
        if (!fsModule.existsSync(dir)) return "missing";
        try {
            var probe = dir + (isWin() ? "\\" : "/") + ".efp_write_test";
            fsModule.writeFileSync(probe, "x");
            fsModule.unlinkSync(probe);
            return null;
        } catch(e) { return e.code || "denied"; }
    }

    function defaultDownloadDir() {
        if (!osModule || !pathModule) return "";
        var home = osModule.homedir();
        return isWin()
            ? pathModule.join(home, "Videos", "EditFlow Downloads")
            : pathModule.join(home, "Movies", "EditFlow Downloads");
    }

    // The visible in-panel field wins, so the user always knows exactly where the
    // file landed and can delete it later without hunting for it.
    function getDownloadDir() {
        var field = el("dl-path");
        var typed = (field && field.value) ? normalizePath(field.value) : "";
        if (typed) return typed;
        if (settings.downloadPath) return normalizePath(settings.downloadPath);
        return defaultDownloadDir();
    }

    function rememberDownloadDir(dir) {
        dir = normalizePath(dir);
        settings.downloadPath = dir;
        saveSettings();
        var field = el("dl-path");
        if (field) field.value = dir;
        var cfg = document.getElementById("cfg-download-path");
        if (cfg) cfg.value = dir;
    }

    function isYouTube(url) { return /(?:youtube\.com|youtu\.be)/i.test(url); }

    function validTime(v) { return /^(\d{1,2}:)?\d{1,2}:\d{1,2}$/.test(v) || /^\d+(\.\d+)?$/.test(v); }

    function buildSectionArg() {
        var from = (el("dl-from") && el("dl-from").value || "").trim();
        var to = (el("dl-to") && el("dl-to").value || "").trim();
        if (!from && !to) return null;
        if (from && !validTime(from)) return "BAD";
        if (to && !validTime(to)) return "BAD";
        return "*" + (from || "0") + "-" + (to || "inf");
    }

    // CEP panels launched from the Dock inherit a minimal PATH that excludes
    // Homebrew, so yt-dlp cannot find ffmpeg on its own. Without an explicit
    // --ffmpeg-location it silently skips the merge and leaves the video and
    // audio as two separate files — an import with no sound. Verified.
    function resolveFFmpeg() {
        var p = (typeof window.efpGetFFmpegPath === "function") ? window.efpGetFFmpegPath() : "ffmpeg";
        if (p && p !== "ffmpeg" && fsModule && fsModule.existsSync(p)) return p;
        return null;
    }

    function commonArgs(url) {
        var args = ["--no-warnings", "--newline", "--no-color", "--retries", "5", "--fragment-retries", "10"];
        var ff = resolveFFmpeg();
        if (ff) args.push("--ffmpeg-location", ff);
        // A bare YouTube link carrying &list= would otherwise pull the whole
        // playlist; other sites (Instagram carousels) are capped instead.
        if (isYouTube(url)) args.push("--no-playlist");
        else args.push("--playlist-end", "20");

        var cookies = el("dl-cookies") ? el("dl-cookies").value : "none";
        if (cookies && cookies !== "none") args.push("--cookies-from-browser", cookies);
        return args;
    }

    // ---------- metadata ----------

    function fetchInfo() {
        var url = (el("dl-url") && el("dl-url").value || "").trim();
        if (!url) { dlStatus(t("dl_err_nourl"), true); return; }
        if (busy) return;

        lastInfo = null;
        var card = el("dl-info");
        if (card) card.classList.add("hidden");
        dlStatus(t("dl_fetching"));

        ensureYtDlp(function(err, bin) {
            if (err) { hideProgress(); dlStatus(err, true); return; }
            hideProgress();
            if (!execFileModule) { dlStatus("Node exec unavailable.", true); return; }

            var args = commonArgs(url).concat([
                "--print", "%(title)s|||%(duration)s|||%(thumbnail)s|||%(uploader)s",
                "--playlist-items", "1",
                url
            ]);

            execFileModule(bin, args, { timeout: 90000, maxBuffer: 8 * 1024 * 1024 }, function(e, stdout, stderr) {
                if (e && !stdout) {
                    dlStatus(friendlyError(stderr || e.message), true);
                    return;
                }
                var line = (stdout || "").split("\n")[0] || "";
                var parts = line.split("|||");
                if (!parts[0]) { dlStatus(t("dl_err_info"), true); return; }

                lastInfo = { title: parts[0], duration: parseFloat(parts[1]) || 0, thumb: parts[2] || "", uploader: parts[3] || "" };
                renderInfo(lastInfo);
                dlStatus("");
            });
        });
    }

    function renderInfo(info) {
        var card = el("dl-info");
        if (!card) return;
        var img = el("dl-thumb");
        if (img) {
            if (info.thumb && /^https?:/i.test(info.thumb)) { img.src = info.thumb; img.style.display = ""; }
            else { img.style.display = "none"; }
        }
        var titleEl = el("dl-title");
        if (titleEl) titleEl.textContent = info.title;
        var metaEl = el("dl-meta");
        if (metaEl) {
            var d = info.duration;
            var mm = Math.floor(d / 60), ss = Math.floor(d % 60);
            var dur = d > 0 ? (mm + ":" + (ss < 10 ? "0" : "") + ss) : "--:--";
            metaEl.textContent = (info.uploader ? info.uploader + " · " : "") + dur;
        }
        card.classList.remove("hidden");
    }

    // Pull the first real ERROR line out of yt-dlp's output so the user sees what
    // actually went wrong. Bucketing errors into friendly text and discarding the
    // original made a misclassification impossible to diagnose — never do that.
    function errorDetail(s) {
        var lines = (s || "").split(/\r?\n/);
        for (var i = 0; i < lines.length; i++) {
            var ln = lines[i].replace(/\s+/g, " ").trim();
            if (!ln) continue;
            if (/^ERROR:/i.test(ln) || /^WARNING:/i.test(ln)) {
                ln = ln.replace(/^ERROR:\s*/i, "").replace(/^\[[^\]]+\]\s*/, "");
                // Drop yt-dlp's boilerplate links/advice; keep the actual cause.
                ln = ln.split(/\s*(?:See\s+https?:|Please report|Confirm you are on)/)[0].trim();
                return ln.length > 160 ? ln.substring(0, 157) + "…" : ln;
            }
        }
        return "";
    }

    function friendlyError(raw) {
        var s = (raw || "").toString();
        console.error("[dl] raw yt-dlp error:\n" + s);

        var hint;
        // Order matters: YouTube's bot check also contains "sign in", and
        // "Requested format is not available" must never be read as a login wall.
        if (/not a bot|confirm you'?re not|too many requests|429/i.test(s)) hint = t("dl_err_bot");
        else if (/requested format is not available|no video formats|only images are available/i.test(s)) hint = t("dl_err_format");
        else if (/login required|rate-limit|private|sign in|cookies|empty media response/i.test(s)) hint = t("dl_err_login");
        else if (/unsupported url|is not a valid url/i.test(s)) hint = t("dl_err_unsupported");
        else if (/unable to download|network|timed out|temporary failure|failed to resolve|connection/i.test(s)) hint = t("dl_err_network");
        else hint = t("dl_err_generic");

        var detail = errorDetail(s);
        return detail ? (hint + "\n" + detail) : hint;
    }

    // ---------- download ----------

    function startDownload() {
        if (busy) return;
        var url = (el("dl-url") && el("dl-url").value || "").trim();
        if (!url) { dlStatus(t("dl_err_nourl"), true); return; }
        if (!spawnModule || !fsModule || !pathModule) { dlStatus("Node modules unavailable.", true); return; }

        var section = buildSectionArg();
        if (section === "BAD") { dlStatus(t("dl_err_time"), true); return; }

        // A user-typed folder can be unwritable or plain wrong; fail here with a
        // clear message instead of letting yt-dlp die with a cryptic path error.
        var dir = getDownloadDir();
        var problem = folderProblem(dir);
        if (problem) {
            console.error("[dl] save folder unusable (" + problem + "): " + dir);
            dlStatus(t("dl_err_folder") + "\n" + dir + "  [" + problem + "]", true);
            return;
        }

        setBusy(true);
        showProgress(t("dl_preparing"), 18, false);
        dlStatus("");

        // Merging the separate video/audio streams (and trimming a range) is done
        // by ffmpeg — without it a download silently comes back as video with no
        // sound. On Windows this also runs the one-time ffmpeg auto-download.
        ensureFFmpegReady(function(ffErr) {
            if (ffErr) { setBusy(false); hideProgress(); dlStatus(ffErr, true); return; }
            ensureYtDlp(function(err, bin) {
                if (err) { setBusy(false); hideProgress(); dlStatus(err, true); return; }
                runYtDlp(bin, url, dir, section);
            });
        });
    }

    function ensureFFmpegReady(cb) {
        if (resolveFFmpeg()) return cb(null);
        if (typeof window.efpEnsureFFmpeg !== "function") return cb(t("dl_err_ffmpeg"));
        window.efpEnsureFFmpeg(
            function(msg, pct) { showProgress(msg, Math.max(pct || 0, 16), false); },
            function() { cb(resolveFFmpeg() ? null : t("dl_err_ffmpeg")); }
        );
    }

    function runYtDlp(bin, url, dir, section) {
        var maxQuality = (el("dl-quality") && el("dl-quality").value) === "max";
        var sep = isWin() ? "\\" : "/";
        var pathFile = dir + sep + ".efp_lastfile";
        try { if (fsModule.existsSync(pathFile)) fsModule.unlinkSync(pathFile); } catch(e) {}

        var fmt = maxQuality
            ? "bestvideo+bestaudio/best"
            : "bestvideo[vcodec^=avc1][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best[height<=1080]/best";

        var args = commonArgs(url).concat([
            "-f", fmt,
            "--merge-output-format", "mp4",
            "-o", dir + sep + "%(title).60B [%(id)s].%(ext)s",
            "--print-to-file", "after_move:filepath", pathFile
        ]);
        // Highest resolution first, but prefer H.264 among formats AT that
        // resolution. YouTube ranks AV1/VP9 above H.264 by default, so plain
        // "bestvideo" grabs an AV1 file that then needs a slow transcode — even
        // when a higher-bitrate H.264 of the same size exists. Verified: this
        // turns a 3.5-minute convert into an instant import for 1080p sources.
        if (maxQuality) args.push("-S", "res,vcodec:h264,br");
        if (section) args.push("--download-sections", section);
        args.push(url);

        var passCount = 0;
        var stderrBuf = "";

        try {
            activeDownloadProc = spawnModule(bin, args, {});
        } catch(e) {
            setBusy(false); hideProgress(); dlStatus(t("dl_err_generic"), true);
            return;
        }

        activeDownloadProc.stdout.on("data", function(chunk) {
            var lines = chunk.toString().split(/\r?\n/);
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (!line) continue;
                if (/^\[download\] Destination:/.test(line)) passCount++;
                var m = line.match(/\[download\]\s+([0-9.]+)%/);
                if (m) {
                    var raw = parseFloat(m[1]);
                    // Video and audio are fetched as two separate passes; map
                    // them onto one continuous bar instead of 0-100 twice.
                    var mapped = passCount <= 1 ? 20 + raw * 0.45 : 65 + raw * 0.20;
                    var speed = line.match(/at\s+([0-9.]+\s*[KMG]i?B\/s)/);
                    var eta = line.match(/ETA\s+([0-9:]+)/);
                    var label = t("dl_downloading");
                    if (speed) label += "  " + speed[1];
                    if (eta) label += "  ETA " + eta[1];
                    showProgress(label, Math.min(Math.round(mapped), 85), false);
                } else if (/^\[Merger\]/.test(line)) {
                    showProgress(t("dl_merging"), 88, false);
                }
            }
        });

        activeDownloadProc.stderr.on("data", function(chunk) {
            stderrBuf += chunk.toString();
            if (stderrBuf.length > 8000) stderrBuf = stderrBuf.slice(-8000);
        });

        activeDownloadProc.on("error", function(e) {
            activeDownloadProc = null;
            setBusy(false); hideProgress();
            dlStatus(t("dl_err_generic") + " (" + e.message + ")", true);
        });

        activeDownloadProc.on("close", function(code) {
            var wasCancelled = (activeDownloadProc && activeDownloadProc.efpCancelled);
            activeDownloadProc = null;
            if (wasCancelled) { setBusy(false); hideProgress(); dlStatus(t("dl_cancelled")); return; }
            if (code !== 0) {
                setBusy(false); hideProgress();
                dlStatus(friendlyError(stderrBuf), true);
                return;
            }
            maybeSelfUpdate(bin);
            resolveOutput(dir, pathFile, function(finalPath) {
                if (!finalPath) {
                    setBusy(false); hideProgress();
                    dlStatus(t("dl_err_nofile"), true);
                    return;
                }
                if (maxQuality) prepareForPremiere(finalPath);
                else placeInPremiere(finalPath);
            });
        });
    }

    // The after_move:filepath sidecar is authoritative; fall back to the newest
    // media file in the folder if yt-dlp could not write it.
    function resolveOutput(dir, pathFile, cb) {
        try {
            if (fsModule.existsSync(pathFile)) {
                var raw = fsModule.readFileSync(pathFile, "utf8").split(/\r?\n/);
                for (var i = raw.length - 1; i >= 0; i--) {
                    if (raw[i] && fsModule.existsSync(raw[i])) { try { fsModule.unlinkSync(pathFile); } catch(e) {} return cb(raw[i]); }
                }
            }
        } catch(e) {}
        try {
            var entries = fsModule.readdirSync(dir);
            var newest = null, newestTime = 0;
            for (var j = 0; j < entries.length; j++) {
                if (!/\.(mp4|mkv|webm|mov|m4a|mp3)$/i.test(entries[j])) continue;
                // Skip yt-dlp's un-merged per-format leftovers (Name.f133.mp4),
                // which are video-only or audio-only.
                if (/\.f\d+\.[a-z0-9]+$/i.test(entries[j])) continue;
                var full = dir + (isWin() ? "\\" : "/") + entries[j];
                var st = fsModule.statSync(full);
                if (st.mtimeMs > newestTime) { newestTime = st.mtimeMs; newest = full; }
            }
            return cb(newest);
        } catch(e) { return cb(null); }
    }

    // Cached once per session. Hardware H.264 via VideoToolbox measured ~2x
    // faster than libx264 on this Mac against a real 1080p60 AV1 source, and is
    // more than enough for a file that Premiere will re-encode on final export.
    var hwEncoder = null; // null = not probed yet, "" = none available
    function detectHwEncoder(ffmpegBin, cb) {
        if (hwEncoder !== null) return cb(hwEncoder);
        if (!execFileModule) { hwEncoder = ""; return cb(hwEncoder); }
        execFileModule(ffmpegBin, ["-hide_banner", "-encoders"], { timeout: 15000, maxBuffer: 4 * 1024 * 1024 }, function(e, stdout) {
            hwEncoder = /h264_videotoolbox/.test(stdout || "") ? "h264_videotoolbox" : "";
            console.log("[dl] hardware encoder:", hwEncoder || "none (using libx264)");
            cb(hwEncoder);
        });
    }

    function hhmmssToSec(h, m, s) { return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseFloat(s); }

    // Reached only when the download is still VP9/AV1 — i.e. YouTube offered no
    // H.264 at that resolution (anything above 1080p). Premiere cannot use those.
    function prepareForPremiere(filePath) {
        var ffmpegBin = resolveFFmpeg() || "ffmpeg";
        showProgress(t("dl_checking"), 90, false);

        execFileModule(ffmpegBin, ["-hide_banner", "-i", filePath], { timeout: 30000, maxBuffer: 4 * 1024 * 1024 }, function(e, stdout, stderr) {
            var probe = (stderr || "") + (stdout || "");
            if (/Video:\s*h264/i.test(probe)) { placeInPremiere(filePath); return; }

            var dm = probe.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
            var totalSec = dm ? hhmmssToSec(dm[1], dm[2], dm[3]) : 0;
            var rm = probe.match(/,\s*(\d{2,5})x(\d{2,5})/);
            var srcHeight = rm ? parseInt(rm[2], 10) : 1080;

            detectHwEncoder(ffmpegBin, function(hw) {
                runTranscode(ffmpegBin, filePath, totalSec, srcHeight, hw);
            });
        });
    }

    function runTranscode(ffmpegBin, filePath, totalSec, srcHeight, hw) {
        var dot = filePath.lastIndexOf(".");
        var outPath = (dot > 0 ? filePath.substring(0, dot) : filePath) + "_premiere.mp4";

        var vArgs;
        if (hw) {
            // Hardware encoders need a higher bitrate than x264 for a comparable look.
            var br = srcHeight <= 1080 ? "20M" : (srcHeight <= 1440 ? "35M" : "60M");
            vArgs = ["-c:v", hw, "-b:v", br, "-profile:v", "high"];
        } else {
            vArgs = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20"];
        }
        // No -movflags +faststart: it forces a second full pass over the file for
        // no benefit on a local editing intermediate.
        var args = ["-y", "-hide_banner", "-i", filePath]
            .concat(vArgs)
            .concat(["-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", outPath]);

        // showCancel=false: the shared progress-bar cancel button is wired to the
        // captions process. Cancelling happens through this section's Stop button.
        showProgress(t("dl_converting"), 92, false);

        try {
            activeDownloadProc = spawnModule(ffmpegBin, args, {});
        } catch (eSpawn) {
            setBusy(false); hideProgress(); dlStatus(t("dl_err_convert"), true);
            return;
        }

        var tail = "";
        // CRITICAL: ffmpeg streams progress to stderr continuously. If nothing
        // reads these pipes the 64KB OS buffer fills and ffmpeg blocks on write()
        // FOREVER — the UI sits on "Converting..." while the process holds 0% CPU
        // and the output file stops growing. Draining is what keeps it alive;
        // the percentage readout is the bonus. Verified against a real hang.
        function drain(stream) {
            if (!stream) return;
            stream.on("data", function(chunk) {
                var chunkStr = chunk.toString();
                tail = (tail + chunkStr).slice(-4000);
                if (totalSec <= 0) return;
                var all = chunkStr.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g);
                if (!all) return;
                var last = all[all.length - 1].match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
                var ratio = Math.max(0, Math.min(hhmmssToSec(last[1], last[2], last[3]) / totalSec, 1));
                showProgress(t("dl_converting") + "  " + Math.round(ratio * 100) + "%", 92 + Math.round(ratio * 6), false);
            });
        }
        drain(activeDownloadProc.stderr);
        drain(activeDownloadProc.stdout);

        activeDownloadProc.on("error", function(err2) {
            activeDownloadProc = null;
            setBusy(false); hideProgress();
            dlStatus(t("dl_err_convert") + " (" + err2.message + ")", true);
        });

        activeDownloadProc.on("close", function(code) {
            var cancelled = (activeDownloadProc && activeDownloadProc.efpCancelled);
            activeDownloadProc = null;
            if (cancelled) {
                try { fsModule.unlinkSync(outPath); } catch(e4) {}
                setBusy(false); hideProgress(); dlStatus(t("dl_cancelled"));
                return;
            }
            if (code !== 0 || !fsModule.existsSync(outPath)) {
                console.error("[dl] ffmpeg transcode failed (code " + code + "):\n" + tail);
                setBusy(false); hideProgress();
                dlStatus(t("dl_err_convert"), true);
                return;
            }
            // The source is unusable inside Premiere; keep only the H.264 copy.
            try { fsModule.unlinkSync(filePath); } catch(e3) {}
            placeInPremiere(outPath);
        });
    }

    function placeInPremiere(filePath) {
        showProgress(t("dl_importing"), 96, false);
        var mode = el("dl-placement") ? el("dl-placement").value : "timeline";
        var escaped = filePath.replace(/\\/g, "/").replace(/"/g, '\\"');

        if (typeof csInterface === "undefined" || !csInterface) {
            setBusy(false); hideProgress(); dlStatus(t("dl_err_generic"), true);
            return;
        }

        csInterface.evalScript(
            '$._editflow.importMediaToTimeline("' + escaped + '", "' + mode + '")',
            function(result) {
                console.log("[dl] importMediaToTimeline:", result);
                setBusy(false);
                hideProgress();
                if (typeof handleJSXResult === "function") handleJSXResult(result);
                var parsed = (typeof safeParse === "function") ? safeParse(result) : null;
                if (parsed && parsed.status === "error") dlStatus(parsed.message, true);
                else dlStatus(t("dl_done"));
            }
        );
    }

    function cancelDownload() {
        if (!activeDownloadProc) return;
        try {
            activeDownloadProc.efpCancelled = true;
            activeDownloadProc.kill("SIGTERM");
        } catch(e) { console.warn("[dl] kill failed:", e.message); }
    }

    // ---------- i18n helper ----------

    function t(key) {
        try {
            var table = i18n[currentLang] || i18n.en;
            return table[key] || i18n.en[key] || key;
        } catch(e) { return key; }
    }

    // ---------- wiring ----------

    function init() {
        var urlInput = el("dl-url");
        if (!urlInput) return;

        safeBind("btn-dl-fetch", fetchInfo);
        safeBind("btn-dl-download", startDownload);
        safeBind("btn-dl-cancel", cancelDownload);

        safeBind("btn-dl-paste", function() {
            if (!navigator.clipboard || !navigator.clipboard.readText) { dlStatus(t("dl_err_clipboard"), true); return; }
            navigator.clipboard.readText().then(function(text) {
                urlInput.value = (text || "").trim();
                if (urlInput.value) fetchInfo();
            })["catch"](function() { dlStatus(t("dl_err_clipboard"), true); });
        });

        urlInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") { e.preventDefault(); fetchInfo(); }
        });

        var q = el("dl-quality");
        if (q) {
            q.value = settings.downloadQuality || "1080";
            q.addEventListener("change", function() {
                settings.downloadQuality = q.value;
                saveSettings();
            });
        }
        var pl = el("dl-placement");
        if (pl) {
            pl.value = settings.downloadPlacement || "timeline";
            pl.addEventListener("change", function() {
                settings.downloadPlacement = pl.value;
                saveSettings();
            });
        }

        var pathField = el("dl-path");
        if (pathField) {
            // Show the resolved folder up front rather than a placeholder, so the
            // destination is never a mystery.
            pathField.value = settings.downloadPath || defaultDownloadDir();
            pathField.addEventListener("change", function() {
                rememberDownloadDir(pathField.value.trim());
            });
        }

        // Folder.selectDialog().fsName returns a real native path. The export
        // browser already uses it for exactly this reason.
        safeBind("btn-dl-browse", function() {
            if (typeof csInterface === "undefined" || !csInterface) return;
            csInterface.evalScript(
                '(function() { var f = Folder.selectDialog("Select download folder"); return f ? f.fsName : ""; })()',
                function(result) {
                    if (result && result !== "null" && result !== "undefined" &&
                        result !== "EvalScript error." && result !== "") {
                        rememberDownloadDir(result);
                    }
                }
            );
        });

        safeBind("btn-dl-open", function() {
            var dir = getDownloadDir();
            if (!dir || !execModule) return;
            try { fsModule.mkdirSync(dir, { recursive: true }); } catch(e) {}
            execModule((isWin() ? 'explorer "' : 'open "') + dir + '"', function() {});
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() { setTimeout(init, 300); });
    } else {
        setTimeout(init, 300);
    }
})();

// =========================================================
// CAPTION REFINEMENT — send Whisper's raw text through a stronger LLM to fix
// transcription errors (and optionally translate), then map the corrected words
// back onto the original timings.
//
// The hard constraint here is timing. Whisper returns per-word start/end times
// that the word-by-word and short-phrase caption styles depend on. Rewriting the
// text invalidates them, so every corrected segment is re-timed: word-for-word
// when the count is unchanged (the usual case for spelling/hamza fixes — verified
// against real Arabic output), proportionally otherwise.
// =========================================================
(function() {
    var BATCH_SIZE = 40;          // segments per API call
    var REQ_TIMEOUT = 180000;     // 3 min per call
    // Groq rejects some default client User-Agents with a 403 — send an explicit
    // one rather than relying on whatever the runtime sets. Verified.
    var UA = "EditFlowPro/1.0";

    var PROVIDERS = {
        groq: {
            host: "api.groq.com",
            path: "/openai/v1/chat/completions",
            defaultModel: "llama-3.3-70b-versatile",
            key: function() { return settings.groqApiKey || ""; },
            headers: function(k) { return { "Authorization": "Bearer " + k }; },
            body: function(model, sys, userJson) {
                return {
                    model: model, temperature: 0.1, max_tokens: 8000,
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: sys },
                        { role: "user", content: userJson }
                    ]
                };
            },
            extract: function(res) { return res.choices[0].message.content; }
        },
        openai: {
            host: "api.openai.com",
            path: "/v1/chat/completions",
            defaultModel: "gpt-4.1",
            key: function() { return settings.openaiApiKey || ""; },
            headers: function(k) { return { "Authorization": "Bearer " + k }; },
            body: function(model, sys, userJson) {
                return {
                    model: model, temperature: 0.1,
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: sys },
                        { role: "user", content: userJson }
                    ]
                };
            },
            extract: function(res) { return res.choices[0].message.content; }
        },
        anthropic: {
            host: "api.anthropic.com",
            path: "/v1/messages",
            defaultModel: "claude-opus-5",
            key: function() { return settings.anthropicApiKey || ""; },
            headers: function(k) {
                return { "x-api-key": k, "anthropic-version": "2023-06-01" };
            },
            body: function(model, sys, userJson) {
                // No temperature: Claude Opus 5 rejects sampling parameters with a 400.
                // Effort "low" keeps this mechanical task from spending thinking tokens.
                return {
                    model: model, max_tokens: 16000, system: sys,
                    messages: [{ role: "user", content: userJson }],
                    output_config: {
                        effort: "low",
                        format: {
                            type: "json_schema",
                            schema: {
                                type: "object",
                                properties: {
                                    segments: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                i: { type: "integer" },
                                                text: { type: "string" }
                                            },
                                            required: ["i", "text"],
                                            additionalProperties: false
                                        }
                                    }
                                },
                                required: ["segments"],
                                additionalProperties: false
                            }
                        }
                    }
                };
            },
            extract: function(res) {
                var blocks = res.content || [];
                for (var i = 0; i < blocks.length; i++) {
                    if (blocks[i].type === "text") return blocks[i].text;
                }
                return "";
            }
        }
    };

    function buildSystemPrompt(mode, targetLang) {
        var base =
            "You are correcting raw speech-to-text output that will become video subtitles.\n" +
            "Rules:\n" +
            "- Fix transcription errors, spelling, punctuation, and (for Arabic) hamza, " +
            "ta-marbuta and madda.\n" +
            "- Preserve the speaker's meaning, tone and dialect. Do not summarise, " +
            "rephrase for style, or add content.\n" +
            "- Keep each segment's word count as close to the original as possible. " +
            "Subtitle timing is derived from word positions, so adding or removing words " +
            "degrades sync.\n" +
            "- Return every segment you were given, with its original index.\n";
        if (mode === "translate" && targetLang) {
            base +=
                "- After correcting, translate each segment into " + targetLang + ". " +
                "Return only the translation as the segment text. Keep translations " +
                "compact enough to read as a subtitle.\n";
        }
        base += 'Return ONLY JSON in this exact shape: ' +
                '{"segments":[{"i":<original index>,"text":"<result>"}]}';
        return base;
    }

    function httpJson(provider, apiKey, payload, cb) {
        var https;
        try { https = require("https"); } catch (e) { return cb("Node https unavailable"); }

        var data = JSON.stringify(payload);
        var hdrs = provider.headers(apiKey);
        hdrs["Content-Type"] = "application/json";
        hdrs["User-Agent"] = UA;
        hdrs["Content-Length"] = Buffer.byteLength(data);

        var req = https.request({
            hostname: provider.host, path: provider.path, method: "POST", headers: hdrs
        }, function(res) {
            var body = "";
            res.setEncoding("utf8");
            res.on("data", function(c) { body += c; });
            res.on("end", function() {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    // Surface the API's own message — a generic failure string here
                    // makes provider/key/model problems impossible to diagnose.
                    var detail = body.slice(0, 300);
                    try {
                        var errJson = JSON.parse(body);
                        if (errJson.error && errJson.error.message) detail = errJson.error.message;
                    } catch (e2) {}
                    return cb("HTTP " + res.statusCode + ": " + detail);
                }
                var parsed;
                try { parsed = JSON.parse(body); }
                catch (e3) { return cb("Invalid JSON from provider"); }
                cb(null, parsed);
            });
        });
        req.on("error", function(e) { cb("Network error: " + e.message); });
        req.setTimeout(REQ_TIMEOUT, function() {
            req.destroy();
            cb("Provider timed out (3 min)");
        });
        req.write(data);
        req.end();
    }

    function round3(n) { return Math.round(n * 1000) / 1000; }

    // Map the corrected text back onto the segment's original word timings.
    function remapWords(seg, newText) {
        var oldWords = seg.words || [];
        var tokens = String(newText).split(/\s+/);
        var clean = [];
        for (var t = 0; t < tokens.length; t++) { if (tokens[t]) clean.push(tokens[t]); }
        if (!clean.length) return oldWords;
        if (!oldWords.length) return [];

        // Same word count: reuse each original timing exactly. This is the common
        // case for spelling and diacritic fixes, and keeps sync pixel-perfect.
        if (clean.length === oldWords.length) {
            var same = [];
            for (var i = 0; i < clean.length; i++) {
                same.push({ start: oldWords[i].start, end: oldWords[i].end, text: clean[i] });
            }
            return same;
        }

        // Count changed (words merged/split, or translated): spread the segment's
        // own span across the new words in proportion to their length. Approximate
        // per word, but exact at the segment boundaries, so captions never drift.
        var start = parseFloat(seg.start) || 0;
        var end = parseFloat(seg.end) || start;
        var span = end - start;
        if (span <= 0) span = 0.001;
        var total = 0, j;
        for (j = 0; j < clean.length; j++) total += clean[j].length + 1;
        var out = [], cursor = start;
        for (j = 0; j < clean.length; j++) {
            var share = span * ((clean[j].length + 1) / total);
            var wEnd = (j === clean.length - 1) ? end : Math.min(cursor + share, end);
            out.push({ start: round3(cursor), end: round3(wEnd), text: clean[j] });
            cursor = wEnd;
        }
        return out;
    }

    function chunk(arr, size) {
        var out = [], i;
        for (i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
    }

    // Public entry point. Calls back with a summary object whose .json carries the
    // refined segments, or with the ORIGINAL summary if anything goes wrong —
    // refinement is an enhancement and must never cost the user their captions.
    window.efpRefineCaptions = function(summary, opts, progressCb, cb) {
        var provider = PROVIDERS[opts.provider];
        if (!provider) return cb("Unknown provider: " + opts.provider, summary);

        var apiKey = provider.key();
        if (!apiKey) return cb("missing_key", summary);

        var doc;
        try { doc = JSON.parse(summary.json); }
        catch (e) { return cb("Could not read the transcription", summary); }

        var segments = doc.segments || [];
        if (!segments.length) return cb(null, summary);

        var model = (settings.refineModel || "").trim() || provider.defaultModel;
        var sys = buildSystemPrompt(opts.mode, opts.targetLang);
        var batches = chunk(segments, BATCH_SIZE);
        var done = 0, failed = null;
        var results = {};   // original index -> corrected text

        function runBatch(bi) {
            if (bi >= batches.length) return finish();

            var batch = batches[bi];
            var payloadSegs = [];
            for (var k = 0; k < batch.length; k++) {
                payloadSegs.push({ i: segments.indexOf(batch[k]), text: batch[k].text || "" });
            }
            var userJson = JSON.stringify({ segments: payloadSegs });

            httpJson(provider, apiKey, provider.body(model, sys, userJson), function(err, res) {
                if (err) { failed = err; return finish(); }
                var raw = "";
                try { raw = provider.extract(res); } catch (e) { failed = "Unexpected provider response"; return finish(); }
                var parsed;
                try { parsed = JSON.parse(raw); }
                catch (e2) {
                    // Some models wrap JSON in prose or a code fence — recover the object.
                    var m = raw.match(/\{[\s\S]*\}/);
                    try { parsed = JSON.parse(m ? m[0] : ""); }
                    catch (e3) { failed = "Provider did not return valid JSON"; return finish(); }
                }
                var got = (parsed && parsed.segments) || [];
                for (var g = 0; g < got.length; g++) {
                    var item = got[g];
                    if (typeof item.i === "number" && typeof item.text === "string" && item.text.trim()) {
                        results[item.i] = item.text.trim();
                    }
                }
                done++;
                if (progressCb) progressCb(done, batches.length);
                runBatch(bi + 1);
            });
        }

        function finish() {
            if (failed) return cb(failed, summary);

            var changed = 0, exactTiming = 0;
            for (var i = 0; i < segments.length; i++) {
                var fixed = results[i];
                if (!fixed || fixed === segments[i].text) continue;
                var before = (segments[i].words || []).length;
                segments[i].words = remapWords(segments[i], fixed);
                segments[i].text = fixed;
                changed++;
                if (segments[i].words.length === before) exactTiming++;
            }
            console.log("[refine] " + changed + "/" + segments.length +
                        " segments changed, " + exactTiming + " kept exact word timings");

            var refined = {};
            for (var k in summary) { if (summary.hasOwnProperty(k)) refined[k] = summary[k]; }
            refined.json = JSON.stringify(doc);
            cb(null, refined, { changed: changed, total: segments.length });
        }

        runBatch(0);
    };

    function el2(id) { return document.getElementById(id); }

    // Show only what applies: the mode row when refinement is on, the target
    // language only in translate mode, and only the selected provider's key field.
    window.efpSyncRefineUI = function() {
        var box = el2("cap-refine"), row = el2("cap-refine-row"), hint = el2("cap-refine-hint");
        var modeEl = el2("cap-refine-mode"), langEl = el2("cap-refine-lang");
        var on = !!(box && box.checked);
        if (row) row.style.display = on ? "flex" : "none";
        if (hint) hint.style.display = on ? "block" : "none";
        if (langEl) langEl.style.display = (on && modeEl && modeEl.value === "translate") ? "" : "none";

        var prov = el2("cfg-refine-provider");
        var pv = prov ? prov.value : (settings.refineProvider || "groq");
        var aRow = el2("cfg-anthropic-row"), oRow = el2("cfg-openai-row");
        if (aRow) aRow.style.display = (pv === "anthropic") ? "block" : "none";
        if (oRow) oRow.style.display = (pv === "openai") ? "block" : "none";
    };

    function initRefineUI() {
        var box = el2("cap-refine"), modeEl = el2("cap-refine-mode"), langEl = el2("cap-refine-lang");
        if (!box) return;

        box.checked = settings.refineEnabled === true;
        if (modeEl) modeEl.value = settings.refineMode || "fix";
        if (langEl) langEl.value = settings.refineLang || "English";

        box.addEventListener("change", function() {
            settings.refineEnabled = box.checked; saveSettings(); window.efpSyncRefineUI();
        });
        if (modeEl) modeEl.addEventListener("change", function() {
            settings.refineMode = modeEl.value; saveSettings(); window.efpSyncRefineUI();
        });
        if (langEl) langEl.addEventListener("change", function() {
            settings.refineLang = langEl.value; saveSettings();
        });
        var prov = el2("cfg-refine-provider");
        if (prov) prov.addEventListener("change", function() {
            settings.refineProvider = prov.value; saveSettings(); window.efpSyncRefineUI();
        });
        window.efpSyncRefineUI();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function() { setTimeout(initRefineUI, 350); });
    } else {
        setTimeout(initRefineUI, 350);
    }

    // Reads the panel controls; returns null when refinement is switched off.
    window.efpRefineOptions = function() {
        var box = document.getElementById("cap-refine");
        if (!box || !box.checked) return null;
        var modeEl = document.getElementById("cap-refine-mode");
        var langEl = document.getElementById("cap-refine-lang");
        var mode = modeEl ? modeEl.value : "fix";
        return {
            provider: settings.refineProvider || "groq",
            mode: mode,
            targetLang: (mode === "translate" && langEl) ? langEl.options[langEl.selectedIndex].text : ""
        };
    };
})();
