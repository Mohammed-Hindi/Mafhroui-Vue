# مسار — منصة إدارة مشاريع التخرج (الواجهة الأمامية)

منصة عربية RTL كاملة لإدارة مشاريع التخرج، بأربع لوحات تحكم منفصلة (لجنة الإشراف، المشرف، قائد الفريق، الطالب) بالإضافة لصفحة عامة تسويقية وتسجيل دخول موحّد.

**زيرو باك إند حقيقي** — كل بيانات المشروع بأكمله (فرق، مقترحات، مهام، اجتماعات، مواعيد مناقشات، أرشيف مشاريع، إحصائيات) بيانات ثابتة (placeholder) داخل `src/data/` و`data()` الخاصة بكل صفحة/store. لا يوجد أي endpoint فعلي يُستدعى في أي مكان بالتطبيق.

## التقنيات

| التقنية | الدور |
|---|---|
| Vue 3 (**Options API** بكل `views`/`components`؛ `<script setup>` فقط بمكوّنات UI صغيرة قائمة على تأثيرات بصرية بحتة) | إطار الواجهة |
| Vite 5 | أداة البناء وخادم التطوير |
| Vue Router 4 | التوجيه + حراسة الأدوار (كل مسارات لوحات التحكم مُستوردة مباشرة — لا `lazy import` — لتنقّل فوري بلا تأخير تحميل) |
| Pinia (composition-style stores) | إدارة الحالة، تُستهلك بالمكوّنات عبر `mapState` / `mapActions` |
| Tailwind CSS 3 | التنسيق، مربوط بمتغيرات `design-tokens.css` (يدعم الوضع الداكن عبر `[data-theme="dark"]`) |
| lucide-vue-next | الأيقونات (لوحات التحكم) |
| jsPDF + html2canvas | توليد ملفات PDF رسمية حقيقية (مقترحات، تقارير، تصدير تقارير الفرق/المواعيد) — تحميل كسول (dynamic import) |
| ExcelJS | تصدير ملفات Excel احترافية (دمج خلايا، تنسيق، تجميد رأس الجدول) — تحميل كسول |
| Axios | نسخة مركزية (`services/api.js`) — تُستخدم فقط بمخطط `auth.store.js`، غير مستهلَكة فعليًا بباقي المشروع |

## التشغيل

```bash
npm install
npm run dev               # http://localhost:5173
npm run build              # نسخة الإنتاج في dist/
npm run preview            # معاينة نسخة الإنتاج
npm run lint                # فحص وإصلاح الكود
```

## تسجيل الدخول (حسابات تجريبية ثابتة)

كل الحسابات تستخدم نفس البريد `admin@mashroui.local`، وكلمة المرور تحدد الدور:

| كلمة المرور | الدور | الاسم المعروض |
|---|---|---|
| `Password123$` | لجنة الإشراف (committee) | لجنة الإشراف |
| `anas1` | المشرف (supervisor) | د. محمد العتيبي |
| `anas2` | قائد الفريق (team_leader) | admin anas |
| `anas3` | الطالب (student) | يوسف الدوسري |

## قواعد المشروع الملزِمة

1. **Options API فقط** بكل `views`/`components` الرئيسية — الترتيب الثابت: `name → components → props → emits → data → computed → watch → created → mounted → beforeUnmount → methods`. الاستثناء: مكوّنات حركة/تأثيرات بصرية صغيرة (`WaterBackground.vue`, `CursorSpotlight.vue` جزئيًا، أقسام `landing/*`) قد تستخدم `<script setup>`.
2. **Pinia عبر الـ helpers فقط** — `mapState` / `mapActions` بالمكوّنات، وتعريف الـ stores نفسها بأسلوب composition (`defineStore('x', () => {...})`).
3. **صفر باك إند حقيقي** — أي بيانات جديدة تُضاف كبيانات ثابتة (in-memory أو `src/data/*.js`)، لا نداءات API جديدة.
4. **صفر قيم مكتوبة يدويًا للألوان** — كل لون/ظل/زاوية عبر كلاس Tailwind مرتبط بمتغير في `design-tokens.css`، متوفّر بالوضعين الفاتح والداكن.
5. **RTL و Responsive** على كل نقاط الكسر، في كل صفحة بلا استثناء — كل جدول له نسخة بطاقات للموبايل.
6. **تنظيف الـ listeners** — أي listener يُضاف في `mounted()` يُزال في `beforeUnmount()`.
7. **تنقّل فوري بلوحات التحكم** — مسارات `router/routes/{committee,supervisor,team-leader,student}.routes.js` مستوردة مباشرة (static import)، ليس `() => import(...)`.

## بنية المجلدات

