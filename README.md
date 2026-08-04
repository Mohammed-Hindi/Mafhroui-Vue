# منصة إدارة مشاريع التخرج — الواجهة الأمامية

لوحة تحكم عربية RTL لمشرف مشاريع التخرج (فرق، مقترحات، مهام، اجتماعات، مواعيد مناقشات، أرشيف، نسبة تقدّم)، بالإضافة للصفحة العامة وتسجيل الدخول.

## التقنيات

| التقنية | الدور |
|---|---|
| Vue 3 (**Options API حصريًا**) | إطار الواجهة |
| Vite 5 | أداة البناء وخادم التطوير |
| Vue Router 4 | التوجيه + حراسة الأدوار |
| Pinia (composition-style stores) | إدارة الحالة، تُستهلك بالمكوّنات عبر `mapState` / `mapActions` |
| Axios | طبقة الشبكة عبر instance مركزي واحد (`services/api.js`) — تستهلكها فقط صفحات المصادقة والصفحة العامة |
| Tailwind CSS 3 | التنسيق، مربوط بمتغيرات `design-tokens.css` |
| lucide-vue-next | الأيقونات |

## التشغيل

```bash
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
npm run build             # نسخة الإنتاج في dist/
npm run preview           # معاينة نسخة الإنتاج
npm run lint              # فحص وإصلاح الكود
```

## متغيرات البيئة

| المتغير | الوصف |
|---|---|
| `VITE_APP_NAME` | اسم التطبيق المعروض بعنوان التبويب (`router/guards.js`) |

`services/api.js` يهاردكود baseURL الباك إند مباشرة — لا متغيّر بيئة له حاليًا.

## حالة الاتصال بالباك إند

| القسم | الحالة |
|---|---|
| `views/auth/*` (تسجيل الدخول، الدعوة، تغيير كلمة المرور) | متصل بباك إند حقيقي عبر `stores/auth.store.js` |
| `views/landing/*` (الصفحة العامة) | جزئي — `fetchFeaturedProjects` حقيقي، الباقي fallback على بيانات demo محلية (`utils/demoData.js`) لعدم توفّر endpoints عامة |
| `views/supervisor/*` (لوحة المشرف بكل صفحاتها العشر) | **بيانات محلية بالكامل (placeholder)** — صفر اتصال API. `stores/supervisor.store.js` يبني/يعدّل البيانات بالذاكرة فقط |

عند ربط لوحة المشرف بباك إند حقيقي لاحقًا: التعديل يقتصر على `stores/supervisor.store.js` (استبدال البيانات الثابتة بنداءات Axios) دون لمس أي `view` أو قالب.

## قواعد المشروع الملزِمة

1. **Options API فقط** بكل views وcomponents — ممنوع `<script setup>`. الترتيب الثابت: `name → components → props → emits → data → computed → watch → created → mounted → beforeUnmount → methods`.
2. **Pinia عبر الـ helpers فقط** — `mapState` / `mapActions`. الاستثناء الوحيد لـ Composition API بكامل المشروع: `composables/useClickOutside.js` (أداة صغيرة عامة) وتعريف الـ stores نفسها (Pinia setup-style).
3. **صفر قيم مكتوبة يدويًا** — كل لون/مسافة/ظل/زاوية عبر كلاس Tailwind مرتبط بمتغير في `design-tokens.css`.
4. **RTL و Responsive** على كل نقاط الكسر، في كل صفحة بلا استثناء.
5. **تنظيف الـ listeners** — أي listener يُضاف في `mounted()` يُزال في `beforeUnmount()`.

## بنية المجلدات

```
src/
├── components/
│   ├── layout/     AppSidebar · AppTopbar (تخدم كل الأدوار عبر props)
│   ├── ui/         مكوّنات أساسية معاد استخدامها (Base*, DataTable, Modal, Pagination…)
│   ├── shared/     مكوّنات أعمال مشتركة (TaskBoard, MeetingsBoard, AssistantChat, SemesterSelect…)
│   ├── auth/       مكوّنات نماذج تسجيل الدخول
│   ├── landing/    أقسام الصفحة التسويقية
│   └── icons/      AppIcon (غلاف أيقونات موحّد)
├── layouts/        DashboardLayout (موحّد لكل الأدوار) · AuthLayout · LandingLayout
├── views/          auth/ · landing/ · supervisor/ + صفحات جذر (403/404/Placeholder)
├── stores/         auth · landing · supervisor · notifications · ui (Pinia setup-style)
├── services/       api.js (Axios + interceptors)
├── router/         index.js · guards.js · routes/{auth,landing,supervisor}.routes.js
├── utils/          constants · navConfig (عناصر الشريط الجانبي لكل دور) · formatters · validators
├── composables/    useClickOutside
├── directives/     reveal (أنيميشن ظهور عناصر الصفحة العامة)
└── styles/         design-tokens.css · main.css
```

## الشريط الجانبي والـ Layout الموحّد

`DashboardLayout.vue` قالب واحد يخدم كل الأدوار (حاليًا: المشرف فقط) — يقرأ دور المستخدم من `auth.store` ويشتق `navItems`/`roleLabel` من `utils/navConfig.js`. لا يوجد layout منفصل لكل دور.

`AppSidebar.vue`:
- **≥ 1024px:** ثابت بالتخطيط، بلا Drawer ولا Overlay.
- **< 1024px:** Drawer منزلق **من اليمين** (RTL) فوق المحتوى، مع Overlay داكن.
- **أربع طرق للإغلاق:** الضغط على الـ Overlay · زر ✕ داخل الشريط · زر ☰ في الـ Topbar (Toggle) · مفتاح Escape.
- **إغلاق تلقائي** عند تغيّر المسار، ومنع تمرير الصفحة خلفه وهو مفتوح.

## صفحات لوحة المشرف (`/supervisor/*`)

الملف الشخصي، الفرق، المقترح/التقرير النهائي، المهام (Kanban)، الاجتماعات، مواعيد المناقشات، أرشيف المشاريع، نسبة تقدّم الفرق، المساعد الآلي — بالإضافة للوحة المعلومات الرئيسية.
