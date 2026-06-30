# CV Builder

موقع لبناء السيرة الذاتية بشكل احترافي ومجاني بالكامل، مع نظام فحص ATS ذكي، قوالب متعددة، وتحكم كامل في الأقسام وترتيبها.

A free professional CV builder with smart ATS screening, multiple templates, full section control, and PDF export.

## المميزات | Features

- 🎯 **بناء تدريجي** — معالج من 9 خطوات لبناء السي في
- 🎨 **5 قوالب احترافية** — Modern, Classic, Minimal, Professional, Creative
- 🔍 **فحص ATS شامل** — تحليل كلي + نصائح لكل قسم + درجة توافق
- 🔄 **ترتيب الأقسام** — اسحب وأفلت لإعادة ترتيب أقسام السي في
- 📄 **تصدير PDF** — حمّل سيرتك الذاتية بصيغة PDF
- 🌐 **ثنائي اللغة** — عربي (RTL) + إنجليزي (LTR)
- 🔐 **مصادقة آمنة** — تسجيل + تأكيد إيميل إلزامي
- 💾 **حفظ تلقائي** — يُحفظ تلقائياً في Supabase

## التقنيات | Tech Stack

| المجال | التقنية |
|--------|---------|
| Frontend | React 18 + Vite + TailwindCSS |
| Database & Auth | Supabase (PostgreSQL) |
| i18n | react-i18next |
| State | Zustand |
| PDF Export | html2canvas + jsPDF |
| Drag & Drop | @hello-pangea/dnd |
| Hosting | GitHub Pages |

## التشغيل المحلي | Local Development

### 1. تثبيت الحزم | Install dependencies

```bash
npm install
```

### 2. إعداد Supabase | Setup Supabase

1. أنشئ مشروعاً على [Supabase](https://supabase.com)
2. اذهب إلى **SQL Editor** ونفّذ ملف `supabase/migrations/001_initial_schema.sql`
3. في Supabase Dashboard → **Authentication → Settings**:
   - فعّل **Confirm email**
4. انسخ ملف `.env.example` إلى `.env` واملأ القيم:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. التشغيل | Run

```bash
npm run dev
```

### 4. البناء | Build

```bash
npm run build
```

## النشر على GitHub Pages | Deploy to GitHub Pages

1. ارفع المشروع إلى GitHub
2. اذهب إلى **Settings → Pages → Source → GitHub Actions**
3. أضف Repository Secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. عند الـ push على `main`، سيتم النشر تلقائياً

## هيكل المشروع | Project Structure

```
src/
├── components/
│   ├── ui/           # مكونات واجهة عامة
│   ├── layout/       # Header, Footer, ProtectedRoute
│   └── builder/
│       ├── steps/    # خطوات بناء السي في
│       └── templates/ # قوالب العرض
├── pages/            # صفحات التطبيق
├── store/            # Zustand stores
├── lib/              # supabase, atsEngine, pdfExport
├── i18n/             # ترجمات ar/en
└── constants/        # تعريف الأقسام والقوالب
```

## قاعدة البيانات | Database Schema

- **profiles** — معلومات المستخدم (اسم، هاتف، مدينة) مرتبطة بـ `auth.users`
- **cvs** — السير الذاتية (محتوى JSONB + القالب)
- **cv_analyses** — نتائج فحص ATS

جميع الجداول محمية بـ Row Level Security — كل مستخدم يرى بياناته فقط.

## License

MIT — مجاني بالكامل