```
src/
├── components/
│   ├── layout/     AppSidebar · AppTopbar (تخدم كل الأدوار عبر props)
│   ├── ui/         مكوّنات أساس (Base*, DataTable, Modal, Pagination, CountUp, ScrollProgressBar…)
│   ├── shared/     مكوّنات أعمال مشتركة (TaskBoard, MeetingCard, AssistantChat, SemesterSelect, WaterBackground, CursorSpotlight…)
│   ├── auth/       مكوّنات نماذج تسجيل الدخول
│   ├── landing/    أقسام الصفحة التسويقية (Hero, FeaturedProjects, RolesSection…)
│   ├── committee/  مكوّنات خاصة بلوحة لجنة الإشراف
│   └── icons/      AppIcon (غلاف أيقونات موحّد للصفحة العامة)
├── layouts/        DashboardLayout (موحّد لكل الأدوار الأربعة) · AuthLayout · LandingLayout
├── views/          auth/ · landing/ · committee/ · supervisor/ · team-leader/ · student/ + صفحات جذر (403/404)
├── stores/         auth · landing · committee · supervisor · deletedMembers · notifications · ui
├── data/           projectArchive.js — أرشيف المشاريع المشترك بين أكثر من صفحة
├── router/         index.js · guards.js · routes/{auth,landing,committee,supervisor,team-leader,student}.routes.js
├── utils/          constants · navConfig · formatters · validators · password · specializations · exportReport · filePreview
├── composables/    useClickOutside
├── directives/     reveal (ظهور عند التمرير) · parallax (حركة خفيفة مع التمرير) · magnetic (أزرار تتبع الفأرة) · tilt (إمالة 3D للبطاقات)
└── styles/         design-tokens.css · main.css
```

## الشريط الجانبي والـ Layout الموحّد

`DashboardLayout.vue` قالب واحد يخدم الأدوار الأربعة (لجنة الإشراف، المشرف، قائد الفريق، الطالب) — يقرأ دور المستخدم من `auth.store` ويشتق `navItems`/`roleLabel` من `utils/navConfig.js`. يحتوي أيضًا خلفية متحركة (فقاعات ماء + كتل ضبابية عائمة) خلف كل المحتوى.

`AppSidebar.vue`:
- **≥ 1024px:** ثابت بالتخطيط، بلا Drawer ولا Overlay.
- **< 1024px:** Drawer منزلق **من اليمين** (RTL) فوق المحتوى، مع Overlay داكن.
- **أربع طرق للإغلاق:** الضغط على الـ Overlay · زر ✕ داخل الشريط · زر ☰ في الـ Topbar (Toggle) · مفتاح Escape.
- **إغلاق تلقائي** عند تغيّر المسار، ومنع تمرير الصفحة خلفه وهو مفتوح.

## الوضع الداكن

مُفعَّل بكل الصفحات (اللاندنج بيج + لوحات التحكم الأربعة) عبر زر شمس/قمر بالـ Topbar/Navbar. يُدار بـ `ui.store.js` (`toggleTheme`) عبر `data-theme` على `<html>`، محفوظ بـ `localStorage`.

## الحركة/الأنيميشن

- **خلفية متحركة:** فقاعات ماء (canvas، `WaterBackground.vue`) + كتل ضبابية عائمة (`animate-blob`) — بكل صفحات اللاندنج ولوحات التحكم.
- **ظهور عند التمرير:** أي عنصر بكلاس `.reveal` يظهر تلقائيًا عبر `IntersectionObserver` (`directives/reveal.js`).
- **أزرار مغناطيسية:** `v-magnetic` — تتبع الفأرة بحركة صغيرة، مطبّقة على `BaseButton` وأزرار اللاندنج الرئيسية.
- **إمالة 3D:** `v-tilt` — على بطاقات المشاريع بالصفحة العامة.
- **عداد تصاعدي:** `CountUp.vue` — على كل الأرقام الإحصائية بلوحات التحكم واللاندنج.
- **مؤشر تمرير:** `ScrollProgressBar.vue` — شريط رفيع أعلى الصفحة.
- **إضاءة تتبع الفأرة:** `CursorSpotlight.vue` — سطح المكتب فقط.
- كل الحركات تحترم `prefers-reduced-motion` وتُعطَّل تلقائيًا على أجهزة اللمس عند الحاجة.

## صفحات كل لوحة تحكم

| الدور | الصفحات |
|---|---|
| لجنة الإشراف (`/committee/*`) | لوحة المعلومات، الفرق، الأعضاء (+ محذوفون)، المقترحات، مواعيد المناقشات، أرشيف المشاريع (+ تفاصيل مشروع)، نسبة التقدّم، إضافة لجنة، المساعد الآلي |
| المشرف (`/supervisor/*`) | الملف الشخصي (رئيسية)، الفرق، المقترح/التقرير النهائي، المهام (Kanban)، الاجتماعات، مواعيد المناقشات، أرشيف المشاريع (+ تفاصيل)، نسبة التقدّم، المساعد الآلي |
| قائد الفريق (`/team-leader/*`) | الملف الشخصي (رئيسية)، المقترح/التقرير النهائي (تسليم فعلي)، المهام، الاجتماعات، المساعد الآلي |
| الطالب (`/student/*`) | نفس صفحات قائد الفريق، بفورم مقفل/معتم عند عدم كونه قائد الفريق |
| عامة (بلا مصادقة) | الرئيسية، أرشيف المشاريع العام (فلاتر + سلايدر)، عرض مشروع مفرد، تسجيل الدخول |
