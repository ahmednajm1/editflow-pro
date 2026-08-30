// main.js - EditFlow Pro v17 — Production Build
// ES5 only. Direct csInterface.evalScript for ALL buttons.

// Global error boundary — prevents silent crashes
window.onerror = function(msg, url, line) {
    console.error("[EFP] Uncaught error:", msg, "at", url, "line", line);
    try { showStatus("An unexpected error occurred.", "red"); } catch(e) {}
    return true;
};

var CURRENT_VERSION = "1.3.32";
var csInterface = null, dsp = null;
var fsModule = null, osModule = null, pathModule = null, execModule = null, execFileModule = null, spawnModule = null;
var foundPresetPath = null, foundAudioPresetPaths = {mp3:null, wav:null}, extensionPath = "", configPath = "";
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
        highlight: "#1F8FFF",
        animated: false,
        animatedPreset: "clean-film",
        animatedUiVersion: 2,
        animatedFont: "",
        animatedSize: 100,
        animatedPosition: "preset",
        animatedBackgroundMode: "preset",
        animatedReview: false
    },
    captionQa: {
        lastSummaryPath: "",
        targetCode: "auto",
        style: "phrase",
        wordsMin: 3,
        wordsMax: 5,
        timelineOffset: 0
    },
    bitrate: 10,
    exportFormat: "video",
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
    dualSubtitle: false,
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
        sync_prep_title: "Sync Prep",
        sync_prep_desc: "Select the clips you want to sync. Each selected video/audio clip moves to its own lane at the same time.",
        sync_prep_select: "Select clips",
        sync_prep_separate: "Separate lanes",
        sync_prep_synchronize: "Synchronize",
        sync_prep_prepare: "Prepare Sync Lanes",
        sync_prep_undo: "Undo last prep",
        sync_prep_safe: "Only selected clips move. Nothing is trimmed, duplicated or deleted.",
        sync_prep_working: "Preparing separate sync lanes…",
        sync_prep_ready: "{video} video + {audio} audio lane(s) ready. Now use Premiere's Synchronize.",
        sync_prep_undo_done: "Restored {n} clip(s) to their original lanes.",
        paste_title: "Paste from Web",
        paste_desc: "Copy any image from a browser → click Paste. Added to your Project bin ready to drag in.",
        paste_btn: "Paste Image from Internet",
        export_title: "Export Engine",
        export_file: "File",
        export_file_ph: "sequence name",
        export_format: "Format",
        export_format_video: "Video · MP4",
        export_format_mp3: "Audio · MP3",
        export_format_wav: "Audio · WAV",
        export_audio_quality_mp3: "{bitrate} kbps · stereo",
        export_audio_quality_wav: "48 kHz · 16-bit",
        export_saveto: "Save to",
        export_browse: "Browse",
        export_selected: "Export Selected Clip",
        export_selected_audio: "Export Selected Audio",
        export_audio_preset_missing: "Adobe audio preset was not found. Repair or reinstall Premiere Pro, then try again.",
        export_capture: "📷 Capture Frame",
        captions_title: "Fast Captions",
        captions_desc: "Lightning-fast, studio-grade transcription. Auto-detect any language and get perfectly synced editable subtitles in seconds.",
        cap_generate: "⚡ Generate Editable Subtitles",
        cap_generate_animated: "✨ Generate Animated Captions",
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
        cap_refine_provider: "Engine",
        cap_refine: "Refine with a stronger AI",
        cap_dual: "Also add a second subtitle in",
        cap_refine_quota: "Free engine quota exceeded. Try Claude, or wait a minute.",
        cap_dual_working: "Translating a second subtitle ({lang})…",
        cap_dual_failed: "Second subtitle failed — only the main one was added.",
        cap_dual_track_hint: "Second subtitle needs a 2nd caption track in your sequence.",
        cap_refine_fix: "Fix errors and wording",
        cap_refine_translate: "Fix, then translate to…",
        cap_refine_hint: "Timings are preserved. Set the provider under Settings → Captions.",
        cap_animated: "Animated caption styles",
        cap_animated_note: "Renders a transparent overlay. Turn off for editable subtitles.",
        cap_animated_remove: "Remove generated animation",
        cap_choose_style: "Choose a style",
        cap_choose_style_hint: "Click once — the look is ready",
        cap_style_clean: "Clean Film",
        cap_style_pop: "TikTok Pop",
        cap_style_reels: "Reels Cyan",
        cap_style_box: "Yellow Box",
        cap_style_karaoke: "Karaoke Build",
        cap_style_focus: "One Word",
        cap_style_drop: "Drop Bounce",
        cap_style_neon: "Neon Glow",
        cap_customize: "Fine tune",
        cap_customize_hint: "Optional",
        cap_font: "Font",
        cap_font_preset: "Use preset font",
        cap_size: "Size",
        cap_position: "Position",
        cap_position_preset: "Preset position",
        cap_position_low: "Low",
        cap_position_middle: "Middle",
        cap_position_high: "High",
        cap_background: "Background",
        cap_background_preset: "Style default",
        cap_background_none: "None",
        cap_background_black: "Black box",
        cap_background_custom: "Custom",
        cap_text_color: "Text",
        cap_active_color: "Active word",
        cap_outline_color: "Outline",
        cap_background_color: "Background color",
        cap_background_opacity: "Background opacity",
        cap_review_before_render: "Review text before rendering",
        cap_editor_title: "Review animated captions",
        cap_editor_hint: "Timing is preserved. If the word count changes, timing is redistributed inside that caption.",
        cap_editor_render: "Apply edits & render",
        cap_editor_count: "{n} captions",
        cap_editor_empty: "Caption text cannot be empty.",
        cap_refine_working: "Refining the transcript…",
        cap_refine_done: "Refined {n} segments ✓",
        cap_refine_failed: "Refinement skipped — using the raw transcript.",
        cap_refine_err_key: "No API key for the selected refinement provider. Add it under Settings → Captions.",
        cap_qa_title: "Caption QA",
        cap_qa_local: "LOCAL",
        cap_qa_desc: "Scan the last generated captions for timing, readability, language and edit-boundary risks.",
        cap_qa_run: "Run Caption QA",
        cap_qa_note: "Local QA is instant and never edits your captions. Click a finding to jump to its time.",
        cap_qa_need_caption: "Generate captions first, then run Caption QA.",
        cap_qa_missing_file: "The last caption transcript is no longer available. Generate captions again, then run QA.",
        cap_qa_scanning: "Checking the final caption plan…",
        cap_qa_clean: "Looks clean",
        cap_qa_clean_detail: "{n} captions checked. No timing or readability risks found.",
        cap_qa_found: "{n} item(s) to review",
        cap_qa_error_count: "{n} critical",
        cap_qa_warning_count: "{n} warning",
        cap_qa_review_count: "{n} review",
        cap_qa_more: "+{n} more findings — refine the source or review nearby captions.",
        cap_qa_plan_failed: "Could not build a caption QA plan. Generate captions again, then retry.",
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
        cap_lang: "Spoken",
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
        cfg_download_path_ph: "Movies/EditFlow Downloads",
        cap_qa_title: "فحص الكابشنات",
        cap_qa_local: "محلي",
        cap_qa_desc: "يفحص آخر كابشنات مولدة بحثاً عن مخاطر التوقيت والقراءة واللغة وحدود القص.",
        cap_qa_run: "تشغيل فحص الكابشنات",
        cap_qa_note: "الفحص المحلي فوري ولا يغيّر كابشناتك. اضغط على الملاحظة للقفز إلى توقيتها.",
        cap_qa_need_caption: "أنشئ الكابشنات أولاً ثم شغّل الفحص.",
        cap_qa_missing_file: "ملف آخر ترجمة لم يعد متاحاً. أنشئ الكابشنات مجدداً ثم شغّل الفحص.",
        cap_qa_scanning: "يجري فحص خطة الكابشن النهائية…",
        cap_qa_clean: "النتيجة سليمة",
        cap_qa_clean_detail: "تم فحص {n} كابشن. لا توجد مخاطر توقيت أو قابلية قراءة.",
        cap_qa_found: "{n} ملاحظة للمراجعة",
        cap_qa_error_count: "{n} حرجة",
        cap_qa_warning_count: "{n} تحذير",
        cap_qa_review_count: "{n} للمراجعة",
        cap_qa_more: "+{n} ملاحظات إضافية — حسّن المصدر أو راجع الكابشنات القريبة.",
        cap_qa_plan_failed: "تعذّر بناء خطة فحص الكابشنات. أنشئ الكابشنات مجدداً ثم أعد المحاولة."
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
        sync_prep_title: "تجهيز المزامنة",
        sync_prep_desc: "حدّد المقاطع التي تريد مزامنتها. ينتقل كل فيديو أو صوت محدد إلى مسار مستقل مع بقاء توقيته كما هو.",
        sync_prep_select: "حدّد المقاطع",
        sync_prep_separate: "مسارات مستقلة",
        sync_prep_synchronize: "Synchronize",
        sync_prep_prepare: "تجهيز مسارات المزامنة",
        sync_prep_undo: "استرجاع آخر تجهيز",
        sync_prep_safe: "تتحرك المقاطع المحددة فقط. لا قصّ ولا نسخ ولا حذف.",
        sync_prep_working: "جارٍ تجهيز مسارات المزامنة…",
        sync_prep_ready: "أصبحت {video} فيديو و{audio} صوت في مسارات مستقلة. استخدم Synchronize من Premiere الآن.",
        sync_prep_undo_done: "تمت إعادة {n} مقطعاً إلى مساراته الأصلية.",
        paste_title: "لصق من الويب",
        paste_desc: "انسخ أي صورة من المتصفح → اضغط لصق. تضاف إلى ملفات المشروع جاهزة للسحب.",
        paste_btn: "لصق صورة من الإنترنت",
        export_title: "محرك التصدير",
        export_file: "الملف",
        export_file_ph: "اسم التسلسل",
        export_format: "الصيغة",
        export_format_video: "فيديو · MP4",
        export_format_mp3: "صوت · MP3",
        export_format_wav: "صوت · WAV",
        export_audio_quality_mp3: "{bitrate} kbps · ستيريو",
        export_audio_quality_wav: "48 kHz · 16-bit",
        export_saveto: "حفظ في",
        export_browse: "استعراض",
        export_selected: "تصدير المقطع المحدد",
        export_selected_audio: "تصدير صوت المقطع المحدد",
        export_audio_preset_missing: "تعذّر العثور على إعداد تصدير الصوت من Adobe. أصلح تثبيت Premiere Pro أو أعد تثبيته ثم حاول مجددًا.",
        export_capture: "📷 التقاط إطار",
        captions_title: "ترجمة سريعة",
        captions_desc: "تفريغ صوتي فائق السرعة بدقة استوديو احترافية. كشف تلقائي لأي لغة وترجمة متزامنة قابلة للتعديل في ثوانٍ.",
        cap_lang: "اللغة",
        cap_accuracy: "الدقة",
        cap_style: "النمط",
        cap_generate_srt: "⚡ إنشاء ترجمة قابلة للتعديل",
        cap_generate_animated: "✨ إنشاء كابشن متحرك",
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
        cap_refine_provider: "\u0627\u0644\u0645\u062d\u0631\u0643",
        cap_refine: "\u062a\u062d\u0633\u064a\u0646 \u0628\u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0623\u0642\u0648\u0649",
        cap_dual: "\u0623\u0636\u0641 \u062a\u0631\u062c\u0645\u0629 \u062b\u0627\u0646\u064a\u0629 \u0628\u0644\u063a\u0629",
        cap_refine_quota: "\u062a\u062c\u0627\u0648\u0632\u062a \u062d\u062f \u0627\u0644\u0645\u062d\u0631\u0643 \u0627\u0644\u0645\u062c\u0627\u0646\u064a. \u062c\u0631\u0651\u0628 Claude \u0623\u0648 \u0627\u0646\u062a\u0638\u0631 \u062f\u0642\u064a\u0642\u0629.",
        cap_dual_working: "\u062c\u0627\u0631\u064a \u062a\u0631\u062c\u0645\u0629 \u0627\u0644\u0637\u0628\u0642\u0629 \u0627\u0644\u062b\u0627\u0646\u064a\u0629 ({lang})\u2026",
        cap_dual_failed: "\u0641\u0634\u0644\u062a \u0627\u0644\u062a\u0631\u062c\u0645\u0629 \u0627\u0644\u062b\u0627\u0646\u064a\u0629 \u2014 \u0623\u064f\u0636\u064a\u0641\u062a \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629 \u0641\u0642\u0637.",
        cap_dual_track_hint: "\u0627\u0644\u062a\u0631\u062c\u0645\u0629 \u0627\u0644\u062b\u0627\u0646\u064a\u0629 \u062a\u062d\u062a\u0627\u062c \u0645\u0633\u0627\u0631 \u0643\u0627\u0628\u0634\u0646 \u062b\u0627\u0646\u064d \u0641\u064a \u0627\u0644\u0633\u064a\u0643\u0648\u064a\u0646\u0633.",
        cap_refine_fix: "\u062a\u0635\u062d\u064a\u062d \u0627\u0644\u0623\u062e\u0637\u0627\u0621 \u0648\u0627\u0644\u0635\u064a\u0627\u063a\u0629",
        cap_refine_translate: "\u062a\u0635\u062d\u064a\u062d \u062b\u0645 \u062a\u0631\u062c\u0645\u0629 \u0625\u0644\u0649\u2026",
        cap_refine_hint: "\u0627\u0644\u062a\u0648\u0642\u064a\u062a\u0627\u062a \u0645\u062d\u0641\u0648\u0638\u0629. \u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0632\u0648\u0651\u062f \u0645\u0646 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u2190 \u0627\u0644\u062a\u0631\u062c\u0645\u0629.",
        cap_animated: "\u0623\u0646\u0645\u0627\u0637 \u0643\u0627\u0628\u0634\u0646 \u0645\u062a\u062d\u0631\u0643",
        cap_animated_note: "\u064a\u0631\u0646\u062f\u0631 \u0637\u0628\u0642\u0629 \u0634\u0641\u0627\u0641\u0629. \u0623\u0648\u0642\u0641\u0647 \u0644\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u062a\u0631\u062c\u0645\u0629 \u0627\u0644\u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062a\u0639\u062f\u064a\u0644.",
        cap_animated_remove: "\u062d\u0630\u0641 \u0627\u0644\u0623\u0646\u064a\u0645\u0634\u0646 \u0627\u0644\u0645\u0648\u0644\u0651\u062f",
        cap_choose_style: "اختر الشكل",
        cap_choose_style_hint: "ضغطة واحدة والشكل جاهز",
        cap_style_clean: "وثائقي نظيف",
        cap_style_pop: "بوب تيك توك",
        cap_style_reels: "ريلز سماوي",
        cap_style_box: "مربع أصفر",
        cap_style_karaoke: "بناء كاريوكي",
        cap_style_focus: "كلمة واحدة",
        cap_style_drop: "نزول مرن",
        cap_style_neon: "نيون متوهج",
        cap_customize: "ضبط إضافي",
        cap_customize_hint: "اختياري",
        cap_font: "الخط",
        cap_font_preset: "استخدم خط النمط",
        cap_size: "الحجم",
        cap_position: "الموضع",
        cap_position_preset: "موضع النمط",
        cap_position_low: "أسفل",
        cap_position_middle: "الوسط",
        cap_position_high: "أعلى",
        cap_background: "الخلفية",
        cap_background_preset: "افتراضي للنمط",
        cap_background_none: "بدون",
        cap_background_black: "مربع أسود",
        cap_background_custom: "مخصصة",
        cap_text_color: "لون النص",
        cap_active_color: "الكلمة النشطة",
        cap_outline_color: "الحد الخارجي",
        cap_background_color: "لون الخلفية",
        cap_background_opacity: "شفافية الخلفية",
        cap_review_before_render: "مراجعة النص قبل الرندر",
        cap_editor_title: "مراجعة الكابشنات المتحركة",
        cap_editor_hint: "يُحفظ التوقيت. إذا تغير عدد الكلمات يُعاد توزيع التوقيت داخل الكابشن نفسه.",
        cap_editor_render: "تطبيق التعديلات والرندر",
        cap_editor_count: "{n} كابشن",
        cap_editor_empty: "لا يمكن ترك نص الكابشن فارغًا.",
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
        if (fsModule) { loadSettings(); findExportPreset(); findAudioExportPresets(); }
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
    // SYNC PREP — separate selected sources into clean lanes before
    // calling Premiere's native Synchronize command. The JSX route keeps
    // an undo manifest, so this panel control never strands an edit.
    // ============================================================
    (function() {
        var prepareBtn = document.getElementById("btn-sync-prep");
        var undoBtn = document.getElementById("btn-sync-prep-undo");
        var statusEl = document.getElementById("sync-prep-status");
        var busy = false;
        if (!prepareBtn || !undoBtn || !statusEl) return;

        function replaceTokens(text, values) {
            for (var key in values) {
                if (values.hasOwnProperty(key)) text = text.replace(new RegExp("\\{" + key + "\\}", "g"), values[key]);
            }
            return text;
        }
        function setSyncStatus(text, isError) {
            statusEl.textContent = text || "";
            statusEl.className = "sync-prep-status" + (isError ? " is-error" : "");
        }
        function setBusy(nextBusy) {
            busy = nextBusy;
            prepareBtn.disabled = nextBusy;
            prepareBtn.setAttribute("aria-busy", nextBusy ? "true" : "false");
            if (nextBusy) prepareBtn.classList.add("is-working");
            else prepareBtn.classList.remove("is-working");
        }
        function refreshUndoAvailability() {
            undoBtn.disabled = true;
            if (!csInterface) return;
            csInterface.evalScript('$._editflow.getSyncPrepUndoState()', function(raw) {
                var state = safeParse(raw);
                undoBtn.disabled = !(state && state.status === "success" && state.available);
            });
        }
        function run(method, isUndo) {
            if (busy || !csInterface) {
                if (!csInterface) setSyncStatus("Premiere connection is unavailable.", true);
                return;
            }
            setBusy(true);
            if (isUndo) {
                undoBtn.disabled = true;
                setSyncStatus("");
            } else {
                setSyncStatus(t_refine("sync_prep_working"));
            }
            csInterface.evalScript('$._editflow.' + method + '()', function(raw) {
                setBusy(false);
                var result = safeParse(raw);
                if (!result || result.status !== "success") {
                    setSyncStatus((result && result.message) || "Premiere could not prepare sync lanes.", true);
                    refreshUndoAvailability();
                    return;
                }
                var message;
                if (isUndo) {
                    message = replaceTokens(t_refine("sync_prep_undo_done"), {n: result.count || 0});
                    undoBtn.disabled = true;
                } else {
                    message = replaceTokens(t_refine("sync_prep_ready"), {
                        video: result.video || 0,
                        audio: result.audio || 0
                    });
                    undoBtn.disabled = false;
                }
                setSyncStatus(message, false);
                showStatus(message, "green");
            });
        }

        prepareBtn.addEventListener("click", function() { run("prepareSyncLanes", false); });
        undoBtn.addEventListener("click", function() { run("undoSyncLanes", true); });
        setTimeout(refreshUndoAvailability, 800);
    })();

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
        var animatedEnabled = !!(document.getElementById("cap-animated") || {}).checked;
        var animatedPreset = (document.getElementById("cap-animated-preset") || {value:"clean-film"}).value || "clean-film";
        var animatedOptions = animatedCaptionOptionsFromUI();
        var wordsMin = parseInt((document.getElementById("cap-words-per") || {value: "3"}).value, 10) || 3;
        var wordsMax = parseInt((document.getElementById("cap-words-max") || {value: "5"}).value, 10) || 5;
        if (wordsMin < 1) wordsMin = 1;
        if (wordsMax < wordsMin) wordsMax = wordsMin; // guard: max never below min
        if (wordsMax > 15) wordsMax = 15;
        // Persist the chosen range so it survives panel reloads.
        settings.captions.wordsMin = wordsMin;
        settings.captions.wordsMax = wordsMax;
        settings.captions.wordsPerCaption = wordsMin; // back-compat mirror
        settings.captions.language = lang;
        settings.captions.model = model;
        settings.captions.style = style;
        settings.captions.animated = animatedEnabled;
        settings.captions.animatedPreset = animatedPreset;
        settings.captions.animatedUiVersion = 2;
        settings.captions.animatedFont = animatedOptions.font;
        settings.captions.animatedSize = animatedOptions.size;
        settings.captions.animatedPosition = animatedOptions.position;
        settings.captions.animatedBackgroundMode = animatedOptions.backgroundMode;
        settings.captions.animatedReview = animatedOptions.review;
        saveSettings();
        var wordsPerCaption = wordsMin; // legacy var still used by jsTranscribe fallback path

        var statusLine = document.getElementById("cap-status");
        function setStatus(t) { if (statusLine) statusLine.textContent = t; }

        function jsxArg(value) {
            return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        }

        function ensureLocalDir(dir) {
            if (!dir || fsModule.existsSync(dir)) return;
            var parent = pathModule.dirname(dir);
            if (parent && parent !== dir) ensureLocalDir(parent);
            try { fsModule.mkdirSync(dir); } catch(e) {
                if (!fsModule.existsSync(dir)) throw e;
            }
        }

        function removeDirFiles(dir) {
            try {
                var names = fsModule.readdirSync(dir);
                for (var i = 0; i < names.length; i++) {
                    try { fsModule.unlinkSync(pathModule.join(dir, names[i])); } catch(eFile) {}
                }
                try { fsModule.rmdirSync(dir); } catch(eDir) {}
            } catch(e) {}
        }

        function clamp01(v) { return Math.max(0, Math.min(1, v)); }
        function padInt(v, width) {
            var out = String(v);
            while (out.length < width) out = "0" + out;
            return out;
        }
        function easeOutCubic(v) { v = clamp01(v); return 1 - Math.pow(1 - v, 3); }
        function easeOutBack(v) {
            v = clamp01(v);
            var c1 = 1.70158, c3 = c1 + 1;
            return 1 + c3 * Math.pow(v - 1, 3) + c1 * Math.pow(v - 1, 2);
        }
        function containsArabic(text) { return /[\u0600-\u06FF]/.test(text || ""); }

        function captionPreset(id, custom) {
            var all = {
                "clean-film": {
                    font: "Helvetica Neue", weight: 700, fill: "#FFFFFF", active: "#FFFFFF",
                    stroke: "#080808", strokeWidth: 5, shadow: "rgba(0,0,0,.52)",
                    animation: "fade", background: null, highlight: false,
                    sizeScale: 0.82, position: "low"
                },
                "viral-pop": {
                    font: "Arial Black", weight: 900, fill: "#FFFFFF", active: "#FFD43B",
                    stroke: "#080808", strokeWidth: 9, shadow: "rgba(0,0,0,.55)",
                    animation: "pop", background: null, sizeScale: 1, position: "low"
                },
                "reels-cyan": {
                    font: "Arial", weight: 900, fill: "#FFFFFF", active: "#26E6FF",
                    stroke: "#071014", strokeWidth: 8, shadow: "rgba(0,0,0,.58)",
                    animation: "slide", background: null, sizeScale: 0.94, position: "low"
                },
                "yellow-box": {
                    font: "Arial Black", weight: 900, fill: "#FFFFFF", active: "#111111",
                    stroke: "#070707", strokeWidth: 8, shadow: "rgba(0,0,0,.54)",
                    animation: "punch", background: null, activeBox: "#FFD83D",
                    sizeScale: 0.96, position: "low"
                },
                "karaoke-build": {
                    font: "Arial", weight: 800, fill: "#FFFFFF", active: "#43F58A",
                    stroke: "#07100A", strokeWidth: 7, shadow: "rgba(0,0,0,.56)",
                    animation: "fade", background: "rgba(0,0,0,.28)", revealMode: "build",
                    sizeScale: 0.92, position: "low"
                },
                "focus-word": {
                    font: "Arial Black", weight: 900, fill: "#FFFFFF", active: "#FFFFFF",
                    stroke: "#070707", strokeWidth: 10, shadow: "rgba(0,0,0,.62)",
                    animation: "focus", background: null, singleWord: true,
                    sizeScale: 1.30, position: "middle"
                },
                "drop-bounce": {
                    font: "Arial", weight: 900, fill: "#FFFFFF", active: "#64FF9E",
                    stroke: "#070707", strokeWidth: 8, shadow: "rgba(0,0,0,.58)",
                    animation: "drop", background: "rgba(0,0,0,.34)",
                    sizeScale: 0.95, position: "low"
                },
                "neon-karaoke": {
                    font: "Arial", weight: 800, fill: "#F7FAFF", active: "#5CF2FF",
                    stroke: "#071014", strokeWidth: 7, shadow: "rgba(92,242,255,.70)",
                    animation: "neon", background: "rgba(2,10,14,.50)",
                    sizeScale: 0.94, position: "low"
                }
            };
            var source = all[id] || all["clean-film"];
            var preset = {};
            for (var key in source) if (source.hasOwnProperty(key)) preset[key] = source[key];
            custom = custom || {};
            var customFont = String(custom.font || "").replace(/[\r\n'\\]/g, "").slice(0, 80);
            preset.font = customFont || preset.font || "Arial";
            preset.fontCss = "'" + preset.font + "', sans-serif";
            preset.sizeScale = (preset.sizeScale || 1) * Math.max(0.6, Math.min(1.5, (Number(custom.size) || 100) / 100));
            if (custom.position && custom.position !== "preset") preset.position = custom.position;
            if (custom.backgroundMode === "none") preset.background = null;
            else if (custom.backgroundMode === "black") preset.background = "rgba(0,0,0,.58)";
            return preset;
        }

        // Frame renderer shared by the live visual style and the exported MOV.
        // It is deterministic: frame time alone controls every transform, so the
        // same transcript always renders exactly the same animation.
        function drawAnimatedCaptionFrame(canvas, group, elapsed, presetId, custom) {
            var ctx = canvas.getContext("2d", {alpha:true});
            var width = canvas.width, height = canvas.height;
            var preset = captionPreset(presetId, custom);
            var duration = Math.max(0.25, group.end - group.start);
            var sourceWords = (group.words || []).slice(0);
            if (!sourceWords.length) {
                var pieces = String(group.text || "").split(/\s+/);
                var per = duration / Math.max(1, pieces.length);
                for (var pi = 0; pi < pieces.length; pi++) {
                    sourceWords.push({text:pieces[pi], start:group.start + pi * per, end:group.start + (pi + 1) * per});
                }
            }

            var absoluteTime = group.start + elapsed;
            var activeIndex = 0;
            for (var aw = 0; aw < sourceWords.length; aw++) {
                if (absoluteTime >= sourceWords[aw].start) activeIndex = aw;
                if (absoluteTime >= sourceWords[aw].start && absoluteTime < sourceWords[aw].end) {
                    activeIndex = aw;
                    break;
                }
            }
            var words = sourceWords;
            if (preset.singleWord) {
                words = [sourceWords[Math.max(0, Math.min(sourceWords.length - 1, activeIndex))]];
                activeIndex = 0;
            } else if (preset.revealMode === "build") {
                words = sourceWords.slice(0, activeIndex + 1);
                activeIndex = words.length - 1;
            }

            ctx.clearRect(0, 0, width, height);
            var entry = easeOutBack(elapsed / 0.24);
            var entrySmooth = easeOutCubic(elapsed / 0.24);
            var exit = easeOutCubic((duration - elapsed) / 0.14);
            var opacity = Math.min(clamp01(elapsed / 0.09), exit);
            var scale = 1, yOffset = 0;
            if (preset.animation === "pop") scale = 0.68 + 0.32 * entry;
            if (preset.animation === "drop") yOffset = -72 * (1 - entry);
            if (preset.animation === "fade") yOffset = 12 * (1 - entrySmooth);
            if (preset.animation === "slide") yOffset = 30 * (1 - entrySmooth);
            if (preset.animation === "punch") scale = 0.90 + 0.10 * entrySmooth;
            if (preset.animation === "focus") scale = 0.84 + 0.16 * entrySmooth;
            if (preset.animation === "neon") {
                scale = 0.94 + 0.06 * easeOutCubic(elapsed / 0.20);
                yOffset = 18 * (1 - easeOutCubic(elapsed / 0.20));
            }

            var fontSize = Math.round(Math.max(32, Math.min(width * 0.072, height * 0.088) * preset.sizeScale));
            var maxWidth = width * 0.86;
            var lines = null;
            function makeLines(size) {
                ctx.font = preset.weight + " " + size + "px " + preset.fontCss;
                var out = [], current = [], currentWidth = 0;
                var space = ctx.measureText(" ").width;
                for (var wi = 0; wi < words.length; wi++) {
                    var wordWidth = ctx.measureText(words[wi].text).width;
                    if (current.length && currentWidth + space + wordWidth > maxWidth) {
                        out.push({words:current, width:currentWidth});
                        current = []; currentWidth = 0;
                    }
                    if (current.length) currentWidth += space;
                    current.push({word:words[wi], width:wordWidth});
                    currentWidth += wordWidth;
                }
                if (current.length) out.push({words:current, width:currentWidth});
                return out;
            }
            lines = makeLines(fontSize);
            while (lines.length > 2 && fontSize > 42) {
                fontSize -= 4;
                lines = makeLines(fontSize);
            }

            var lineGap = Math.round(fontSize * 1.22);
            var positionRatio = preset.position === "high" ? 0.48 : (preset.position === "middle" ? 0.66 : (height > width ? 0.76 : 0.82));
            var centerY = Math.round(height * positionRatio);
            var blockHeight = Math.max(fontSize, lines.length * lineGap);
            var blockTop = centerY - blockHeight / 2;
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.translate(width / 2, centerY + yOffset);
            ctx.scale(scale, scale);
            ctx.translate(-width / 2, -centerY);

            if (preset.background) {
                var widest = 0;
                for (var li0 = 0; li0 < lines.length; li0++) widest = Math.max(widest, lines[li0].width);
                var padX = fontSize * 0.28, padY = fontSize * 0.18;
                var bx = width / 2 - widest / 2 - padX;
                var by = blockTop - padY;
                var bw = widest + padX * 2, bh = blockHeight + padY * 2;
                var radius = fontSize * 0.20;
                ctx.beginPath();
                ctx.moveTo(bx + radius, by);
                ctx.lineTo(bx + bw - radius, by);
                ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + radius);
                ctx.lineTo(bx + bw, by + bh - radius);
                ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - radius, by + bh);
                ctx.lineTo(bx + radius, by + bh);
                ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - radius);
                ctx.lineTo(bx, by + radius);
                ctx.quadraticCurveTo(bx, by, bx + radius, by);
                ctx.closePath();
                ctx.fillStyle = preset.background;
                ctx.fill();
            }

            ctx.font = preset.weight + " " + fontSize + "px " + preset.fontCss;
            ctx.textBaseline = "middle";
            ctx.textAlign = "left";
            ctx.lineJoin = "round";
            var wordCounter = 0;
            var rtl = containsArabic(group.text);
            for (var li = 0; li < lines.length; li++) {
                var line = lines[li];
                var x = rtl ? width / 2 + line.width / 2 : width / 2 - line.width / 2;
                var y = blockTop + fontSize / 2 + li * lineGap;
                var spaceWidth = ctx.measureText(" ").width;
                for (var lw = 0; lw < line.words.length; lw++, wordCounter++) {
                    var info = line.words[lw];
                    if (rtl) x -= info.width;
                    var active = preset.highlight !== false && wordCounter === activeIndex;
                    var wordScale = 1;
                    if (active && (preset.animation === "pop" || preset.animation === "drop" || preset.animation === "punch")) {
                        var wDur = Math.max(0.05, info.word.end - info.word.start);
                        var wProg = clamp01((absoluteTime - info.word.start) / Math.min(0.16, wDur));
                        wordScale = 0.78 + 0.22 * easeOutBack(wProg);
                    }
                    ctx.save();
                    if (wordScale !== 1) {
                        ctx.translate(x + info.width / 2, y);
                        ctx.scale(wordScale, wordScale);
                        ctx.translate(-(x + info.width / 2), -y);
                    }
                    if (active && preset.activeBox) {
                        var activePadX = fontSize * 0.13;
                        var activePadY = fontSize * 0.10;
                        var activeRadius = fontSize * 0.10;
                        var ax = x - activePadX;
                        var ay = y - fontSize * 0.52 - activePadY;
                        var awidth = info.width + activePadX * 2;
                        var aheight = fontSize * 1.04 + activePadY * 2;
                        ctx.beginPath();
                        ctx.moveTo(ax + activeRadius, ay);
                        ctx.lineTo(ax + awidth - activeRadius, ay);
                        ctx.quadraticCurveTo(ax + awidth, ay, ax + awidth, ay + activeRadius);
                        ctx.lineTo(ax + awidth, ay + aheight - activeRadius);
                        ctx.quadraticCurveTo(ax + awidth, ay + aheight, ax + awidth - activeRadius, ay + aheight);
                        ctx.lineTo(ax + activeRadius, ay + aheight);
                        ctx.quadraticCurveTo(ax, ay + aheight, ax, ay + aheight - activeRadius);
                        ctx.lineTo(ax, ay + activeRadius);
                        ctx.quadraticCurveTo(ax, ay, ax + activeRadius, ay);
                        ctx.closePath();
                        ctx.fillStyle = preset.activeBox;
                        ctx.shadowColor = "rgba(0,0,0,.38)";
                        ctx.shadowBlur = 8;
                        ctx.shadowOffsetY = 3;
                        ctx.fill();
                    }
                    ctx.shadowColor = active ? preset.shadow : "rgba(0,0,0,.48)";
                    ctx.shadowBlur = (preset.animation === "neon" && active) ? 22 : 10;
                    ctx.shadowOffsetY = 3;
                    ctx.strokeStyle = preset.stroke;
                    ctx.lineWidth = preset.strokeWidth * 2;
                    if (!(active && preset.activeBox)) ctx.strokeText(info.word.text, x, y);
                    ctx.shadowBlur = (preset.animation === "neon" && active) ? 18 : 5;
                    ctx.fillStyle = active ? preset.active : preset.fill;
                    ctx.fillText(info.word.text, x, y);
                    ctx.restore();
                    if (rtl) x -= spaceWidth;
                    else x += info.width + spaceWidth;
                }
            }
            ctx.restore();
        }

        function renderAnimatedCaptions(summary, timelineStart) {
            showProgress("Preparing animated caption plan…", 76, true);
            setStatus("Building CapCut-style animation plan…");
            var planPath = pathModule.join(osModule.tmpdir(), "efp_anim_plan_" + Date.now() + ".json");
            var planCfg = {
                style: style,
                animation: animatedPreset,
                offsetSecs: timelineStart,
                wordsPerCaption: wordsPerCaption,
                wordsMin: wordsMin,
                wordsMax: wordsMax,
                planOnly: true,
                planPath: planPath
            };
            var planCfgEsc = jsxArg(JSON.stringify(planCfg));
            csInterface.evalScript(
                '$._editflow.placeAnimatedCaptions("' + jsxArg(summary.json) + '","' + planCfgEsc + '")',
                function(planRes) {
                    var planResult = safeParse(planRes);
                    if (!planResult || planResult.status !== "success" || !planResult.plan) {
                        hideProgress();
                        showStatus("Animated captions could not build a timing plan. Editable captions were used instead.", "orange");
                        return fallbackSRT(summary, style, "none", "Arial", 72, "#FFFFFF", "#FFFFFF", timelineStart, setStatus, wordsPerCaption, wordsMin, wordsMax);
                    }
                    var plan;
                    try { plan = JSON.parse(fsModule.readFileSync(planResult.plan, "utf8")); }
                    catch(ePlanRead) {
                        hideProgress();
                        showStatus("Could not read the animation plan. Editable captions were used instead.", "orange");
                        return fallbackSRT(summary, style, "none", "Arial", 72, "#FFFFFF", "#FFFFFF", timelineStart, setStatus, wordsPerCaption, wordsMin, wordsMax);
                    }
                    var groups = plan.groups || [];
                    if (!groups.length) {
                        hideProgress();
                        showStatus("No animated caption groups were produced.", "red");
                        return;
                    }

                    function beginAnimatedRender(reviewedGroups) {
                    groups = reviewedGroups || groups;
                    showProgress("Preparing animated caption render…", 78, true);
                    csInterface.evalScript('$._editflow.getSequenceInfo()', function(seqRaw) {
                        var seqInfo = safeParse(seqRaw) || {};
                        var frameW = parseInt(seqInfo.width, 10) || 1920;
                        var frameH = parseInt(seqInfo.height, 10) || 1080;
                        var fps = 30;
                        ensureFFmpegGlobal(function(msg, pct) {
                            showProgress(msg, Math.min(80, pct), true);
                        }, function(ffErr, ffmpegBin) {
                            if (ffErr) {
                                hideProgress();
                                showStatus("Animated captions need FFmpeg. Editable captions were used instead.", "orange");
                                return fallbackSRT(summary, style, "none", "Arial", 72, "#FFFFFF", "#FFFFFF", timelineStart, setStatus, wordsPerCaption, wordsMin, wordsMax);
                            }
                            var runId = String(Date.now());
                            var baseRoot = pathModule.join(pathModule.dirname(configPath || summary.json), "animated_captions");
                            var outputDir = pathModule.join(baseRoot, "run_" + runId);
                            try { ensureLocalDir(outputDir); }
                            catch(eDir) {
                                hideProgress();
                                showStatus("Could not create the animation output folder: " + eDir.message, "red");
                                return;
                            }
                            var canvas = document.createElement("canvas");
                            canvas.width = frameW;
                            canvas.height = frameH;
                            var clips = [];
                            var index = 0;

                            function failRender(message) {
                                hideProgress();
                                activeCaptionProcess = null;
                                setStatus("Animated render stopped.");
                                showStatus(message, "red");
                            }

                            function renderNext() {
                                if (index >= groups.length) {
                                    var manifestPath = pathModule.join(outputDir, "manifest.json");
                                    var manifest = {
                                        version: 1,
                                        animation: animatedPreset,
                                        font: animatedOptions.font,
                                        appearance: animatedOptions,
                                        clips: clips
                                    };
                                    fsModule.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
                                    showProgress("Placing animated captions on timeline…", 96, true);
                                    setStatus("Importing " + clips.length + " transparent animation clips…");
                                    csInterface.evalScript(
                                        '$._editflow.placeRenderedCaptions("' + jsxArg(manifestPath) + '","{}")',
                                        function(placeRes) {
                                            showProgress("Done!", 100);
                                            setTimeout(hideProgress, 2200);
                                            var placed = safeParse(placeRes);
                                            handleJSXResult(placeRes);
                                            if (placed && placed.status === "success" && placed.placed > 0) {
                                                setStatus("✅ " + placed.placed + " animated captions · " + animatedPreset + " · removable anytime");
                                            } else {
                                                setStatus("Animated clips rendered, but Premiere could not place them automatically.");
                                                showStatus((placed && placed.message) || "Add an empty video track and try again.", "orange");
                                            }
                                        }
                                    );
                                    return;
                                }

                                var group = groups[index];
                                var duration = Math.max(0.25, Math.min(15, group.end - group.start));
                                // Floor to the frame grid so the encoded MOV can
                                // never extend into the next caption by a rounded-up
                                // frame and trigger Premiere's insert/split behaviour.
                                var frameCount = Math.max(2, Math.floor(duration * fps + 0.000001));
                                var frameDir = pathModule.join(outputDir, "frames_" + String(index));
                                ensureLocalDir(frameDir);
                                for (var frame = 0; frame < frameCount; frame++) {
                                    var elapsed = Math.min(duration, frame / fps);
                                    drawAnimatedCaptionFrame(canvas, group, elapsed, animatedPreset, animatedOptions);
                                    var png = canvas.toDataURL("image/png").split(",")[1];
                                    var frameName = "frame_" + padInt(frame, 5) + ".png";
                                    fsModule.writeFileSync(pathModule.join(frameDir, frameName), Buffer.from(png, "base64"));
                                }
                                var movName = "efp_anim_" + runId + "_" + padInt(index, 4) + ".mov";
                                var movPath = pathModule.join(outputDir, movName);
                                var inputPattern = pathModule.join(frameDir, "frame_%05d.png");
                                var ffArgs = ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(fps), "-i", inputPattern,
                                              "-c:v", "qtrle", "-pix_fmt", "argb", "-an", movPath];
                                var pct = 80 + Math.round((index / groups.length) * 15);
                                showProgress("Rendering animated caption " + (index + 1) + "/" + groups.length + "…", pct, true);
                                setStatus("Rendering " + animatedPreset + " · " + (index + 1) + "/" + groups.length);
                                activeCaptionProcess = execFileModule(ffmpegBin, ffArgs, {timeout:180000, maxBuffer:8 * 1024 * 1024}, function(encErr) {
                                    activeCaptionProcess = null;
                                    removeDirFiles(frameDir);
                                    if (encErr || !fsModule.existsSync(movPath)) {
                                        return failRender("FFmpeg could not encode animated caption " + (index + 1) + ": " + ((encErr && encErr.message) || "unknown error"));
                                    }
                                    clips.push({path:movPath, start:group.start, end:group.end});
                                    index++;
                                    setTimeout(renderNext, 0);
                                });
                            }
                            renderNext();
                        });
                    });
                    }

                    if (animatedOptions.review) {
                        hideProgress();
                        setStatus("Review caption text, then apply edits to render.");
                        reviewAnimatedCaptionGroups(groups, function(reviewedGroups) {
                            if (!reviewedGroups) {
                                hideProgress();
                                setStatus("Animated caption render cancelled. No timeline clips were changed.");
                                return;
                            }
                            beginAnimatedRender(reviewedGroups);
                        });
                    } else {
                        beginAnimatedRender(groups);
                    }
                }
            );
        }

        function rememberCaptionQaSource(summary, timelineStart) {
            if (!summary || !summary.json) return;
            var mapped = false;
            try {
                if (fsModule && fsModule.existsSync(summary.json)) {
                    mapped = !!(JSON.parse(fsModule.readFileSync(summary.json, "utf8")) || {}).timelineMapped;
                }
            } catch(eRead) {
                console.warn("[Caption QA] could not inspect summary metadata:", eRead.message);
            }
            settings.captionQa = {
                lastSummaryPath: String(summary.json),
                targetCode: String(summary.requestedLang || settings.captions.language || "auto"),
                style: String(style || settings.captions.style || "phrase"),
                wordsMin: parseInt(wordsMin, 10) || 3,
                wordsMax: parseInt(wordsMax, 10) || 5,
                // A multi-clip transcript has already been restored to absolute
                // timeline seconds. A single source remains relative to its clip.
                timelineOffset: mapped ? 0 : (parseFloat(timelineStart) || 0)
            };
            saveSettings();
        }

        function placeCaptionResult(summary, timelineStart) {
            // Remember the final (possibly AI-refined) transcript, not Whisper's
            // raw result, so QA always reviews precisely what reaches Premiere.
            rememberCaptionQaSource(summary, timelineStart);
            if (animatedEnabled) return renderAnimatedCaptions(summary, timelineStart);
            return fallbackSRT(summary, style, "none", "Arial", 72, "#FFFFFF", "#FFFFFF", timelineStart, setStatus, wordsPerCaption, wordsMin, wordsMax);
        }

        // Optional AI refinement between transcription and placement. Failures here
        // are non-fatal by design: the user still gets the raw Whisper captions.
        // Maps the panel's language codes to the names the refinement prompt uses.
        // Whisper's full language set — the Spoken dropdown, the mismatch rule and
        // the no-op guard all resolve codes through this one table, so a language
        // missing here silently loses translation support.
        var LANG_CODE_TO_NAME = {
            af: "Afrikaans", am: "Amharic", ar: "Arabic", as: "Assamese", az: "Azerbaijani",
            ba: "Bashkir", be: "Belarusian", bg: "Bulgarian", bn: "Bengali", bo: "Tibetan",
            br: "Breton", bs: "Bosnian", ca: "Catalan", cs: "Czech", cy: "Welsh",
            da: "Danish", de: "German", el: "Greek", en: "English", es: "Spanish",
            et: "Estonian", eu: "Basque", fa: "Persian", fi: "Finnish", fo: "Faroese",
            fr: "French", gl: "Galician", gu: "Gujarati", ha: "Hausa", haw: "Hawaiian",
            he: "Hebrew", hi: "Hindi", hr: "Croatian", ht: "Haitian creole", hu: "Hungarian",
            hy: "Armenian", id: "Indonesian", is: "Icelandic", it: "Italian", ja: "Japanese",
            jw: "Javanese", ka: "Georgian", kk: "Kazakh", km: "Khmer", kn: "Kannada",
            ko: "Korean", la: "Latin", lb: "Luxembourgish", ln: "Lingala", lo: "Lao",
            lt: "Lithuanian", lv: "Latvian", mg: "Malagasy", mi: "Maori", mk: "Macedonian",
            ml: "Malayalam", mn: "Mongolian", mr: "Marathi", ms: "Malay", mt: "Maltese",
            my: "Myanmar", ne: "Nepali", nl: "Dutch", nn: "Nynorsk", no: "Norwegian",
            oc: "Occitan", pa: "Punjabi", pl: "Polish", ps: "Pashto", pt: "Portuguese",
            ro: "Romanian", ru: "Russian", sa: "Sanskrit", sd: "Sindhi", si: "Sinhala",
            sk: "Slovak", sl: "Slovenian", sn: "Shona", so: "Somali", sq: "Albanian",
            sr: "Serbian", su: "Sundanese", sv: "Swedish", sw: "Swahili", ta: "Tamil",
            te: "Telugu", tg: "Tajik", th: "Thai", tk: "Turkmen", tl: "Tagalog",
            tr: "Turkish", tt: "Tatar", uk: "Ukrainian", ur: "Urdu", uz: "Uzbek",
            vi: "Vietnamese", yi: "Yiddish", yo: "Yoruba", zh: "Chinese"
        };

        // Reverse lookup, built once. Whisper reports the spoken language as a NAME
        // ("Arabic"); every decision here is made on CODES. Without this map a run
        // where the language probe came back inconclusive had no spoken language at
        // all, so the translate rule could never fire.
        var LANG_NAME_TO_CODE = (function() {
            var m = {};
            for (var c in LANG_CODE_TO_NAME) {
                if (LANG_CODE_TO_NAME.hasOwnProperty(c)) {
                    m[LANG_CODE_TO_NAME[c].toLowerCase()] = c;
                }
            }
            return m;
        })();

        function withRefinement(summary, setStatus, next, placementOffset) {
            // Refinement is an optional enhancement: every step is guarded so a bug
            // in here can never strand the user on a frozen progress bar. A thrown
            // error once killed the whole chain silently (the callback that places
            // captions simply never ran) — always fall through to `next`.
            window._efpRefineError = null;
            var opts = null;
            try {
                opts = (typeof window.efpRefineOptions === "function") ? window.efpRefineOptions() : null;
            } catch (eOpts) {
                console.error("[refine] reading options failed: " + eOpts.message);
                return next(summary);
            }
            if (!opts) {
                console.log("[refine] SKIP: opts null (checkbox off?)");
                return next(summary);
            }
            if (typeof window.efpRefineCaptions !== "function") {
                console.log("[refine] SKIP: module missing");
                return next(summary);
            }

            // The spoken language differed from the one the user picked. They chose it
            // for a reason: honour that as a translation target rather than silently
            // handing back the spoken language, which reads as the setting being
            // ignored. An explicit "Translate into" choice still wins.
            // ── One rule decides the output language ──────────────────────────
            // "Spoken" doubles as the output choice: pick the language actually
            // being spoken and you get a clean transcript; pick a different one and
            // you get a translation into it. An explicit "Translate the subtitle
            // into" always wins over both.
            //
            // The spoken language must come from the DETECTED value, never from
            // summary.language: when a language is forced, summary.language echoes
            // that choice back, so comparing against it is circular and silently
            // cancels the very translation the user asked for.
            var spokenCode = summary.detectedLang ||
                             (summary.langMismatch && summary.langMismatch.detected) || "";
            var requestedCode = summary.requestedLang ||
                                (summary.langMismatch && summary.langMismatch.requested) || "";

            // Last resort for the spoken language: the name Whisper itself reported.
            // Only safe when there is no detected code, because that state means the
            // probe was inconclusive and the transcriber fell back to auto-detect —
            // so summary.language is a genuine detection, not the forced choice being
            // echoed back. With a detected code present we never look at it.
            if (!spokenCode && summary.language) {
                spokenCode = LANG_NAME_TO_CODE[String(summary.language).toLowerCase()] || "";
                if (spokenCode) console.log("[refine] spoken language taken from Whisper's own report: " + summary.language + " → " + spokenCode);
            }
            console.log("[refine] spoken=" + (spokenCode || "?") + " requested=" + (requestedCode || "?") +
                        " reported=" + (summary.language || "?"));

            if (!opts.targetLang && spokenCode && requestedCode &&
                requestedCode !== "auto" && requestedCode !== spokenCode) {
                var wantName = LANG_CODE_TO_NAME[requestedCode];
                if (wantName) {
                    opts.mode = "translate";
                    opts.targetLang = wantName;
                    console.log("[refine] spoken=" + spokenCode + " requested=" + requestedCode +
                                " → translating to " + wantName);
                }
            }

            // Translating into the language already spoken is a no-op that burns a
            // pass and returns the text unchanged. Compare against the detected
            // language only — it is the one value that is never echoed back.
            if (opts.targetLang && spokenCode) {
                var spokenName = LANG_CODE_TO_NAME[spokenCode];
                if (spokenName && spokenName.toLowerCase() === opts.targetLang.toLowerCase()) {
                    console.log("[refine] target equals the spoken language — correcting only");
                    opts.mode = "fix";
                    opts.targetLang = "";
                }
            }
            if (opts.secondLang && spokenCode) {
                var spokenName2 = LANG_CODE_TO_NAME[spokenCode];
                if (spokenName2 && spokenName2.toLowerCase() === opts.secondLang.toLowerCase()) {
                    console.log("[refine] second layer equals the spoken language — skipping it");
                    opts.secondLang = "";
                }
            }

            var handedOff = false;
            function proceed(s2) {
                if (handedOff) return;   // guard against a double callback
                handedOff = true;
                next(s2 || summary);
            }

            function report(stats) {
                if (!stats) return;
                var line = t_refine("cap_refine_done").replace("{n}", stats.changed) + " · " + stats.provider;
                // Say so when part of the transcript was left alone. Silence here is
                // what made half-translated subtitles look like a working run.
                if (stats.untouched) {
                    line += "  ⚠ " + stats.untouched + " segment(s) left unchanged";
                    window._efpRefineError = stats.untouched + " segment(s) could not be refined — try the Claude engine";
                }
                setStatus(line);
                console.log("[refine] provider used: " + stats.provider);
            }

            showProgress(t_refine("cap_refine_working"), 78, false);
            setStatus(t_refine("cap_refine_working"));
            try {
                // Pass 1 — correct the transcript in its original language.
                window.efpRefineCaptions(summary, opts,
                    function(doneN, totalN, note) {
                        var pct = 78 + Math.round((doneN / Math.max(totalN, 1)) * 3);
                        var label = t_refine("cap_refine_working") + "  " + doneN + "/" + totalN +
                                    (note ? " · " + note : "");
                        showProgress(label, pct, false);
                        setStatus(label);
                    },
                    function(err, result, stats) {
                        // showStatus's banner clears itself after 5 seconds, and
                        // placing captions takes far longer than that — every
                        // refinement failure so far was wiped off screen before the
                        // user could read it, and the run ended on a green success
                        // line. Record it so the FINAL status line has to carry it.
                        window._efpRefineError = err || null;
                        if (err === "missing_key") {
                            showStatus(t_refine("cap_refine_err_key"), "orange");
                        } else if (err && err.indexOf("RATE_LIMIT:") === 0) {
                            console.error("[refine] " + err);
                            showStatus(t_refine("cap_refine_quota"), "orange");
                        } else if (err) {
                            console.error("[refine] " + err);
                            showStatus(t_refine("cap_refine_failed") + " " + err, "orange");
                        } else {
                            report(stats);
                        }
                        var corrected = result || summary;

                        // Pass 2 — a SECOND subtitle in another language, placed on
                        // its own caption track so both appear stacked. Built from
                        // the corrected text, so the translation inherits the fixes.
                        if (!opts.secondLang) return proceed(corrected);

                        showProgress(t_refine("cap_dual_working").replace("{lang}", opts.secondLang), 82, false);
                        setStatus(t_refine("cap_dual_working").replace("{lang}", opts.secondLang));
                        window.efpRefineCaptions(corrected,
                            { provider: opts.provider, mode: "translate", targetLang: opts.secondLang },
                            function() {},
                            function(err2, translated, stats2) {
                                if (err2 || !translated) {
                                    console.error("[refine] second subtitle failed: " + err2);
                                    showStatus(t_refine("cap_dual_failed"), "orange");
                                    return proceed(corrected);
                                }
                                // Place the translation on caption track 2 first, then
                                // hand the original back so it lands on track 1.
                                placeSecondSubtitle(translated, opts.secondLang, placementOffset, function() {
                                    proceed(corrected);
                                });
                            }
                        );
                    }
                );
            } catch (eRun) {
                console.error("[refine] crashed: " + eRun.message);
                showStatus(t_refine("cap_refine_failed"), "orange");
                proceed(summary);
            }
        }

        // Places a translated caption set on the SECOND caption track. Failure here
        // is non-fatal: the primary subtitle still goes down either way.
        function placeSecondSubtitle(translatedSummary, langName, placementOffset, done) {
            try {
                var cfg2 = {
                    style: style, animation: "none", font: "Arial",
                    size: 72, color: "#FFFFFF", highlight: "#FFFFFF",
                    offsetSecs: parseFloat(placementOffset) || 0,
                    wordsPerCaption: wordsPerCaption, wordsMin: wordsMin, wordsMax: wordsMax,
                    captionTrackIndex: 1
                };
                var cfgStr2 = JSON.stringify(cfg2).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                var jsonEsc2 = translatedSummary.json.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
                csInterface.evalScript(
                    '$._editflow.placeAnimatedCaptions("' + jsonEsc2 + '","' + cfgStr2 + '")',
                    function(res2) {
                        console.log("[refine] second subtitle (" + langName + "):", res2);
                        var r2 = safeParse(res2);
                        if (!r2 || r2.status === "error") {
                            showStatus(t_refine("cap_dual_track_hint"), "orange");
                        }
                        done();
                    }
                );
            } catch (e) {
                console.error("[refine] placeSecondSubtitle crashed: " + e.message);
                done();
            }
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
        var macCaptionRunnerPath = "";
        var macRunnerRepairAttempted = false;

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
                    macCaptionRunnerPath = macBin;
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

            // Read the exact duration of the normalized PCM WAV part that ffmpeg
            // produced. Source in/out duration is not reliable for speed-changed
            // clips, and rounding it once per clip accumulates visible drift across
            // a long multi-clip selection.
            function wavDuration(filePath) {
                var fd = null;
                try {
                    var stat = fsModule.statSync(filePath);
                    var readLen = Math.min(stat.size, 65536);
                    var buf = Buffer.alloc ? Buffer.alloc(readLen) : new Buffer(readLen);
                    fd = fsModule.openSync(filePath, "r");
                    fsModule.readSync(fd, buf, 0, readLen, 0);
                    if (buf.toString("ascii", 0, 4) !== "RIFF" ||
                        buf.toString("ascii", 8, 12) !== "WAVE") return 0;
                    var pos = 12, byteRate = 0, dataBytes = 0;
                    while (pos + 8 <= readLen) {
                        var id = buf.toString("ascii", pos, pos + 4);
                        var size = buf.readUInt32LE(pos + 4);
                        if (id === "fmt " && pos + 16 <= readLen) byteRate = buf.readUInt32LE(pos + 16);
                        if (id === "data") { dataBytes = size; break; }
                        pos += 8 + size + (size % 2);
                    }
                    return (byteRate > 0 && dataBytes > 0) ? dataBytes / byteRate : 0;
                } catch (e) {
                    return 0;
                } finally {
                    if (fd !== null) { try { fsModule.closeSync(fd); } catch (e2) {} }
                }
            }

            // The multi-clip audio file is deliberately compact: the selected clips
            // are concatenated without potentially 40+ minutes of silence. Restore
            // each transcript word to its clip's real timeline position before AI
            // refinement and placement. A segment that crosses a concat boundary is
            // split so no caption can bridge an empty part of the Premiere timeline.
            function restoreTimelineMap(summary, timelineMap) {
                if (!timelineMap || !timelineMap.length || !summary || !summary.json) return summary;
                var doc = JSON.parse(fsModule.readFileSync(summary.json, "utf8"));
                var sourceSegs = doc.segments || [];
                var mapped = [];

                function r3(n) { return Math.round(n * 1000) / 1000; }
                function mapTime(t, entry) {
                    var audioDur = entry.audioEnd - entry.audioStart;
                    var scale = (audioDur > 0 && entry.timelineDuration > 0)
                        ? entry.timelineDuration / audioDur : 1;
                    return entry.timelineStart + (t - entry.audioStart) * scale;
                }
                function copyExtras(src, dst) {
                    for (var key in src) {
                        if (src.hasOwnProperty(key) && key !== "start" && key !== "end" &&
                            key !== "text" && key !== "words" && key !== "timelineBreak") {
                            dst[key] = src[key];
                        }
                    }
                }

                for (var si = 0; si < sourceSegs.length; si++) {
                    var seg = sourceSegs[si];
                    var sw = seg.words || [];
                    var emitted = false;

                    if (sw.length) {
                        for (var mi = 0; mi < timelineMap.length; mi++) {
                            var entry = timelineMap[mi];
                            var outWords = [];
                            for (var wi = 0; wi < sw.length; wi++) {
                                var word = sw[wi];
                                var mid = ((parseFloat(word.start) || 0) + (parseFloat(word.end) || 0)) / 2;
                                var isLastMap = (mi === timelineMap.length - 1);
                                if (mid >= entry.audioStart &&
                                    (mid < entry.audioEnd || (isLastMap && mid <= entry.audioEnd + 0.05))) {
                                    var wordStart = parseFloat(word.start);
                                    var wordEnd = parseFloat(word.end);
                                    if (isNaN(wordStart)) wordStart = entry.audioStart;
                                    if (isNaN(wordEnd)) wordEnd = wordStart;
                                    wordStart = Math.max(wordStart, entry.audioStart);
                                    wordEnd = Math.min(wordEnd, entry.audioEnd);
                                    if (wordEnd <= wordStart) wordEnd = Math.min(entry.audioEnd, wordStart + 0.001);
                                    outWords.push({
                                        start: r3(mapTime(wordStart, entry)),
                                        end: r3(mapTime(wordEnd, entry)),
                                        text: word.text || ""
                                    });
                                }
                            }
                            if (outWords.length) {
                                var parts = [];
                                for (var pi = 0; pi < outWords.length; pi++) {
                                    if (outWords[pi].text) parts.push(outWords[pi].text);
                                }
                                var frag = {
                                    start: outWords[0].start,
                                    end: outWords[outWords.length - 1].end,
                                    text: parts.join(" ").trim(),
                                    words: outWords,
                                    _timelineClip: mi
                                };
                                copyExtras(seg, frag);
                                mapped.push(frag);
                                emitted = true;
                            }
                        }
                    }

                    // Rare provider response with segment timestamps but no word
                    // timestamps: assign the whole segment by its midpoint.
                    if (!emitted) {
                        var segStart = parseFloat(seg.start) || 0;
                        var segEnd = parseFloat(seg.end) || segStart;
                        var segMid = (segStart + segEnd) / 2;
                        for (var fm = 0; fm < timelineMap.length; fm++) {
                            var fallbackEntry = timelineMap[fm];
                            if (segMid >= fallbackEntry.audioStart && segMid <= fallbackEntry.audioEnd + 0.05) {
                                var fallbackSeg = {
                                    start: r3(mapTime(Math.max(segStart, fallbackEntry.audioStart), fallbackEntry)),
                                    end: r3(mapTime(Math.min(segEnd, fallbackEntry.audioEnd), fallbackEntry)),
                                    text: seg.text || "",
                                    words: [],
                                    _timelineClip: fm
                                };
                                copyExtras(seg, fallbackSeg);
                                mapped.push(fallbackSeg);
                                break;
                            }
                        }
                    }
                }

                mapped.sort(function(a, b) { return a.start - b.start; });
                var lastForClip = {};
                for (var li = 0; li < mapped.length; li++) lastForClip[mapped[li]._timelineClip] = li;
                for (var ci = 0; ci < timelineMap.length; ci++) {
                    if (lastForClip[ci] !== undefined) mapped[lastForClip[ci]].timelineBreak = true;
                }
                var maxEnd = 0, totalWords = 0;
                for (var oi = 0; oi < mapped.length; oi++) {
                    delete mapped[oi]._timelineClip;
                    if (mapped[oi].end > maxEnd) maxEnd = mapped[oi].end;
                    totalWords += (mapped[oi].words || []).length;
                }

                doc.segments = mapped;
                doc.duration = r3(maxEnd);
                doc.timelineMapped = true;
                var mappedPath = String(summary.json).replace(/\.efp\.json$/, ".timeline.efp.json");
                fsModule.writeFileSync(mappedPath, JSON.stringify(doc), "utf8");

                var out = {};
                for (var sk in summary) { if (summary.hasOwnProperty(sk)) out[sk] = summary[sk]; }
                out.json = mappedPath;
                out.duration = doc.duration;
                out.segments = mapped.length;
                out.words = totalWords;
                console.log("[Captions] restored " + timelineMap.length + " clip ranges → " +
                            mapped.length + " segments across " + doc.duration.toFixed(1) + "s of timeline");
                return out;
            }

            function runTranscriber(mPath, tlStart, cIn, cOut, cDur, timelineMap) {
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
                            if (timelineMap && timelineMap.length) {
                                try { summary = restoreTimelineMap(summary, timelineMap); }
                                catch (mapErr) {
                                    hideProgress(); setStatus("");
                                    showStatus("Could not restore multi-clip timeline positions: " + mapErr.message, "red");
                                    return;
                                }
                            }
                            if (summary.langWarning) {
                    // The spoken language differed from the one selected. Say so loudly:
                    // a forced-wrong language yields fluent-looking invented words, not
                    // an obvious failure, so silence here costs the user a whole pass.
                    var msg = summary.langWarning;
                    if (summary.langMismatch) {
                        var want = LANG_CODE_TO_NAME[summary.langMismatch.requested];
                        var box = document.getElementById("cap-refine");
                        if (want && box && box.checked) {
                            msg += " Translating to " + want + ".";
                        } else if (want) {
                            msg += " Tick \u201cRefine with a stronger AI\u201d to translate it to " + want + ".";
                        }
                    }
                    showStatus(msg, "orange");
                    console.warn("[Captions] " + msg);
                }
                setStatus("Detected " + summary.language + " · " + summary.words + " words · " + summary.segments + " segments");
                            console.log("[Captions] placing synced editable captions");
                            showProgress("Syncing captions to timeline…", 75);
                            setStatus("Building timeline-synced captions…");
                            withRefinement(summary, setStatus, function(_s) {
                                placeCaptionResult(_s, tlStart);
                            }, tlStart);
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
                // A command includes the user's API key. CEP console logs are
                // inspectable, so never log the secret even when debugging.
                var safeCmd = apiKey ? cmd.split(apiKey).join("[REDACTED]") : cmd;
                console.log("[Captions] running:", safeCmd);

                activeCaptionProcess = execModule(cmd, opts, function(err, stdout, stderr) {
                activeCaptionProcess = null;
                if (err) {
                    if (err.killed || err.signal === 'SIGTERM') {
                        hideProgress(); setStatus("Captioning cancelled.");
                        showStatus("Captioning cancelled by user.", "orange");
                        return;
                    }
                    // whisper_runner writes JSON to stdout even on failure — parse it first
                    var errData = safeParse(stdout);
                    if (errData && errData.message) {
                        hideProgress(); setStatus("");
                        showStatus("Caption error: " + errData.message.slice(0, 120), "red");
                    } else if (osModule && osModule.platform() === "darwin" &&
                               !macRunnerRepairAttempted && macCaptionRunnerPath) {
                        // A package installed on another Mac can retain a
                        // quarantine marker or lose its execute bit. Repair only
                        // our own bundled runner, without a Terminal prompt, then
                        // retry once. The next error is shown normally.
                        macRunnerRepairAttempted = true;
                        try { fsModule.chmodSync(macCaptionRunnerPath, 493); } catch(repairChmodErr) {}
                        showProgress("Repairing caption engine…", 18, true);
                        setStatus("Preparing the caption engine on this Mac…");
                        function retryMacRunner() {
                            runTranscriber(mPath, tlStart, cIn, cOut, cDur, timelineMap);
                        }
                        if (execFileModule) {
                            execFileModule("/usr/bin/xattr", ["-d", "com.apple.quarantine", macCaptionRunnerPath],
                                           { timeout: 10000 }, retryMacRunner);
                        } else {
                            retryMacRunner();
                        }
                    } else {
                        hideProgress(); setStatus("");
                        console.warn("[Captions] Native runner failed without a structured response.",
                                     "code=", err.code || "unknown", "stderr=", String(stderr || "").slice(0, 200));
                        showStatus("The caption engine could not start. Please update or reinstall EditFlow Pro, then try again.", "red");
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

                if (timelineMap && timelineMap.length) {
                    try { summary = restoreTimelineMap(summary, timelineMap); }
                    catch (mapErr2) {
                        hideProgress(); setStatus("");
                        showStatus("Could not restore multi-clip timeline positions: " + mapErr2.message, "red");
                        return;
                    }
                }

                if (summary.langWarning) {
                    // The spoken language differed from the one selected. Say so loudly:
                    // a forced-wrong language yields fluent-looking invented words, not
                    // an obvious failure, so silence here costs the user a whole pass.
                    var msg = summary.langWarning;
                    if (summary.langMismatch) {
                        var want = LANG_CODE_TO_NAME[summary.langMismatch.requested];
                        var box = document.getElementById("cap-refine");
                        if (want && box && box.checked) {
                            msg += " Translating to " + want + ".";
                        } else if (want) {
                            msg += " Tick \u201cRefine with a stronger AI\u201d to translate it to " + want + ".";
                        }
                    }
                    showStatus(msg, "orange");
                    console.warn("[Captions] " + msg);
                }
                setStatus("Detected " + summary.language + " · " + summary.words + " words · " + summary.segments + " segments");

                // ── SRT MODE ONLY: generate synced captions directly ──
                console.log("[Captions] placing synced editable captions");
                showProgress("Syncing captions to timeline…", 75);
                setStatus("Building timeline-synced captions…");
                withRefinement(summary, setStatus, function(_s) {
                    placeCaptionResult(_s, tlStart);
                }, tlStart);
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
                    var partDurations = [];
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
                            } else {
                                partDurations[idx] = wavDuration(partFile) || clip.duration || clip.timelineDuration || 0;
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

                                // Map compact-audio time to each clip's position,
                                // relative to the first selected clip. fallbackSRT
                                // adds firstTlStart once at placement time.
                                var timelineMap = [];
                                var audioCursor = 0;
                                for (var mapI = 0; mapI < clips.length; mapI++) {
                                    var partDur = partDurations[mapI] || clips[mapI].duration ||
                                                  clips[mapI].timelineDuration || 0;
                                    if (partDur <= 0) {
                                        hideProgress(); setStatus("");
                                        showStatus("Could not determine duration of selected clip " + (mapI + 1), "red");
                                        return;
                                    }
                                    var timelineDur = clips[mapI].timelineDuration || partDur;
                                    timelineMap.push({
                                        audioStart: audioCursor,
                                        audioEnd: audioCursor + partDur,
                                        timelineStart: (clips[mapI].timelineStart || 0) - firstTlStart,
                                        timelineDuration: timelineDur
                                    });
                                    audioCursor += partDur;
                                }

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
                                    runTranscriber(combinedFile, firstTlStart, 0, 0, 0, timelineMap);
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

    safeBind("btn-remove-animated", function() {
        if (operationRunning) return;
        csInterface.evalScript('$._editflow.removeRenderedCaptions()', function(res) {
            var parsed = safeParse(res);
            handleJSXResult(res);
            var statusLine = document.getElementById("cap-status");
            if (statusLine && parsed && parsed.status === "success") {
                statusLine.textContent = "Removed " + parsed.removed + " animated caption clip(s). Editable captions are unchanged.";
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
                // A refinement failure must not end on a clean green line. The
                // captions did land, so this is a warning, not an error — but it has
                // to stay on screen, because the banner that carried it expired long
                // before the placement finished.
                var refineNote = window._efpRefineError
                    ? "  ⚠ AI refine did not run: " + window._efpRefineError
                    : "";
                if (r && r.placed) {
                    setStatus("✅ " + r.groups + " captions synced on timeline" + refineNote);
                } else if (r && r.groups) {
                    setStatus("✅ " + r.groups + " captions ready → drag from EFP_Captions bin to Caption track (timing is synced)" + refineNote);
                } else {
                    setStatus("Caption generation completed." + refineNote);
                }
                if (window._efpRefineError) {
                    showStatus("Captions placed, but the AI refinement failed: " + window._efpRefineError, "orange");
                }
            }
        );
    }

    // ============================================================
    // CAPTION QA — builds Premiere's exact caption plan, then checks it locally.
    // This intentionally never modifies caption text, tracks, or timeline items.
    // ============================================================
    (function initCaptionQa() {
        var btn = document.getElementById("btn-caption-qa");
        var reportEl = document.getElementById("caption-qa-report");
        if (!btn || !reportEl) return;

        function text(key, replacements) {
            var out = t_refine(key);
            replacements = replacements || {};
            for (var rk in replacements) {
                if (replacements.hasOwnProperty(rk)) out = out.replace("{" + rk + "}", replacements[rk]);
            }
            return out;
        }
        function escapeHtml(value) {
            return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
                .replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
        }
        function timecode(seconds) {
            seconds = Math.max(0, parseFloat(seconds) || 0);
            var h = Math.floor(seconds / 3600);
            var m = Math.floor((seconds % 3600) / 60);
            var s = Math.floor(seconds % 60);
            function p(n) { return n < 10 ? "0" + n : String(n); }
            return (h ? p(h) + ":" : "") + p(m) + ":" + p(s);
        }
        function normalized(textValue) {
            return String(textValue || "").toLowerCase().replace(/[^\w\u0600-\u06FF]+/g, " ")
                .replace(/^\s+|\s+$/g, "").replace(/\s+/g, " ");
        }
        function repeatedWord(textValue) {
            var bits = normalized(textValue).split(" ");
            var run = 1;
            for (var i = 1; i < bits.length; i++) {
                if (bits[i] && bits[i] === bits[i - 1]) {
                    run++;
                    if (run >= 3) return bits[i];
                } else {
                    run = 1;
                }
            }
            return "";
        }
        function buildReport(plan, transcript, targetCode) {
            var groups = (plan && plan.groups) || [];
            var issues = [];
            var boundaries = [];
            var targetUsesArabic = /^(ar|fa|ur)$/i.test(targetCode || "");
            var arabic = /[\u0600-\u06FF]/;

            function add(level, at, title, detail, sample) {
                issues.push({ level: level, at: Math.max(0, parseFloat(at) || 0), title: title, detail: detail, sample: sample || "" });
            }
            var sourceSegments = (transcript && transcript.segments) || [];
            for (var sb = 0; sb < sourceSegments.length; sb++) {
                if (sourceSegments[sb] && sourceSegments[sb].timelineBreak === true) {
                    boundaries.push(parseFloat(sourceSegments[sb].end) || 0);
                }
            }

            for (var i = 0; i < groups.length; i++) {
                var group = groups[i] || {};
                var captionText = String(group.text || "").replace(/^\s+|\s+$/g, "");
                var start = parseFloat(group.start) || 0;
                var end = parseFloat(group.end) || start;
                var duration = Math.max(0.01, end - start);
                var characters = captionText.length;
                var words = captionText ? captionText.split(/\s+/).length : 0;
                var cps = characters / duration;

                if (characters > 84 || words > 14) {
                    add("warning", start, "Long caption", characters + " characters · layout may need more than two lines", captionText);
                }
                if (cps > 20) {
                    add("error", start, "Reading speed is too high", Math.round(cps) + " characters/sec · give this caption more time", captionText);
                } else if (cps > 17) {
                    add("warning", start, "Fast reading speed", Math.round(cps) + " characters/sec", captionText);
                }
                if (words >= 3 && duration < 0.65) {
                    add("warning", start, "Caption is very brief", duration.toFixed(2) + "s for " + words + " words", captionText);
                }
                if (!targetUsesArabic && arabic.test(captionText)) {
                    add("warning", start, "Arabic remains in the target subtitle", "Review this line for an untranslated fragment", captionText);
                }
                var repeated = repeatedWord(captionText);
                if (repeated) {
                    add("warning", start, "Unnatural repetition", '“' + repeated + '” repeats three times', captionText);
                }
                if (i > 0) {
                    var previous = groups[i - 1] || {};
                    var previousEnd = parseFloat(previous.end) || 0;
                    var previousText = normalized(previous.text);
                    if (previousEnd > start + 0.05) {
                        add("error", start, "Overlapping captions", "This caption starts before the previous one has ended", captionText);
                    }
                    if (previousText && previousText === normalized(captionText)) {
                        add("warning", start, "Repeated caption", "The same caption appears twice in a row", captionText);
                    }
                    // This is deliberately a review item: the transcript timing
                    // reveals the gap, but only waveform/AI analysis can prove it
                    // contains speech rather than a natural silent pause.
                    var gap = start - previousEnd;
                    if (gap > 4 && gap < 30) {
                        var crossesCut = false;
                        for (var gb = 0; gb < boundaries.length; gb++) {
                            if (boundaries[gb] >= previousEnd - 0.05 && boundaries[gb] <= start + 0.05) { crossesCut = true; break; }
                        }
                        if (!crossesCut) add("review", previousEnd, "Long caption gap", gap.toFixed(1) + "s without a caption · review whether speech is missing", "");
                    }
                }
                for (var cb = 0; cb < boundaries.length; cb++) {
                    if (start < boundaries[cb] - 0.02 && end > boundaries[cb] + 0.02) {
                        add("error", boundaries[cb], "Caption crosses an edit", "A caption spans a protected timeline cut", captionText);
                    }
                }
            }
            issues.sort(function(a, b) { return a.at - b.at; });
            return { groups: groups.length, issues: issues };
        }
        function render(result) {
            var issues = result.issues || [];
            var counts = { error: 0, warning: 0, review: 0 };
            for (var i = 0; i < issues.length; i++) counts[issues[i].level]++;
            var heading = issues.length
                ? text("cap_qa_found", {n: issues.length})
                : text("cap_qa_clean");
            var detail = issues.length
                ? ""
                : text("cap_qa_clean_detail", {n: result.groups || 0});
            var html = '<div class="caption-qa-summary"><div><strong>' + escapeHtml(heading) + '</strong>' +
                (detail ? '<div>' + escapeHtml(detail) + '</div>' : '') + '</div><div class="caption-qa-counts">';
            if (counts.error) html += '<span class="caption-qa-count error">' + escapeHtml(text("cap_qa_error_count", {n:counts.error})) + '</span>';
            if (counts.warning) html += '<span class="caption-qa-count warning">' + escapeHtml(text("cap_qa_warning_count", {n:counts.warning})) + '</span>';
            if (counts.review) html += '<span class="caption-qa-count review">' + escapeHtml(text("cap_qa_review_count", {n:counts.review})) + '</span>';
            html += '</div></div>';
            var visible = issues.slice(0, 30);
            if (visible.length) html += '<div class="caption-qa-list">';
            for (var j = 0; j < visible.length; j++) {
                var issue = visible[j];
                var snippet = issue.sample ? (issue.detail + ' · ' + issue.sample) : issue.detail;
                html += '<button type="button" class="caption-qa-item ' + issue.level + '" data-qa-time="' + issue.at + '">' +
                    '<span class="caption-qa-severity"></span><span class="caption-qa-copy"><strong>' + escapeHtml(issue.title) +
                    '</strong><span>' + escapeHtml(snippet) + '</span></span><span class="caption-qa-time">' + timecode(issue.at) + '</span></button>';
            }
            if (visible.length) html += '</div>';
            if (issues.length > visible.length) html += '<p class="caption-qa-more">' + escapeHtml(text("cap_qa_more", {n: issues.length - visible.length})) + '</p>';
            reportEl.innerHTML = html;
            reportEl.classList.remove("hidden");
            var jumpers = reportEl.querySelectorAll("[data-qa-time]");
            for (var k = 0; k < jumpers.length; k++) {
                jumpers[k].addEventListener("click", function() {
                    var at = parseFloat(this.getAttribute("data-qa-time"));
                    if (!csInterface || isNaN(at)) return;
                    csInterface.evalScript('$._editflow.jumpToTimelineTime("' + at.toFixed(3) + '")');
                });
            }
        }

        safeBind("btn-caption-qa", function() {
            var qa = settings.captionQa || {};
            var sourcePath = String(qa.lastSummaryPath || "");
            if (!sourcePath) {
                showStatus(text("cap_qa_need_caption"), "orange");
                return;
            }
            if (!fsModule || !fsModule.existsSync(sourcePath)) {
                showStatus(text("cap_qa_missing_file"), "orange");
                return;
            }
            if (!csInterface || !pathModule || !osModule) {
                showStatus("Premiere connection is unavailable.", "red");
                return;
            }
            var transcript;
            try { transcript = JSON.parse(fsModule.readFileSync(sourcePath, "utf8")); }
            catch(eRead) { showStatus(text("cap_qa_missing_file"), "orange"); return; }

            btn.disabled = true;
            reportEl.classList.remove("hidden");
            reportEl.innerHTML = '<div class="caption-qa-summary"><strong>' + escapeHtml(text("cap_qa_scanning")) + '</strong></div>';
            var planPath = pathModule.join(osModule.tmpdir(), "efp_caption_qa_" + Date.now() + ".json");
            var cfg = {
                style: qa.style || "phrase",
                animation: "none",
                offsetSecs: parseFloat(qa.timelineOffset) || 0,
                wordsPerCaption: parseInt(qa.wordsMin, 10) || 3,
                wordsMin: parseInt(qa.wordsMin, 10) || 3,
                wordsMax: parseInt(qa.wordsMax, 10) || 5,
                planOnly: true,
                planPath: planPath
            };
            var escapedPath = sourcePath.replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');
            var escapedCfg = JSON.stringify(cfg).replace(/\\/g, "\\\\").replace(/\"/g, '\\\"');
            csInterface.evalScript('$._editflow.placeAnimatedCaptions("' + escapedPath + '","' + escapedCfg + '")', function(raw) {
                btn.disabled = false;
                var response = safeParse(raw);
                if (!response || response.status !== "success" || !response.plan || !fsModule.existsSync(response.plan)) {
                    reportEl.classList.add("hidden");
                    showStatus(text("cap_qa_plan_failed"), "orange");
                    return;
                }
                try {
                    var plan = JSON.parse(fsModule.readFileSync(response.plan, "utf8"));
                    render(buildReport(plan, transcript, qa.targetCode || "auto"));
                } catch(ePlan) {
                    reportEl.classList.add("hidden");
                    showStatus(text("cap_qa_plan_failed"), "orange");
                }
                try { fsModule.unlinkSync(response.plan); } catch(eClean) {}
            });
        });
    })();

    // (Upgrade Caption to Graphic has been removed due to Adobe API limitations in recent Premiere builds)



    safeBind("btn-export-selected", function() {
        if (!fsModule) { showStatus("Export tools are unavailable.", "red"); return; }
        var format = (document.getElementById("export-format") || {value:"video"}).value || "video";
        if (format !== "mp3" && format !== "wav") format = "video";
        settings.exportFormat = format;

        var selectedPreset = format === "video" ? foundPresetPath : foundAudioPresetPaths[format];
        if (!selectedPreset && format !== "video") {
            findAudioExportPresets();
            selectedPreset = foundAudioPresetPaths[format];
        }
        if (!selectedPreset) {
            showStatus(format === "video" ? "No export preset." : t_refine("export_audio_preset_missing"), "red");
            return;
        }

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

        function startDirectExport(presetPath, selectedPath, outputFormat, tempPreset, qualityText) {
            var formatLabel = outputFormat === "video" ? qualityText + " Mbps" : outputFormat.toUpperCase();
            showProgress("Exporting " + formatLabel + "...", 40);
            var fnEsc = fileName.replace(/\\/g,"\\\\").replace(/"/g,'\\"');
            var fpEsc = selectedPath.replace(/\\/g,"\\\\").replace(/"/g,'\\"');
            var presetEsc = presetPath.replace(/\\/g,"\\\\").replace(/"/g,'\\"');
            console.log("[Export] Format: " + outputFormat + " | Preset: " + presetPath);
            csInterface.evalScript('$._editflow.exportCustom("' + presetEsc + '", "' + fnEsc + '", "' + fpEsc + '", "' + outputFormat + '")', function(res) {
                console.log("[<-JSX] exportCustom:", res);
                if (tempPreset) {
                    // Keep the temporary video preset long enough for Premiere
                    // to read it. Native Adobe audio presets remain untouched.
                    setTimeout(function() {
                        try { fsModule.unlinkSync(tempPreset); } catch(e) {}
                    }, 300000);
                }

                var r = safeParse(res);
                if (r && r.status === "success") {
                    if (r.queued) {
                        showProgress("Done!", 100);
                        setTimeout(hideProgress, 2000);
                        showStatus("✅ Export queued in Adobe Media Encoder", "green");
                    } else {
                        showStatus(outputFormat === "video" ? "⏳ Exporting in background..." : "⏳ Exporting audio in background...", "blue");
                        pollExportFile(r.filePath, Date.now(), 600000);
                    }
                } else {
                    showProgress("Export failed", 0);
                    setTimeout(hideProgress, 1000);
                    var errMsg = (r && r.message) ? r.message : "Export failed.";
                    showStatus(errMsg, "red");
                }
            });
        }

        function runExport(selectedPath) {
            // Cleanup old temporary video presets (older than 10 minutes).
            try {
                var tempDir = getSafeTempDir();
                var files = fsModule.readdirSync(tempDir);
                var now = Date.now();
                files.forEach(function(file) {
                    if (file.indexOf("efp_") === 0 && file.indexOf(".epr") !== -1) {
                        var filePath = pathModule.join(tempDir, file);
                        var stat = fsModule.statSync(filePath);
                        if (now - stat.mtimeMs > 600000) {
                            try { fsModule.unlinkSync(filePath); } catch(err) {}
                        }
                    }
                });
            } catch(err) {}

            console.log("[Export] File: " + (fileName || "(auto)") + " | Path: " + selectedPath + " | Format: " + format);
            showProgress("Preparing...", 10);
            if (format === "video") {
                modifyPresetBitrate(function(tmp, br) {
                    startDirectExport(tmp, selectedPath, format, tmp, br);
                });
            } else {
                startDirectExport(selectedPreset, selectedPath, format, null, "");
            }
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
    // The generate button changes meaning when animated captions are enabled;
    // re-apply that state after the generic i18n pass updates its label.
    if (typeof updateAnimatedCaptionUI === "function") updateAnimatedCaptionUI();
    if (typeof updateExportFormatUI === "function") updateExportFormatUI(false);
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
                // Animated-caption UI v2 makes presets self-contained. Older
                // saved Arial/color overrides made every style look nearly the
                // same, so migrate only this optional feature to clean defaults.
                if (!d.captions.animatedUiVersion || d.captions.animatedUiVersion < 2) {
                    settings.captions.animatedUiVersion = 2;
                    settings.captions.animatedPreset = "clean-film";
                    settings.captions.animatedFont = "";
                    settings.captions.animatedSize = 100;
                    settings.captions.animatedPosition = "preset";
                    settings.captions.animatedBackgroundMode = "preset";
                }
            }
            if (d.captionQa && typeof d.captionQa === "object") {
                for (var qaKey in DEFAULT_SETTINGS.captionQa) {
                    if (d.captionQa[qaKey] !== undefined) settings.captionQa[qaKey] = d.captionQa[qaKey];
                }
            }
            if (typeof d.bitrate === "number") settings.bitrate = d.bitrate;
            if (d.exportFormat === "video" || d.exportFormat === "mp3" || d.exportFormat === "wav") settings.exportFormat = d.exportFormat;
            if (typeof d.exportPath === "string") settings.exportPath = efpNormalizePath(d.exportPath);
            if (typeof d.groqApiKey === "string") settings.groqApiKey = d.groqApiKey;
            if (Array.isArray(d.favoriteSfx)) settings.favoriteSfx = d.favoriteSfx;
            if (typeof d.downloadPath === "string") settings.downloadPath = efpNormalizePath(d.downloadPath);
            if (typeof d.downloadQuality === "string") settings.downloadQuality = d.downloadQuality;
            if (typeof d.downloadPlacement === "string") settings.downloadPlacement = d.downloadPlacement;
            if (typeof d.refineProvider === "string") settings.refineProvider = d.refineProvider;
            if (typeof d.refineModel === "string") settings.refineModel = d.refineModel;
            if (typeof d.refineEnabled === "boolean") settings.refineEnabled = d.refineEnabled;
            if (typeof d.dualSubtitle === "boolean") settings.dualSubtitle = d.dualSubtitle;
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
    setSel("export-format", settings.exportFormat || "video");
    updateExportFormatUI(false);

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
    var animatedEl = document.getElementById("cap-animated");
    if (animatedEl) animatedEl.checked = !!settings.captions.animated;
    var animatedPresetEl = document.getElementById("cap-animated-preset");
    if (animatedPresetEl) animatedPresetEl.value = settings.captions.animatedPreset || "clean-film";
    setAnimatedControlValue("cap-animated-font", settings.captions.animatedFont || "");
    setAnimatedControlValue("cap-animated-size", settings.captions.animatedSize || 100);
    setAnimatedControlValue("cap-animated-position", settings.captions.animatedPosition || "preset");
    var savedBackgroundMode = settings.captions.animatedBackgroundMode || "preset";
    if (savedBackgroundMode === "custom") savedBackgroundMode = "black";
    setAnimatedControlValue("cap-animated-background-mode", savedBackgroundMode);
    var reviewEl = document.getElementById("cap-animated-review");
    if (reviewEl) reviewEl.checked = !!settings.captions.animatedReview;
    updateAnimatedCaptionUI();
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

function updateExportFormatUI(persist) {
    var formatEl = document.getElementById("export-format");
    var format = formatEl ? formatEl.value : (settings.exportFormat || "video");
    if (format !== "mp3" && format !== "wav") format = "video";

    var videoQuality = document.getElementById("export-video-quality");
    var audioQuality = document.getElementById("export-audio-quality");
    var exportButton = document.getElementById("btn-export-selected");
    var isAudio = format !== "video";

    if (videoQuality) videoQuality.classList.toggle("hidden", isAudio);
    if (audioQuality) {
        audioQuality.classList.toggle("hidden", !isAudio);
        var mp3Match = String(foundAudioPresetPaths.mp3 || "").match(/MP3\s+(\d+)kbps/i);
        var mp3Bitrate = mp3Match ? mp3Match[1] : "256";
        audioQuality.textContent = format === "wav"
            ? t_refine("export_audio_quality_wav")
            : t_refine("export_audio_quality_mp3").replace("{bitrate}", mp3Bitrate);
    }
    if (exportButton) {
        var buttonKey = isAudio ? "export_selected_audio" : "export_selected";
        exportButton.setAttribute("data-i18n", buttonKey);
        exportButton.textContent = t_refine(buttonKey);
    }

    if (persist) {
        settings.exportFormat = format;
        saveSettings();
    }
}

var _exportFormatEl = document.getElementById("export-format");
if (_exportFormatEl) {
    _exportFormatEl.addEventListener("change", function() {
        updateExportFormatUI(true);
    });
}

function setAnimatedControlValue(id, value) {
    var el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.value = String(value);
}

function captionUiText(key, replacements) {
    var value = t_refine(key);
    if (replacements) {
        for (var name in replacements) {
            if (replacements.hasOwnProperty(name)) value = value.replace("{" + name + "}", replacements[name]);
        }
    }
    return value;
}

function animatedCaptionOptionsFromUI() {
    var size = parseInt((document.getElementById("cap-animated-size") || {value:"100"}).value, 10) || 100;
    var font = String((document.getElementById("cap-animated-font") || {value:""}).value || "").trim();
    return {
        font: font.slice(0, 80),
        size: Math.max(60, Math.min(150, size)),
        position: (document.getElementById("cap-animated-position") || {value:"preset"}).value || "preset",
        backgroundMode: (document.getElementById("cap-animated-background-mode") || {value:"preset"}).value || "preset",
        review: !!(document.getElementById("cap-animated-review") || {}).checked
    };
}

function persistAnimatedCaptionControls() {
    var opts = animatedCaptionOptionsFromUI();
    settings.captions.animatedUiVersion = 2;
    settings.captions.animatedFont = opts.font;
    settings.captions.animatedSize = opts.size;
    settings.captions.animatedPosition = opts.position;
    settings.captions.animatedBackgroundMode = opts.backgroundMode;
    settings.captions.animatedReview = opts.review;
    saveSettings();
}

function updateCapWordsPerVisibility() {
    var styleEl = document.getElementById("cap-style");
    var rowEl   = document.getElementById("cap-words-per-row");
    if (!rowEl) return;
    rowEl.style.display = (styleEl && styleEl.value === "phrase") ? "flex" : "none";
}

var _capStyleEl = document.getElementById("cap-style");
if (_capStyleEl) _capStyleEl.addEventListener("change", updateCapWordsPerVisibility);

function updateAnimatedCaptionUI() {
    var toggle = document.getElementById("cap-animated");
    var options = document.getElementById("cap-animated-options");
    var preset = (document.getElementById("cap-animated-preset") || {value:"clean-film"}).value;
    if (options) options.style.display = (toggle && toggle.checked) ? "block" : "none";
    var generateBtn = document.getElementById("btn-generate-captions");
    if (generateBtn) {
        var generateKey = (toggle && toggle.checked) ? "cap_generate_animated" : "cap_generate";
        generateBtn.setAttribute("data-i18n", generateKey);
        generateBtn.textContent = captionUiText(generateKey);
    }
    var cards = document.querySelectorAll(".cap-style-card");
    for (var i = 0; i < cards.length; i++) {
        var selected = cards[i].getAttribute("data-cap-preset") === preset;
        if (selected) cards[i].classList.add("selected");
        else cards[i].classList.remove("selected");
        cards[i].setAttribute("aria-checked", selected ? "true" : "false");
        cards[i].setAttribute("tabindex", selected ? "0" : "-1");
    }
    var opts = animatedCaptionOptionsFromUI();
    var sizeOut = document.getElementById("cap-animated-size-value");
    if (sizeOut) sizeOut.textContent = opts.size + "%";
}

var _capAnimatedEl = document.getElementById("cap-animated");
if (_capAnimatedEl) _capAnimatedEl.addEventListener("change", function() {
    settings.captions.animated = !!this.checked;
    updateAnimatedCaptionUI();
    saveSettings();
});
var _capAnimCards = document.querySelectorAll(".cap-style-card");
for (var _capCardI = 0; _capCardI < _capAnimCards.length; _capCardI++) {
    _capAnimCards[_capCardI].addEventListener("click", function() {
        var id = this.getAttribute("data-cap-preset") || "clean-film";
        var hidden = document.getElementById("cap-animated-preset");
        if (hidden) hidden.value = id;
        settings.captions.animatedPreset = id;
        updateAnimatedCaptionUI();
        persistAnimatedCaptionControls();
    });
    _capAnimCards[_capCardI].addEventListener("keydown", function(event) {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        var cards = document.querySelectorAll(".cap-style-card");
        var current = 0;
        for (var i = 0; i < cards.length; i++) if (cards[i] === this) current = i;
        var forward = event.key === "ArrowRight" || event.key === "ArrowDown";
        var next = (current + (forward ? 1 : -1) + cards.length) % cards.length;
        cards[next].click();
        cards[next].focus();
    });
}

var _capControlIds = [
    "cap-animated-font", "cap-animated-size", "cap-animated-position",
    "cap-animated-background-mode", "cap-animated-review"
];
for (var _capCtlI = 0; _capCtlI < _capControlIds.length; _capCtlI++) {
    (function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", updateAnimatedCaptionUI);
        el.addEventListener("change", function() {
            updateAnimatedCaptionUI();
            persistAnimatedCaptionControls();
        });
    })(_capControlIds[_capCtlI]);
}

function formatCaptionEditorTime(seconds) {
    var total = Math.max(0, Number(seconds) || 0);
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var secs = Math.floor(total % 60);
    function two(v) { return v < 10 ? "0" + v : String(v); }
    return two(hours) + ":" + two(minutes) + ":" + two(secs);
}

function reviewAnimatedCaptionGroups(groups, done) {
    var modal = document.getElementById("cap-editor-modal");
    var list = document.getElementById("cap-editor-list");
    var count = document.getElementById("cap-editor-count");
    var error = document.getElementById("cap-editor-error");
    var cancelBtn = document.getElementById("btn-cap-editor-cancel");
    var renderBtn = document.getElementById("btn-cap-editor-render");
    if (!modal || !list || !cancelBtn || !renderBtn) return done(groups);

    var working;
    try { working = JSON.parse(JSON.stringify(groups)); }
    catch(eClone) { working = groups.slice(0); }
    list.textContent = "";
    if (error) error.textContent = "";
    if (count) count.textContent = captionUiText("cap_editor_count", {n: working.length});

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < working.length; i++) {
        var row = document.createElement("div");
        row.className = "cap-editor-row";
        var time = document.createElement("span");
        time.className = "cap-editor-time";
        time.textContent = formatCaptionEditorTime(working[i].start) + " – " + formatCaptionEditorTime(working[i].end);
        var input = document.createElement("textarea");
        input.className = "cap-editor-input";
        input.rows = 1;
        input.maxLength = 500;
        input.dir = "auto";
        input.value = String(working[i].text || "").trim();
        input.setAttribute("data-caption-index", String(i));
        input.setAttribute("aria-label", "Caption " + (i + 1));
        input.addEventListener("input", function() {
            this.removeAttribute("aria-invalid");
            if (error) error.textContent = "";
            this.style.height = "auto";
            this.style.height = Math.min(96, Math.max(32, this.scrollHeight)) + "px";
        });
        row.appendChild(time);
        row.appendChild(input);
        fragment.appendChild(row);
    }
    list.appendChild(fragment);

    var completed = false;
    function finish(value) {
        if (completed) return;
        completed = true;
        modal.classList.add("hidden");
        modal.removeEventListener("keydown", onKeyDown);
        cancelBtn.onclick = null;
        renderBtn.onclick = null;
        done(value);
    }
    function onKeyDown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            finish(null);
        }
    }
    modal.addEventListener("keydown", onKeyDown);
    cancelBtn.onclick = function() { finish(null); };
    renderBtn.onclick = function() {
        var inputs = list.querySelectorAll(".cap-editor-input");
        var firstInvalid = null;
        for (var j = 0; j < inputs.length; j++) {
            var nextText = String(inputs[j].value || "").replace(/\s+/g, " ").trim();
            if (!nextText) {
                inputs[j].setAttribute("aria-invalid", "true");
                if (!firstInvalid) firstInvalid = inputs[j];
                continue;
            }
            var group = working[j];
            var tokens = nextText.split(/\s+/);
            var oldWords = group.words || [];
            if (oldWords.length === tokens.length) {
                for (var w = 0; w < tokens.length; w++) oldWords[w].text = tokens[w];
            } else {
                var start = Number(group.start) || 0;
                var end = Math.max(start + 0.05, Number(group.end) || start + 0.05);
                var slice = (end - start) / tokens.length;
                group.words = [];
                for (var n = 0; n < tokens.length; n++) {
                    group.words.push({
                        text: tokens[n],
                        start: start + n * slice,
                        end: n === tokens.length - 1 ? end : start + (n + 1) * slice
                    });
                }
            }
            group.text = nextText;
        }
        if (firstInvalid) {
            if (error) error.textContent = captionUiText("cap_editor_empty");
            firstInvalid.focus();
            return;
        }
        finish(working);
    };

    modal.classList.remove("hidden");
    setTimeout(function() {
        var first = list.querySelector(".cap-editor-input");
        if (first) first.focus();
    }, 0);
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

// Audio formats use Adobe's own audio-only presets. This preserves the selected
// timeline range, speed changes, audio effects and mix, and avoids a wasteful
// intermediate video render before MP3/WAV conversion.
function findAudioExportPresets() {
    if (!fsModule || !pathModule) return;
    foundAudioPresetPaths.mp3 = null;
    foundAudioPresetPaths.wav = null;

    var roots = [];
    var isWin = osModule && osModule.platform() === "win32";
    var years = ["2029", "2028", "2027", "2026", "2025", "2024", "2023", "2022", "2021", "2020"];
    var i;
    if (isWin) {
        var programFiles = process.env["ProgramFiles"] || "C:\\Program Files";
        for (i = 0; i < years.length; i++) {
            roots.push(pathModule.join(programFiles, "Adobe", "Adobe Premiere Pro " + years[i], "MediaIO", "systempresets"));
            roots.push(pathModule.join(programFiles, "Adobe", "Adobe Media Encoder " + years[i], "MediaIO", "systempresets"));
        }
        roots.push(pathModule.join(programFiles, "Adobe", "Adobe Premiere Pro (Beta)", "MediaIO", "systempresets"));
        roots.push(pathModule.join(programFiles, "Adobe", "Adobe Media Encoder (Beta)", "MediaIO", "systempresets"));
    } else {
        for (i = 0; i < years.length; i++) {
            roots.push("/Applications/Adobe Premiere Pro " + years[i] + "/Adobe Premiere Pro " + years[i] + ".app/Contents/MediaIO/systempresets");
            roots.push("/Applications/Adobe Media Encoder " + years[i] + "/Adobe Media Encoder " + years[i] + ".app/Contents/MediaIO/systempresets");
        }
        roots.push("/Applications/Adobe Premiere Pro (Beta)/Adobe Premiere Pro (Beta).app/Contents/MediaIO/systempresets");
        roots.push("/Applications/Adobe Media Encoder (Beta)/Adobe Media Encoder (Beta).app/Contents/MediaIO/systempresets");
    }

    var relative = {
        mp3: [
            ["3F3F3F3F_4D503320", "MP3 256kbps High Quality.epr"],
            ["3F3F3F3F_4D503320", "MP3 192kbps High Quality.epr"],
            ["3F3F3F3F_4D503320", "MP3 128kbps.epr"]
        ],
        wav: [
            ["3F3F3F3F_57415645", "Waveform Audio 48kHz 16-bit.epr"]
        ]
    };

    function firstExisting(options) {
        for (var r = 0; r < roots.length; r++) {
            for (var o = 0; o < options.length; o++) {
                var candidate = pathModule.join(roots[r], options[o][0], options[o][1]);
                try { if (fsModule.existsSync(candidate)) return candidate; } catch(e) {}
            }
        }
        return null;
    }

    foundAudioPresetPaths.mp3 = firstExisting(relative.mp3);
    foundAudioPresetPaths.wav = firstExisting(relative.wav);
    console.log("[EFP] MP3 preset: " + (foundAudioPresetPaths.mp3 || "not found"));
    console.log("[EFP] WAV preset: " + (foundAudioPresetPaths.wav || "not found"));
    updateExportFormatUI(false);
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
    // Groq's free tier caps at 8,000 tokens per minute — a 40-segment batch blew
    // straight past it with a 413. 12 keeps each request comfortably inside the
    // free limit while still being few enough calls to stay fast. Verified.
    // 12 segments per call had models quietly returning only part of the batch —
    // the untouched segments stayed in the source language and reached the timeline
    // half-translated. 8 is small enough to come back whole.
    var BATCH_SIZE = 8;           // segments per API call
    var REPAIR_BATCH_SIZE = 3;    // second pass, for whatever the first pass skipped
    var REQ_TIMEOUT = 180000;     // 3 min per call
    // Free-tier limits are per MINUTE, so they clear on their own. Waiting is the
    // correct response, not failing the run — 4 retries covers a long transcript.
    var RATE_LIMIT_RETRIES = 4;
    // Groq rejects some default client User-Agents with a 403 — send an explicit
    // one rather than relying on whatever the runtime sets. Verified.
    var UA = "EditFlowPro/1.0";

    var PROVIDER_LABELS = { groq: "Groq", anthropic: "Claude", openai: "GPT" };

    var PROVIDERS = {
        groq: {
            host: "api.groq.com",
            path: "/openai/v1/chat/completions",
            // Groq's free-tier catalog rotates fast (llama-3.3-70b-versatile went
            // 404 mid-session). groq/compound-mini has the roomiest cap at 70,000
            // TPM, but it is an AGENTIC model: it bills output tokens and returns
            // `message.content` EMPTY, so every batch failed with "did not return
            // valid JSON". gpt-oss-20b honours response_format and returns clean
            // JSON. Its cap is only 8,000 TPM, which the rate-limit retry above
            // absorbs by waiting out the minute. Verified live 2026-08-22.
            defaultModel: "openai/gpt-oss-20b",
            key: function() { return settings.groqApiKey || ""; },
            headers: function(k) { return { "Authorization": "Bearer " + k }; },
            body: function(model, sys, userJson) {
                return {
                    // max_tokens counts against the 8,000 TPM cap BEFORE the call
                    // runs: asking for 8,000 made every request "too large" on its
                    // own, a permanent 429 that no amount of waiting could clear.
                    // 3,000 leaves room for the prompt and is far more than a
                    // 12-segment batch needs.
                    model: model, temperature: 0.1, max_tokens: 3000,
                    // gpt-oss is a reasoning model and bills its thinking as output:
                    // 358 tokens for a 3-segment batch at the default, 73 at "low",
                    // for translations of equal quality. That 5x saving is what keeps
                    // a full transcript inside the free tier.
                    reasoning_effort: "low",
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: sys },
                        { role: "user", content: userJson }
                    ]
                };
            },
            extract: function(res) { return res.choices[0].message.content; },
            receipt: function(res) {
                var u = res.usage || {};
                return { model: res.model || "?", id: res.id || "?",
                         tokens: (u.prompt_tokens || 0) + "in/" + (u.completion_tokens || 0) + "out" };
            }
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
            extract: function(res) { return res.choices[0].message.content; },
            receipt: function(res) {
                var u = res.usage || {};
                return { model: res.model || "?", id: res.id || "?",
                         tokens: (u.prompt_tokens || 0) + "in/" + (u.completion_tokens || 0) + "out" };
            }
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
            },
            // The server echoes the model that actually served the request, plus a
            // request id. Logging it is the only way to prove which provider ran —
            // the request we SEND proves nothing on its own.
            receipt: function(res) {
                var u = res.usage || {};
                return { model: res.model || "?", id: res.id || "?",
                         tokens: (u.input_tokens || 0) + "in/" + (u.output_tokens || 0) + "out" };
            }
        }
    };

    function buildSystemPrompt(mode, targetLang) {
        var translating = (mode === "translate" && targetLang);
        // The task headline has to state the OUTPUT LANGUAGE first. When translation
        // was one bullet at the end of a long "correct the Arabic" prompt, smaller
        // models followed the bulk of the prompt and returned corrected Arabic — the
        // request looked ignored even though refinement had run correctly.
        var base = translating
            ? ("You are producing " + targetLang + " subtitles from raw speech-to-text " +
               "output in another language.\n" +
               "EVERY segment you return MUST be written in " + targetLang + ". " +
               "Never return the original language. This is the primary requirement.\n" +
               "Work in two steps: first repair the transcription, then translate the " +
               "repaired text into " + targetLang + ".\n")
            : "You are correcting raw speech-to-text output that will become video subtitles.\n";
        base +=
            "The transcriber is unreliable: it mishears words, invents foreign-looking " +
            "terms, and produces phrases that are grammatically shaped but meaningless.\n" +
            "Rules:\n" +
            "- Fix transcription errors, spelling, punctuation, and (for Arabic) hamza, " +
            "ta-marbuta and madda.\n" +
            "- When a segment does not make sense, it is almost always a mishearing, not " +
            "something the speaker actually said. Use the surrounding segments as context " +
            "and recover the word that was most likely spoken. A stray foreign or " +
            "transliterated word in otherwise ordinary Arabic is a classic mishearing — " +
            "replace it with the Arabic word it was mistaken for.\n" +
            "- Never translate or carry forward a phrase you know is nonsense. Repair it " +
            "first; a plausible reading always beats a faithful copy of garbage.\n" +
            "- Preserve the speaker's meaning, tone and dialect. Do not summarise, " +
            "rephrase for style, or add content.\n" +
            "- Keep each segment's word count as close to the original as possible. " +
            "Subtitle timing is derived from word positions, so adding or removing words " +
            "degrades sync.\n" +
            "- An input segment marked clipBreakAfter:true is the end of a separate " +
            "timeline clip. Do not complete its sentence or carry its context into the " +
            "following segment.\n" +
            "- Return every segment you were given, with its original index.\n";
        if (translating) {
            base +=
                "- The repair step is internal. Return ONLY the " + targetLang +
                " translation as the segment text — never the original wording.\n" +
                "- Keep each translation compact enough to read as a subtitle.\n" +
                "- Translate meaning, not words: render the speaker's intent in natural " +
                targetLang + ".\n";
        }
        base += 'Return ONLY JSON in this exact shape: ' +
                '{"segments":[{"i":<original index>,"text":"<result>"}]}';
        if (translating) base += "\nReminder: every \"text\" value must be in " + targetLang + ".";
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
                    // A quota/size rejection is not a bug — say so plainly so the
                    // user reaches for a different engine instead of filing it as one.
                    if (res.statusCode === 413 || res.statusCode === 429) {
                        return cb("RATE_LIMIT:" + detail);
                    }
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

        // `summary.json` is a FILE PATH, not JSON text. That is the contract the
        // transcriber writes (`"json": json_path`) and the JSX reads back with
        // `new File(efpJsonPath)`. Parsing it as JSON threw on every single run,
        // and the catch below handed the ORIGINAL summary straight back — so the
        // panel placed raw, unrefined captions and reported success. Read the file.
        // Inline JSON is still accepted so any caller that passes text keeps working.
        var docText = String(summary.json || "");
        var srcPath = "";
        if (docText.charAt(0) !== "{") {
            srcPath = docText;
            if (!fsModule) return cb("File access unavailable", summary);
            try { docText = fsModule.readFileSync(srcPath, "utf8"); }
            catch (eRead) { return cb("Could not read the transcript file: " + eRead.message, summary); }
        }
        var doc;
        try { doc = JSON.parse(docText); }
        catch (e) { return cb("Could not read the transcription", summary); }

        var segments = doc.segments || [];
        if (!segments.length) return cb(null, summary);

        var model = (settings.refineModel || "").trim() || provider.defaultModel;
        var translating = (opts.mode === "translate" && !!opts.targetLang);
        var sys = buildSystemPrompt(opts.mode, opts.targetLang);
        var batches = chunk(segments, BATCH_SIZE);
        var done = 0, failed = null;
        var serverReceipt = null;   // what the provider's server reported back
        var results = {};   // original index -> corrected text
        var repairPass = false;     // second pass over whatever the first pass skipped

        // Groq/Whisper can occasionally create a segment whose top-level `text` is
        // empty while its timed `words` still contain the speech. Sending the empty
        // string to the refinement provider skips that speech, then Full Sentence
        // mode rebuilds it from the old word array — producing an Arabic island in
        // an otherwise German translation. Treat the word array as the canonical
        // fallback everywhere refinement compares or submits segment text.
        function sourceText(seg) {
            var direct = String((seg && seg.text) || "").trim();
            if (direct) return direct;
            var words = (seg && seg.words) || [];
            var parts = [];
            for (var sw = 0; sw < words.length; sw++) {
                var word = String((words[sw] && words[sw].text) || "").trim();
                if (word) parts.push(word);
            }
            // An overlapping Whisper boundary can put the first word of the next
            // segment at the end of this word array as well. The real fixture ended
            // with Arabic "جوب" while the next segment's text began "جوب سنتر",
            // which would become "Job | Jobcenter" after translation. Remove the
            // largest short suffix/prefix overlap before submitting the fallback.
            var segIndex = segments.indexOf(seg);
            var nextText = "";
            if (!(seg && seg.timelineBreak === true) &&
                segIndex >= 0 && segIndex + 1 < segments.length) {
                nextText = String(segments[segIndex + 1].text || "").trim();
            }
            if (parts.length && nextText) {
                var nextParts = nextText.split(/\s+/);
                function tokenKey(token) {
                    return String(token || "").toLowerCase()
                        .replace(/^[\s.,!?;:\u060c\u061b\u061f"'()\[\]{}-]+|[\s.,!?;:\u060c\u061b\u061f"'()\[\]{}-]+$/g, "");
                }
                var maxOverlap = Math.min(3, parts.length, nextParts.length);
                for (var ov = maxOverlap; ov > 0; ov--) {
                    var same = true;
                    for (var oi = 0; oi < ov; oi++) {
                        if (!tokenKey(parts[parts.length - ov + oi]) ||
                            tokenKey(parts[parts.length - ov + oi]) !== tokenKey(nextParts[oi])) {
                            same = false; break;
                        }
                    }
                    if (same) { parts.splice(parts.length - ov, ov); break; }
                }
            }
            return parts.join(" ").trim();
        }

        function violatesTargetScript(text) {
            if (!translating) return false;
            var target = String(opts.targetLang || "").toLowerCase();
            // Non-Arabic-script targets must not silently retain Arabic source
            // phrases. Proper names should be transliterated by the model. Persian,
            // Urdu, Pashto and Sindhi legitimately share this Unicode script, so do
            // not reject their output merely because it contains Arabic letters.
            var arabicScriptTarget = {
                arabic: true, persian: true, urdu: true, pashto: true, sindhi: true
            };
            if (!arabicScriptTarget[target] && /[\u0600-\u06ff]/.test(String(text || ""))) return true;
            return false;
        }

        // Segments the model did not actually act on. A missing index is an outright
        // drop; in translate mode an index handed back byte-identical was not
        // translated either. Both reach the timeline in the ORIGINAL language, which
        // is how a run ends up half-translated while reporting success.
        function untouchedIndices() {
            var miss = [];
            for (var mi = 0; mi < segments.length; mi++) {
                if (typeof results[mi] !== "string") { miss.push(mi); continue; }
                if (translating && results[mi] === sourceText(segments[mi])) { miss.push(mi); continue; }
                if (violatesTargetScript(results[mi])) miss.push(mi);
            }
            return miss;
        }

        function runBatch(bi, attempt) {
            if (bi >= batches.length) return finish();
            attempt = attempt || 0;

            var batch = batches[bi];
            var payloadSegs = [];
            for (var k = 0; k < batch.length; k++) {
                var payloadItem = { i: segments.indexOf(batch[k]), text: sourceText(batch[k]) };
                if (batch[k].timelineBreak === true) payloadItem.clipBreakAfter = true;
                payloadSegs.push(payloadItem);
            }
            var userJson = JSON.stringify({ segments: payloadSegs });

            httpJson(provider, apiKey, provider.body(model, sys, userJson), function(err, res) {
                // Groq's free tier caps tokens PER MINUTE, so a transcript of any real
                // length runs out partway through and the whole refinement was thrown
                // away. The 429 body states exactly how long to wait — honour it and
                // retry the same batch instead of losing the work already paid for.
                // Only a limit that says "try again in Xs" is transient. "Request too
                // large" is the same 429 but permanent — the request can never fit,
                // so retrying it just burns a minute per attempt and still fails.
                var waitHint = err ? err.match(/try again in ([\d.]+)s/i) : null;
                if (err && err.indexOf("RATE_LIMIT:") === 0 && waitHint &&
                    attempt < RATE_LIMIT_RETRIES) {
                    var waitS = Math.ceil(parseFloat(waitHint[1])) + 2;
                    if (waitS > 90) waitS = 90;
                    console.warn("[refine] rate limited on batch " + (bi + 1) + "/" + batches.length +
                                 " — waiting " + waitS + "s, then retry " + (attempt + 1) +
                                 "/" + RATE_LIMIT_RETRIES);
                    if (progressCb) progressCb(done, batches.length, "waiting " + waitS + "s (free-tier limit)");
                    return setTimeout(function() { runBatch(bi, attempt + 1); }, waitS * 1000);
                }
                // A failure during the repair pass must not throw away the segments
                // the first pass got right.
                if (err) {
                    if (repairPass) console.warn("[refine] repair pass: " + err);
                    else failed = err;
                    return finish();
                }
                // Record what the SERVER said served this call, not what we asked for.
                try {
                    if (provider.receipt) {
                        var rc = provider.receipt(res);
                        serverReceipt = rc;
                        console.log("[refine] SERVER RECEIPT · host=" + provider.host +
                                    " · model=" + rc.model + " · id=" + rc.id + " · tokens=" + rc.tokens);
                    }
                } catch (eRc) {}
                var raw = "";
                try { raw = provider.extract(res); } catch (e) { failed = "Unexpected provider response"; return finish(); }
                var parsed;
                try { parsed = JSON.parse(raw); }
                catch (e2) {
                    // Some models wrap JSON in prose or a code fence — recover the object.
                    var m = raw.match(/\{[\s\S]*\}/);
                    try { parsed = JSON.parse(m ? m[0] : ""); }
                    catch (e3) {
                        // Print what actually came back. "did not return valid JSON"
                        // with no sample is undiagnosable, and model behaviour here
                        // changes without notice as provider catalogs rotate.
                        console.error("[refine] unparseable reply (first 400 chars): " +
                                      String(raw).slice(0, 400));
                        failed = "Provider did not return valid JSON";
                        return finish();
                    }
                }
                var got = (parsed && parsed.segments) || [];
                for (var g = 0; g < got.length; g++) {
                    var item = got[g];
                    if (typeof item.i === "number" && typeof item.text === "string" && item.text.trim()) {
                        var candidate = item.text.trim();
                        if (violatesTargetScript(candidate)) {
                            console.warn("[refine] rejected segment " + item.i +
                                         ": target=" + opts.targetLang + " still contains Arabic");
                            delete results[item.i];
                        } else {
                            results[item.i] = candidate;
                        }
                    }
                }
                done++;
                if (progressCb) progressCb(done, batches.length);
                runBatch(bi + 1);
            });
        }

        function finish() {
            if (failed) return cb(failed, summary);

            // One retry for whatever came back untouched, in much smaller batches.
            var miss = untouchedIndices();
            if (miss.length && !repairPass) {
                repairPass = true;
                console.warn("[refine] " + miss.length + "/" + segments.length +
                             " segment(s) came back untouched — retrying them in batches of " +
                             REPAIR_BATCH_SIZE);
                var missSegs = [];
                for (var mm = 0; mm < miss.length; mm++) missSegs.push(segments[miss[mm]]);
                batches = chunk(missSegs, REPAIR_BATCH_SIZE);
                done = 0;
                return runBatch(0);
            }
            if (miss.length) {
                console.warn("[refine] " + miss.length + " segment(s) still untouched after the repair pass");
            }
            // Prefer the server-reported model over the one we requested — if these
            // ever disagree, that disagreement is exactly what you want surfaced.
            var servedModel = (serverReceipt && serverReceipt.model) ? serverReceipt.model : model;
            var usedLabel = (PROVIDER_LABELS[opts.provider] || opts.provider) + " (" + servedModel + ")";
            if (serverReceipt) usedLabel += " · " + serverReceipt.tokens;

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

            // Hand back a PATH, never JSON text — fallbackSRT and placeSecondSubtitle
            // pass this value straight to the JSX, which opens it as a file. Write a
            // NEW file instead of overwriting: the raw transcript has to survive for
            // the second-subtitle pass and for diagnosing a bad refinement.
            var outText = JSON.stringify(doc);
            if (srcPath) {
                var tag = opts.targetLang
                    ? opts.targetLang.toLowerCase().replace(/[^a-z0-9]+/g, "")
                    : "fix";
                var newPath = srcPath.replace(/(\.refined\.[a-z0-9]+)?\.efp\.json$/, "") +
                              ".refined." + tag + ".efp.json";
                try { fsModule.writeFileSync(newPath, outText, "utf8"); }
                catch (eW) { return cb("Could not save the refined transcript: " + eW.message, summary); }
                refined.json = newPath;
                console.log("[refine] wrote refined transcript → " + newPath);
            } else {
                refined.json = outText;
            }
            cb(null, refined, { changed: changed, total: segments.length,
                                untouched: miss.length, provider: usedLabel });
        }

        runBatch(0);
    };

    function el2(id) { return document.getElementById(id); }

    // Show only what applies: the mode row when refinement is on, the target
    // language only in translate mode, and only the selected provider's key field.
    window.efpSyncRefineUI = function() {
        var box = el2("cap-refine"), row = el2("cap-refine-row"), hint = el2("cap-refine-hint");
        var dualEl = el2("cap-dual"), langEl = el2("cap-refine-lang");
        var on = !!(box && box.checked);
        if (row) row.style.display = on ? "flex" : "none";
        var provRow = el2("cap-refine-provider-row");
        if (provRow) provRow.style.display = on ? "flex" : "none";
        if (hint) hint.style.display = on ? "block" : "none";
        // The language picker only makes sense once a second subtitle is requested.
        if (langEl) langEl.style.display = (on && dualEl && dualEl.checked) ? "" : "none";

        var prov = el2("cfg-refine-provider");
        var pv = prov ? prov.value : (settings.refineProvider || "groq");
        var aRow = el2("cfg-anthropic-row"), oRow = el2("cfg-openai-row");
        if (aRow) aRow.style.display = (pv === "anthropic") ? "block" : "none";
        if (oRow) oRow.style.display = (pv === "openai") ? "block" : "none";
        var mainProv = el2("cap-refine-provider");
        if (mainProv && mainProv.value !== pv) mainProv.value = pv;
    };

    function initRefineUI() {
        var box = el2("cap-refine"), dualEl = el2("cap-dual"), langEl = el2("cap-refine-lang");
        var mainProvEl = el2("cap-refine-provider");
        if (!box) return;

        box.checked = settings.refineEnabled === true;
        if (dualEl) dualEl.checked = settings.dualSubtitle === true;
        if (langEl) langEl.value = settings.refineLang || "English";
        if (mainProvEl) mainProvEl.value = settings.refineProvider || "groq";

        if (mainProvEl) mainProvEl.addEventListener("change", function() {
            settings.refineProvider = mainProvEl.value; saveSettings();
            // Keep the Settings-panel dropdown in sync so both controls always
            // agree — the split between them is the exact bug this fixes.
            var settingsProvEl = el2("cfg-refine-provider");
            if (settingsProvEl) settingsProvEl.value = mainProvEl.value;
            window.efpSyncRefineUI();
        });

        box.addEventListener("change", function() {
            settings.refineEnabled = box.checked; saveSettings(); window.efpSyncRefineUI();
        });
        if (dualEl) dualEl.addEventListener("change", function() {
            settings.dualSubtitle = dualEl.checked; saveSettings(); window.efpSyncRefineUI();
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
        var dualEl = document.getElementById("cap-dual");
        var langEl = document.getElementById("cap-refine-lang");
        var provEl = el2("cap-refine-provider");
        var provider = (provEl && provEl.value) ? provEl.value : (settings.refineProvider || "groq");
        var wantsSecond = !!(dualEl && dualEl.checked && langEl);
        // "Spoken" tells Whisper what language to LISTEN for; it is not an output
        // choice. Translating the main subtitle is a separate, explicit request —
        // conflating the two silently gave the user the spoken language back and
        // looked like the setting was ignored.
        return {
            provider: provider,
            // The output language is decided by the "Spoken" dropdown alone (see the
            // rule in withRefinement): pick the spoken language for a transcript,
            // pick a different one for a translation. A separate "translate into"
            // control duplicated that exactly, so it was removed.
            mode: "fix",
            targetLang: "",
            secondLang: wantsSecond ? langEl.options[langEl.selectedIndex].text : ""
        };
    };
})();
