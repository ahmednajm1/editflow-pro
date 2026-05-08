# EditFlow Pro - Project State & Context (v17)

هذا الملف يعمل كـ "ذاكرة" للمحادثات الجديدة لضمان استمرار العمل من حيث توقفنا دون فقدان السياق.

## 📌 معلومات المشروع الأساسية
- **النوع:** إضافة (CEP Extension) لبرنامج Adobe Premiere Pro.
- **العلامة التجارية:** Najm Media
- **الإصدار:** v17
- **اللغات المستخدمة:** HTML, CSS, JavaScript (Frontend) / ExtendScript JSX (Backend) / Python (AI binaries)
- **المسار الرئيسي:** `/Users/ahmed/Downloads/Remotion/EditFlowPro`
- **مسار التثبيت في النظام:** `$HOME/Library/Application Support/Adobe/CEP/extensions/EditFlowPro/`
- **GitHub Repo:** `ahmednajm1/editflow-pro` (public)

## ✅ الميزات الحالية المعتمدة في الواجهة (حسب الترتيب)
1. **🔊 Audio Level:** نظام Nudge (▲ +1 dB / ▼ -1 dB) للتحكم الدقيق بمستوى الصوت.
2. **🖼️ Static Scale (Cut-in):** أزرار جاهزة للتكبير السريع بدون Keyframes (115%, 130%, 150%, 175%, 200%).
3. **📐 Transform & Tools:** أسهم Nudge للتحريك بالبكسل + إدخال يدوي لـ Scale + زر Reset.
4. **🌐 Paste from Web:** النسخ واللصق المباشر للصور من الإنترنت إلى Project Bin.
5. **📤 Export Engine:** تصدير المحدد أو الكل مع تحكم بالاسم والجودة والمسار.
6. **🤖 AI Captions:** ترجمة بالذكاء الاصطناعي (Whisper) بوضعين: Video Overlay (MOV) و Editable Subtitles (SRT). يدعم 13+ لغة مع 9 أنماط حركة و11 خط.

## ❌ ميزات تمت إزالتها
- **AI Beat Detection:** أُزيل في v16 — نتائج غير دقيقة تضر بجودة الإضافة.
- **Upgrade Caption to Graphic (زر):** أُزيل — Adobe عطّلت الأمر البرمجي في أحدث الإصدارات. استُبدل بملاحظة نصية ترشد المستخدم.
- **Auto-Cut Silence:** أُلغي — لم يعد مخططاً له. حُذف dead code (`parseFFmpegSilence`) من `main.js`.
- **Speed Controls:** أُلغي — لم يعد مخططاً له.

## ⚠️ مشاكل تم حلها (تسلسل زمني)

### 1. ffmpeg 403 Forbidden
- **السبب:** الرابط القديم `ffmpeg.martin-riedl.de` يرفض التحميل.
- **الحل:** إعادة كتابة `download_ffmpeg()` في `bin/transcriber.py` بنظام fallback chain:
  - المصدر الأول: `github.com/eugeneware/ffmpeg-static` (binary مباشر)
  - المصدر الثاني: `evermeet.cx/ffmpeg` (zip)
  - يدعم arm64 و x86_64 — يزيل quarantine تلقائياً.

### 2. whisper_runner مفقود
- **السبب:** `install.sh` القديم المثبّت كان يضع `whisper_runner` في مسار خاطئ.
- **الحل:** إعادة بناء البايناري عبر PyInstaller + تأكيد أن `install.sh` المصدري يحمّله من GitHub Releases.

