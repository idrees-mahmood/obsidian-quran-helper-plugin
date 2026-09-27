# Quran Helper — bilingual development fork

Based on [Ammar Alakkad’s Quran Helper](https://github.com/AmmarCodes/obsidian-quran-helper-plugin).
Original MIT code attribution is retained. This branch adds offline English support;
it is a development build, not an upstream or community-directory release.

## New in this fork

- Search Arabic text, English translation words (case/punctuation insensitive), English surah names, or references such as `2:255` and `٢:٢٥٥`.
- Insert a custom range with **Insert Ayah**: type `2:255-257` (or `٢:٢٥٥-٢٥٧`) and select the single range result. Both endpoints are included. Ranges must stay within one surah; invalid or incomplete ranges insert nothing. Single-ayah note/link commands remain single-ayah only.
- Preview Arabic and your selected English translation in the ayah picker.
- Choose **Arabic only**, **English only**, or **Arabic + English** under **Settings → Quran Helper → Output language**. Arabic-only remains the default for existing installations.
- The language setting applies to individual ayahs, full surahs, page selections, full pages, and newly created ayah notes, in callout, blockquote and inline formats.
- English output includes translator attribution; one compact passage reference and source link replaces the repeated reference under each ayah. The output is saved as Markdown with inline language/direction spans, so text remains readable without the plugin.
- All 6,236 verses in each English edition are bundled locally. No API key, account, or runtime network request is needed for lookup or insertion. Clicking a source link opens its website.

Choose **Saheeh International** (default) or **M. Pickthall** under Settings → Quran Helper → English translation. The selection is saved and applies to search, previews and all new insertions. Existing notes keep their original text and attribution. The English corpora are Tanzil’s `en.sahih` and `en.pickthall` editions. Their download terms are for non-commercial use: see [TRANSLATION-NOTICE.md](TRANSLATION-NOTICE.md). Those content terms are separate from the MIT code license. Slash completion, hadith and tafsir are not included in this first build.

## Try this build

1. Prefer a test vault first. If replacing Quran Helper in an existing vault, back up its plugin folder and settings.
2. Copy `main.js`, `manifest.json` and `styles.css` into `<vault>/.obsidian/plugins/quran-helper/`, retaining the translation notice alongside the files. The ZIP contains the `quran-helper` folder already.
3. Reload Obsidian and enable **Quran Helper** in Community plugins.
4. Set **Output language → Arabic + English**, then use **Quran Helper: Insert Ayah** from the Command Palette.
5. Search `1:1`, `Lord of the Worlds`, or `Al-Fatihah`, and select a result. `Mod+Enter` inserts inline.

The plugin ID is deliberately unchanged (`quran-helper`), so this replaces the upstream plugin rather than installing alongside it. An upstream community-plugin update can replace this fork. Existing notes are never migrated or rewritten.

## Development and validation

`npm ci`, then `npm run build`, `npm test -- --runInBand`, `npm run lint`, and `npm run prettier:ci`.
Builds use the checked-in corpus and do not fetch/rewrite Arabic data. The existing `npm run enrich` command remains an explicit maintenance operation requiring network access.
The bilingual tests cover all output modes, safe markup, corpus completeness, missing records, attribution, reference lookup, and English/Arabic search. Desktop/mobile visual acceptance in Obsidian remains a manual check before a public release.

---

# إضافة Quran Helper

إضافة لـ Obsidian يساعدك على العثور على إدراج آيات القرآن في ملاحظاتك.

---

## Quran Helper (English)

A plugin for Obsidian that helps you search and insert Quran ayahs and surahs into your notes. Supports fuzzy search by ayah text, surah name, or numeric reference, with multiple output formats.

### Features

- Fuzzy search for ayahs by Arabic text, surah name, or reference number
- Insert ayahs as blockquote, callout, or inline text
- Search and insert full surahs
- Search and insert by page number (1—604)
- Create ayah notes linked to your vault
- Customizable output format and callout type
- Offline-first, works without internet

### Installation

1. Open Obsidian Settings
2. Go to Community Plugins → Browse
3. Search for "Quran Helper"
4. Click Install then Enable

### Usage

- **Insert Ayah** — Search and insert a specific ayah
- **Insert Surah** — Search and insert a full surah
- **Insert Page** — Search and insert by page number
- **Create Ayah Note** — Create a standalone note for an ayah
- Press `Mod+Enter` (Cmd/Ctrl) to insert inline without changing your default format

---

## لقطات الشاشة

### 1) بدء الإدراج

| من Command Palette                                                            | من Ribbon                                                   |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| ![بدء إدراج آية من Command Palette](./assets/screenshots/command-palette.png) | ![بدء إدراج آية من Ribbon](./assets/screenshots/ribbon.png) |

### 2) البحث عن الآية

![البحث عن آية بمطابقة جزئية](./assets/screenshots/search.png)

### 3) شكل الناتج بعد الإدراج

![نماذج تنسيق إدراج الآيات (Callout و Blockquote)](./assets/screenshots/rendered.png)

### 4) الإدراج المدمج (Inline)

يمكنك إدراج الآية كنص مدمج داخل الفقرة بدلاً من كتلة منفصلة:

استخدم `Mod+Enter` (Cmd على Mac / Ctrl على Windows) عند اختيار الآية لإدراجها بهذا الشكل.

### 5) نمط إضافة لقطات الميزات الجديدة

لتحسين تجربة القراءة مع زيادة عدد الصور، أضف كل ميزة جديدة بنفس التسلسل:

1. **بدء الميزة** (الأمر أو الأيقونة)
2. **البحث/الاختيار** داخل النافذة
3. **النتيجة النهائية** داخل الملاحظة

يفضل أن تكون أسماء الملفات وصفية وثابتة، مثل:

- `surah-start-command-palette.png`
- `surah-search.png`
- `surah-rendered.png`

## الميزات

- إدراج آية محددة في الملاحظة عبر `Insert Ayah (إدراج آية)`
- إدراج سورة كاملة عبر `Insert Surah (إدراج سورة)`
- إدراج صفحة من المصحف (1-604) كاملة أو اختيار آية منها عبر `Insert Page (إدراج صفحة)`
- إنشاء ملاحظة مستقلة لآية محددة عبر `Create Ayah Note (إنشاء ملاحظة آية)`
- ثلاث صيغ إدراج: Callout، Blockquote، ومدمج (Inline)
- إدراج مدمج سريع عبر `Mod+Enter` (Cmd/Ctrl) دون تغيير الإعدادات
- بحث سريع بمطابقة جزئية (Fuzzy) يدعم التطبيع العربي والبحث بالأرقام (رقم السورة/الآية/الصفحة)
- يعمل بالكامل دون اتصال بالإنترنت

## الإعدادات

من إعدادات الإضافة يمكنك التحكم في:

- **صيغة الإدراج**: `Callout` أو `Blockquote` أو `Inline` (المدمج)
- **نوع الـ Callout**: مثل `quran-ayah` أو أي نوع آخر مدعوم في Obsidian
- **إعدادات ملاحظة الآية**:
  - مجلد حفظ الملاحظة
  - نمط اسم/مسار الملف:
    - `surah-ayah` (مثل `Al-Mulk-1`)
    - `surah/ayah` (مثل `Al-Mulk/1`)
    - `arabic-ayah` (مثل `الملك-1`)
    - `arabic/ayah` (مثل `الملك/1`)
  - وسوم تلقائية (Tags) للملاحظات الجديدة

## التثبيت

يمكن تثبيت الإضافة مباشرةً من [community plugins](https://obsidian.md/plugins?id=quran-helper).

1. افتح إعدادات Obsidian
2. انتقل إلى `Community plugins`
3. ابحث عن `Quran Helper`
4. انقر على `Install` ثم `Enable`

## الاستخدام

- افتح [Command Palette](https://help.obsidian.md/Plugins/Command+palette) ثم اختر أحد الأوامر:
  - `Insert Ayah (إدراج آية)`
  - `Insert Surah (إدراج سورة)`
  - `Insert Page (إدراج صفحة)`
  - `Create Ayah Note (إنشاء ملاحظة آية)`
- أو استخدم أيقونات الشريط الجانبي ([Ribbon](https://help.obsidian.md/ribbon)) المقابلة لكل عملية
- **إدراج مدمج سريع**: عند ظهور نافذة البحث، اضغط `Mod+Enter` (Cmd على Mac / Ctrl على Windows) لإدراج النص بشكل مدمج `{ الآية } – السورة الرقم` بغض النظر عن الإعداد الافتراضي
- في إدراج الصفحة: اختر الصفحة أولاً ثم حدّد إدراج الصفحة كاملة أو آية واحدة منها
- في إنشاء ملاحظة آية: اختر الآية وسيتم إنشاء ملف جديد حسب إعداداتك

## الاختلاف عن إضافة [Obsidian Quran Lookup Plugin](https://github.com/abuibrahim2/quranlookup)

- هذه الإضافة لا تتطلب تنسيق `Surah:Ayah`
- تدعم إدراج السورة كاملة وإدراج الصفحة مع اختيار آيات منها
- تدعم إنشاء ملاحظات آيات تلقائياً مع أنماط أسماء ووسوم قابلة للتخصيص
- لا يتطلب اتصالاً بالإنترنت
- يمكن البحث بمطابقة جزئية في محتوى الآيات

## مصادر

الإضافة تستخدم [QPC Hafs script](https://qul.tarteel.ai/resources/quran-script/86) by QUL / TarteelAL
