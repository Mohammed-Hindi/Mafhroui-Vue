# منصة إدارة مشاريع التخرج — الواجهة الأمامية

لوحات تحكم عربية RTL لإدارة دورة حياة مشاريع التخرج: من تقديم المقترح، إلى توزيع المشرفين، إلى متابعة التسليمات والتقييم.

## التقنيات

| التقنية | الدور |
|---|---|
| Vue 3 (**Options API حصريًا**) | إطار الواجهة |
| Vite 5 | أداة البناء وخادم التطوير |
| Vue Router 4 | التوجيه + حراسة الأدوار |
| Pinia | إدارة الحالة (عبر `mapState` / `mapActions` فقط) |
| Axios | طبقة الشبكة عبر instance مركزي واحد |
| Tailwind CSS 3 | التنسيق، مربوط بمتغيرات `design-tokens.css` |
| lucide-vue-next | الأيقونات |

## التشغيل

```bash
npm install
cp .env.example .env      # ثم عدّلي VITE_API_BASE_URL
npm run dev               # http://localhost:5173
npm run build             # نسخة الإنتاج في dist/
npm run preview           # معاينة نسخة الإنتاج
npm run lint              # فحص وإصلاح الكود
```

## متغيرات البيئة

| المتغير | الوصف |
|---|---|
| `VITE_API_BASE_URL` | عنوان الـ API الأساسي، مثال: `http://localhost:8000/api` |
| `VITE_APP_NAME` | اسم التطبيق المعروض بعنوان التبويب |

## قواعد المشروع الملزِمة

1. **Options API فقط** — ممنوع `<script setup>` أو `ref/reactive/computed/onMounted` من `vue`. الترتيب الثابت داخل كل مكوّن: `name → components → props → emits → data → computed → watch → created → mounted → beforeUnmount → methods`.
2. **Pinia عبر الـ helpers فقط** — `mapState` / `mapActions` / `mapWritableState`. ممنوع `useStore()` مباشرة داخل مكوّن.
3. **المنطق المشترك mixins وليس composables** — في `src/mixins/`.
4. **صفر قيم مكتوبة يدويًا** — كل لون/مسافة/ظل/زاوية عبر كلاس Tailwind مرتبط بمتغير في `design-tokens.css`.
5. **صفر بيانات ثابتة** — كل البيانات عبر Pinia action تستدعي Axios، مع عرض حالات `loading` / `error` / `empty`.
6. **كل نداء شبكة** يحمل تعليق `// TODO API` يوضّح method + endpoint + شكل الـ body والـ response.
7. **تنظيف الـ listeners** — أي listener يُضاف في `mounted()` يُزال في `beforeUnmount()`.
8. **RTL و Responsive** على كل نقاط الكسر، في كل صفحة بلا استثناء.

## بنية المجلدات

```
src/
├── components/
│   ├── layout/     AppSidebar · AppTopbar · AppFooter
│   ├── ui/         مكوّنات أساسية معاد استخدامها (Base*, DataTable, Modal…)
│   ├── shared/     مكوّنات أعمال مشتركة (SemesterSelect, NotificationBell…)
│   └── landing/    أقسام الصفحة التسويقية
├── layouts/        قالب لكل دور + Auth + Landing
├── views/          الصفحات، مقسّمة بمجلد لكل دور
├── stores/         متاجر Pinia، مجلد فرعي لكل دور
├── services/       api.js (Axios + interceptors) + endpoints/
├── router/         index.js · guards.js · routes/ لكل دور
├── mixins/         منطق مشترك بأسلوب Options API
├── utils/          constants · formatters · validators
└── styles/         design-tokens.css · main.css
```

## الشريط الجانبي المتجاوب

`AppSidebar.vue` مكوّن واحد يخدم اللوحات الخمس (يستقبل `navItems` و`roleLabel`):

- **≥ 1024px:** ثابت بالتخطيط، بلا Drawer ولا Overlay.
- **< 1024px:** Drawer منزلق **من اليمين** (RTL) فوق المحتوى، مع Overlay داكن.
- **أربع طرق للإغلاق:** الضغط على الـ Overlay · زر ✕ داخل الشريط · زر ☰ في الـ Topbar (Toggle) · مفتاح Escape.
- **إغلاق تلقائي** عند تغيّر المسار، ومنع تمرير الصفحة خلفه وهو مفتوح.

## سير العمل

الصفحات تُبنى **واحدة تلو الأخرى**: وصف الصفحة (المحتوى، الحقول، الجداول، التفاعلات، مرجع التصميم) ← بناء View + Store + Endpoint ← مراجعة ← الصفحة التالية.
