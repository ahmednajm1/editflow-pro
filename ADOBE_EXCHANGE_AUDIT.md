# EditFlow Pro — ملف تدقيق وإطلاق Adobe Exchange
**الإصدار:** v17 | **التاريخ:** مايو 2026 | **الحالة:** قيد المراجعة

---

## 📋 نظرة عامة على العملية

```
بناء ZXP → اختبار محلي → تجهيز الأصول → رفع على Exchange → مراجعة Adobe (3-10 أيام) → نشر
```

---

## 1. حزمة ZXP ✦ الأعلى أولوية

### 1.1 متطلبات الملف

| العنصر | الحالة | الملاحظة |
|--------|--------|----------|
| `ZXPSignCmd` مثبّت | ⬜ | تحميل من Adobe-CEP/CEP-Resources |
| شهادة `.p12` صالحة | ⬜ | الحالية self-signed — مقبولة للإصدار الأول |
| TSA timestamp مضمّن | ⬜ | موجود في `build_zxp.sh` (geotrust) |
| حجم ZXP < 200 MB | ⬜ | تحقق بعد البناء |
| `manifest.xml` صحيح | ✅ | موجود في CSXS/ |

### 1.2 تشغيل البناء

```bash
# من مجلد المشروع:
bash build_zxp.sh

# التحقق من النتيجة:
ls -lh EditFlowPro_v*.zxp
```

### 1.3 مشاكل محتملة في ZXP

| المشكلة | الحل |
|---------|------|
| `ZXPSignCmd` غير موجود | `brew install --cask adobe-zxp-sign-cmd` أو تحميل يدوي |
| الشهادة منتهية | إعادة توليد: `ZXPSignCmd -selfSignedCert` |
| TSA فشل الاتصال | استبدل بـ `http://timestamp.digicert.com` |
| ملفات `.git` داخل ZXP | أضف `.gitignore` للاستبعاد قبل البناء |

### 1.4 استبعاد ملفات من ZXP

أضف هذه الملفات لاستبعادها قبل التوقيع:

```
.git/
.gitignore
ADOBE_EXCHANGE_AUDIT.md
bin/.build_venv*/
bin/.build_work/
bin/.build_spec/
*.sh (اختياري)
BUSINESS_PLAN.md
EDITFLOW_STATE.md
```

---

## 2. manifest.xml — مراجعة نقدية

### الحالة الحالية

```xml
ExtensionBundleId="com.editflowpro.panel"
ExtensionBundleVersion="17.0.0"
Host Name="PPRO" Version="[15.0,99.9]"
RequiredRuntime Name="CSXS" Version="9.0"
```

### نقاط تحتاج تعديل قبل الرفع

| النقطة | المشكلة | الإصلاح |
|--------|---------|---------|
| `ExtensionBundleVersion="17.0.0"` | رقم عالي جداً للإصدار الأول | غيّر لـ `1.0.0` أو `1.7.0` |
| `Extension Id` version="1.0" | يخالف bundle version | وحّدهما |
| `--enable-nodejs` في CEF | يثير تساؤلات الأمان | ضروري — وثّق سبب الاستخدام |
| لا يوجد `<Author>` | مطلوب في Exchange | أضف بيانات المطوّر |

### manifest.xml المُحسَّن

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="11.0"
  ExtensionBundleId="com.najmedia.editflowpro"
  ExtensionBundleVersion="1.0.0"
  ExtensionBundleName="EditFlow Pro"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Author>Ahmed Najm — Najm Media</Author>
  <Contact mailto="najmmediaa@gmail.com"/>
  <Legal href="https://najmedia.com/editflow-pro/privacy"/>
  <Abstract>AI captions, audio control, export engine, and screen capture — all in one Premiere Pro panel.</Abstract>
  ...