### 3. ggml backend plugins مفقودة (الأصعب)
- **الخطأ:** `GGML_ASSERT(device) failed` + `search path /opt/homebrew/Cellar/ggml/0.10.1/libexec does not exist`
- **السبب:** `libggml.0.dylib` يحتوي مسار Homebrew hardcoded (40 bytes). بدون Homebrew = لا backends = فشل.
- **الحل (3 خطوات):**
  1. **Binary patch** على `libggml.0.dylib` عند offset `0x43f9` — استبدال:
     ```
     /opt/homebrew/Cellar/ggml/0.10.1/libexec
     ```
     بـ:
     ```
     /Users/Shared/EditFlowPro/lib///////////
     ```
     (29 حرف + 11 slashes = 40 byte — slashes مقبولة في POSIX ولا تقطع الـ string كـ nulls)
  2. **تجميع 7 backend plugins** في `ggml_plugins.tar.gz` مع تعديل `install_name_tool` لكل منها لاستخدام `@loader_path` وإعادة توقيعها.
  3. **تحديث `install.sh`** لينشئ `/Users/Shared/EditFlowPro/lib/` ويحمّل ويفك الـ tar.gz.

### 6. whisper_runner يستدعي Homebrew whisper-cli (السبب الجذري الحقيقي)
- **الخطأ المستمر:** `search path /opt/homebrew/Cellar/ggml/0.10.1/libexec does not exist`
- **السبب:** `find_whisper_cli()` في `transcriber.py` كانت تحتوي fallback لـ `shutil.which()` و `/opt/homebrew/bin/whisper-cli`. على أجهزة المشترين الذين لديهم Homebrew مع whisper مثبَّت → يجد نسخة Homebrew → تحمّل libggml الخاص بـ Homebrew (غير patched) → يبحث عن backends في `/opt/homebrew/Cellar/ggml/0.10.1/libexec` غير الموجود → فشل.
- **الحل:**
  1. حذف steps 3+4 من `find_whisper_cli()` (System PATH + Homebrew paths) — نستخدم فقط مسارات EditFlowPro
  2. إعادة بناء `whisper_runner` (PyInstaller) ورفعه على GitHub
  3. تحديث الـ installer: `rm -rf $EFP_DATA/lib` قبل النسخ + `chmod -R a+rX` بدل `u+rX`
  4. رفع DMG و command محدَّثَين على GitHub

**جميع الأصول على GitHub محدَّثة بتاريخ 2026-05-06 17:35+.**
- **الخطأ:** `ggml_backend_load_best: search path /opt/homebrew/Cellar/ggml/0.10.1/libexec does not exist` على أجهزة المشترين
- **السبب المكتشف:** `EditFlowPro_Installer.dmg` المرفوع على GitHub كان يحتوي `Install EditFlow Pro.command` القديم (5722 bytes — May 6 03:07) بدون كود `ggml_plugins.tar.gz`. المستخدم يشغّل الـ DMG القديم → لا تُنزَّل الـ plugins → يفشل whisper-cli.
- **سبب ثانٍ:** `chmod -R u+rX` كان يضع الصلاحيات للمستخدم المثبِّت فقط، وليس لجميع المستخدمين.
- **الحل:**
  1. إعادة بناء `EditFlowPro_Installer.dmg` بالـ command الجديد (7014 bytes)
  2. تغيير `chmod -R u+rX` → `chmod -R a+rX` + `chmod a+x *.so` في كلٍّ من `Install EditFlow Pro.command` و `install.sh`
  3. رفع 3 ملفات على GitHub release v16: `EditFlowPro_Installer.dmg`, `Install EditFlow Pro.command`, `install.sh`

## 🗂 بنية الملفات بعد التثبيت

```
~/Library/Application Support/Adobe/CEP/extensions/EditFlowPro/
  ├── client/           ← واجهة المستخدم
  ├── jsx/              ← ExtendScript backend
  └── bin/
      ├── whisper-cli   ← محرك التعرف على الكلام (arm64)
      └── lib/
          ├── libwhisper.1.dylib
          ├── libggml.0.dylib         ← مُعدَّل (binary patched)
          └── libggml-base.0.dylib

~/Library/Application Support/EditFlowPro/   ← دائم (لا يُحذف عند التحديث)
  ├── whisper_runner      ← PyInstaller binary (6.4 MB)
  ├── caption_renderer    ← PyInstaller binary (18 MB)
  ├── whisper-cli
  ├── lib/*.dylib
  └── whisper_models/     ← تُحمَّل عند أول استخدام

/Users/Shared/EditFlowPro/lib/   ← ggml backends (مشترك بين كل المستخدمين)
  ├── libggml-blas.so
  ├── libggml-metal.so
  ├── libggml-cpu-apple_m2_m3.so
  ├── libggml-cpu-sandybridge.so
  ├── libggml-cpu-haswell.so
  ├── libomp.dylib
  └── libggml-base.0.dylib
```

## 📦 أصول GitHub Releases الحالية (v16/v17)

| الملف | الحجم | التاريخ | الحالة |
|-------|-------|---------|--------|
| `EditFlowPro.zip` | 661 KB | 2026-05-06 | ✅ مُحدَّث (libggml patched) |
| `whisper_runner` | 3.7 MB | 2026-05-07 | ✅ مُحدَّث (Groq API, لا يعتمد على requests) |
| `caption_renderer` | 18 MB | 2026-05-05 | ⚠️ قديم (يعمل حالياً كـ fallback) |
| `Install EditFlow Pro.command` | 7.1 KB | 2026-05-07 | ✅ مُحدَّث (لا يحمل نماذج لغوية ضخمة) |
| `EditFlowPro_Installer.dmg` | 20 KB | 2026-05-07 | ✅ مُعاد بناؤه بالملفات الجديدة |

## 🏗️ التغيير الجوهري في معمارية الكابشن (v16 إلى v17)
تم الانتقال بالكامل من **Local ML (whisper-cli)** إلى **Cloud API (Groq)**:
- **السبب:** تقليل حجم الإضافة، التخلص من مشاكل توافقية بايثون ومعالجات ماك، وحل أخطاء التثبيت وتنزيل النماذج التي تتجاوز 3 جيجابايت.
- **التنفيذ:** 
  - تمت كتابة `whisper_runner` جديد بلغة بايثون يعتمد على `urllib.request` المدمج لطلب ترجمة سريعة من سيرفرات Groq (Whisper Large v3).
  - تم تخطي حظر Cloudflare 1010 بإضافة `User-Agent`.
  - تم التخلص من مكتبة `requests` لتجنب خطأ `NotOpenSSLWarning`.
  - تم معالجة طلبات Groq التي تعيد `null` للفيديوهات الصامتة.
  - تم إضافة خانة 🔑 **Groq API Key** في واجهة الإعدادات داخل البريميير وربطها بـ `main.js`.
  - لا توجد أي نماذج لغوية مرفقة مع الإضافة بعد الآن. 

## 🚧 مهام معلقة
1. **متابعة أداء Groq API** — التأكد من عدم تجاوز حدود الحجم (25 ميجابايت) واستقرار عملية تقطيع الملفات الطويلة (Chunking).
2. **`caption_renderer` يحتاج ترقية مستقبلية** — إذا أردنا التخلص التام من الباينري القديم وتوليد نصوص بطريقة أنيقة بدون مشاكل الخطوط.

## 🚨 قواعد حرجة للـ agent
- `jsx/hostscript.jsx` → **ES3 فقط** — لا `const`/`let`/arrow functions
- **لا تستخدم** `app.beginUndoGroup()` — يكسر Premiere
- المصدر في `/Users/ahmed/Downloads/Remotion/EditFlowPro/` — بعد أي تعديل يجب نسخه إلى CEP path
- أي تعديل على `transcriber.py` يتطلب إعادة بناء `whisper_runner` عبر PyInstaller. لا تستخدم مكاتب خارجية غير مدمجة إلا للضرورة القصوى لتجنب حجم الباينري الكبير.

## 🚀 كيفية الاستخدام في المحادثات القادمة
عند فتح محادثة جديدة، قم بنسخ هذه الجملة للـ AI:
> "مرحباً، نحن نعمل على إضافة EditFlow Pro. يرجى قراءة ملف `EDITFLOW_STATE.md` الموجود في المجلد الرئيسي لتفهم السياق كاملاً وما فعلناه بخصوص Groq API، ثم دعنا نكمل العمل على..."