```

---

## 3. متطلبات Adobe Exchange — قائمة التحقق الكاملة

### 3.1 معلومات المنتج الأساسية

| العنصر | مطلوب | الحالة | الملاحظة |
|--------|--------|--------|----------|
| اسم الإضافة | ✅ | ✅ | EditFlow Pro |
| معرّف فريد (Bundle ID) | ✅ | ⚠️ | تغيير لـ `com.najmedia.editflowpro` |
| رقم الإصدار | ✅ | ⚠️ | تعديل لـ 1.0.0 |
| فئة المنتج | ✅ | ⬜ | اختر: Workflow / Automation |
| الوصف (إنجليزي) | ✅ | ⬜ | انظر القسم 4 |
| الوصف (عربي) | اختياري | ⬜ | انظر القسم 4 |
| سعر البيع | ✅ | ✅ | $49 |
| سياسة الخصوصية URL | ✅ | ⬜ | انظر القسم 6 |
| رابط الدعم | ✅ | ⬜ | najmedia.com أو بريد إلكتروني |
| رابط الموقع | ✅ | ⬜ | najmedia.com/editflow-pro |
| إصدارات Premiere المدعومة | ✅ | ✅ | 15.0+ |

### 3.2 الأصول المرئية

| الأصل | الأبعاد | الصيغة | الحالة |
|-------|---------|--------|--------|
| أيقونة المنتج (صغيرة) | 96×96 px | PNG شفاف | ⬜ |
| أيقونة المنتج (كبيرة) | 512×512 px | PNG شفاف | ⬜ |
| لقطة شاشة 1 (رئيسية) | 1280×800 px | PNG/JPG | ⬜ |
| لقطة شاشة 2 | 1280×800 px | PNG/JPG | ⬜ |
| لقطة شاشة 3 | 1280×800 px | PNG/JPG | ⬜ |
| صورة الغلاف (Banner) | 1600×400 px | PNG/JPG | ⬜ |

#### محتوى لقطات الشاشة المقترح

```
لقطة 1 — الواجهة الكاملة: الـ panel مفتوح داخل Premiere مع كل الأقسام ظاهرة
لقطة 2 — AI Captions: قيد التشغيل مع نتيجة ترجمة عربية على التايم لاين
لقطة 3 — Audio Leveling: الأزرار مع مقطع صوتي محدد
لقطة 4 — Export Engine + Paste from Web
لقطة 5 — إعدادات اللغة (EN/AR toggle)
```

---

## 4. النصوص التسويقية

### 4.1 الوصف القصير (160 حرف — للبطاقة)

```
EditFlow Pro — AI captions, one-click audio control, fast export, and screen capture. Everything you need in one Premiere Pro panel.
```

### 4.2 الوصف الكامل (إنجليزي)

```
EditFlow Pro is a professional Premiere Pro panel built for video editors 
who value speed and precision.

KEY FEATURES:

🤖 AI Captions (Powered by Groq Whisper)
Transcribe any clip in seconds. Supports 15+ languages including Arabic 
with full RTL support. Get perfectly synced, editable SRT subtitles 
directly on your timeline — no external apps needed.

🎚️ Audio Leveling
Instant audio control with smart presets: Voice (-6dB), SFX (-12dB), 
Background Music (-25dB). Fine-tune with precision nudge buttons without 
opening Audio Gain every time.

📸 Paste & Capture
Copy any image from the web and paste it directly into your Premiere 
project in one click. Capture the current timeline frame with all effects 
applied to your clipboard instantly.

📐 Transform & Scale
Resize, reposition, and adjust clips from one panel. Quick scale presets 
(115% to 200%), directional nudge with configurable step sizes, Fit Screen 
and Center Anchor Point tools.

🚀 Export Engine
Export selected clips in seconds without opening the heavy export window. 
Set your filename, bitrate, and default export path once — reuse forever.

TECHNICAL DETAILS:
- Requires a free Groq API key for AI Captions (takes 2 minutes to set up)
- Compatible with Adobe Premiere Pro 2021 and later (CEP 9–12)
- macOS and Windows supported
- One-time purchase — no subscription
- 7-day money-back guarantee
```

### 4.3 الوصف العربي (اختياري لكن ميزة)

```
EditFlow Pro — إضافة احترافية لـ Adobe Premiere Pro تختصر ساعات من 
العمل المتكرر في نافذة واحدة.

المميزات الرئيسية:

🤖 كابشن ذكي بالذكاء الاصطناعي
حوّل الصوت إلى ترجمة قابلة للتعديل خلال ثوانٍ. يدعم العربية مع RTL 
كامل و+15 لغة أخرى.

🎚️ تحكم فوري بالصوت
اضبط مستوى الصوت بضغطة واحدة — بريسيتات جاهزة للصوت والمؤثرات 
والموسيقى الخلفية.

📸 لصق الصور والتقاط الشاشة
انسخ أي صورة من الإنترنت وأدخلها مباشرة لمشروعك. التقط أي فريم 
بكل تأثيراته لحافظتك بضغطة واحدة.

🚀 تصدير سريع
صدّر المقطع المحدد في ثوانٍ بدون فتح نافذة التصدير الثقيلة.

دفعة واحدة — بدون اشتراك شهري | ضمان 7 أيام
```

---

## 5. نقاط الرفض المحتملة وكيف تُخففها

### 🔴 عالية الخطورة

| نقطة الرفض | سبب المخاوف | التخفيف |
|------------|-------------|---------|
| **تنفيذ binary خارجي** (`whisper_runner`) | Adobe تشك في malware | أضف في الوصف: "Uses a sandboxed binary for AI processing" + وثّق في Privacy Policy |
| **تحميل ملفات عند التشغيل** (ffmpeg auto-download) | سلوك غير متوقع | أضف modal إذن صريح قبل التحميل الأول |
| **طلبات API خارجية** (Groq) | يحتاج إفصاح كامل | مذكور في Privacy Policy + وصف المنتج |
| **`PlayerDebugMode = 1`** | الإضافة تعتمد على وضع debug | **هذا الأكبر** — انظر التفاصيل أدناه |

#### ⚠️ مشكلة PlayerDebugMode — الأهم

```
Install.sh يُشغّل:
defaults write com.adobe.CSXS.12 PlayerDebugMode 1

هذا يعني الإضافة لن تعمل بدونه على أجهزة جديدة.
Adobe Exchange تتطلب أن الإضافة تعمل بدون PlayerDebugMode.
```

**الحل المطلوب قبل الرفع:**
- توقيع ZXP بشهادة Adobe Exchange معتمدة (ليس self-signed)
- الإضافة الموقّعة رسمياً لا تحتاج PlayerDebugMode

### 🟡 متوسطة الخطورة

| نقطة الرفض | التخفيف |
|------------|---------|
| **لا توجد أيقونة رسمية** | أنشئ أيقونة 96×96 و512×512 |
| **Bundle ID غير احترافي** | غيّر لـ `com.najmedia.editflowpro` |
| **رقم الإصدار 17.0.0** | ابدأ بـ 1.0.0 على Exchange |
| **لا يوجد changelog** | أضف `CHANGELOG.md` |
| **Windows غير مختبر** | إما اختبر فعلياً أو احذف من الوصف مؤقتاً |

### 🟢 منخفضة الخطورة

| النقطة | الملاحظة |
|--------|----------|
| دعم RTL/عربي | ميزة إيجابية، وثّقها |
| Groq API مجاني | أذكر ذلك صراحة: "Free API key required" |
| خطأ تثبيت بسيط | وفّر دليل استكشاف أخطاء واضح |

---

## 6. سياسة الخصوصية — المسودة

**انشر هذا النص على:** `najmedia.com/editflow-pro/privacy`

```
EditFlow Pro — Privacy Policy
Last updated: May 2026

1. DATA COLLECTED
EditFlow Pro collects no personal data. All processing happens locally 
on your machine.

2. AUDIO PROCESSING
When you use the AI Captions feature, audio from your selected clip is 
sent to Groq API (api.groq.com) for transcription. This audio is 
processed by Groq and is subject to Groq's Privacy Policy 
(groq.com/privacy). No audio is stored by EditFlow Pro or Najm Media.

3. API KEYS
Your Groq API key is stored locally in your extension settings file 
on your machine. It is never transmitted to Najm Media servers.

4. AUTOMATIC DOWNLOADS
On first use, EditFlow Pro may download a small helper binary (ffmpeg) 
required for audio processing. This download comes from trusted open-source 
repositories (github.com/eugeneware/ffmpeg-static).

5. ANALYTICS
EditFlow Pro does not collect usage analytics or telemetry.

6. CONTACT
Ahmed Najm — Najm Media
najmmediaa@gmail.com
```

---

## 7. خطة الإطلاق المرحلية

### المرحلة 1 — قبل الرفع (أسبوع)

```
⬜ توليد أيقونة احترافية 96×96 + 512×512
⬜ التقاط 3-5 لقطات شاشة بالأبعاد الصحيحة
⬜ نشر سياسة الخصوصية على najmedia.com
⬜ تعديل manifest.xml (Bundle ID + الإصدار)
⬜ استبعاد ملفات dev من ZXP
⬜ بناء وتوقيع ZXP
⬜ اختبار ZXP على جهاز نظيف
```

### المرحلة 2 — الرفع

```
⬜ إنشاء حساب Adobe Exchange Partner
⬜ رفع ZXP
⬜ إدخال جميع نصوص الوصف (EN + AR)
⬜ رفع الأصول المرئية
⬜ تحديد الفئة والسعر ($49)
⬜ ربط سياسة الخصوصية + الدعم
⬜ إرسال للمراجعة
```

### المرحلة 3 — بعد القبول (أو الرفض)

```
⬜ إذا قُبل: نشر رابط Exchange على الصفحة + تحديث install.sh
⬜ إذا رُفض: مراجعة سبب الرفض + إصلاح + إعادة رفع
```

---

## 8. بدائل Exchange إذا رُفضت

| البديل | المميزات | العيوب |
|--------|----------|--------|
| **البيع المباشر (الحالي)** | تحكم كامل، لا رسوم | اكتشافية أقل |
| **Gumroad** | سريع، موثوق | لا تكامل مع Adobe |
| **Creative Market** | جمهور مستهدف | عمولة 30% |
| **إصدار مجاني + Pro** | قاعدة مستخدمين أكبر | عمل إضافي |

---

## الملاحظة الأهم

**PlayerDebugMode هو العائق الوحيد الحقيقي أمام Exchange.**
كل شيء آخر قابل للحل. هذه المشكلة تحتاج إما:
- شهادة توقيع Adobe الرسمية (تحتاج حساب Developer معتمد)
- أو الاكتفاء بالبيع المباشر حتى تُحل مشكلة التوقيع

الوضع الحالي (بيع مباشر من najmedia.com) **جيد تماماً كإصدار أول** — Exchange يأتي لاحقاً.
