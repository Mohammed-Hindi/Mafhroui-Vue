# هيكل المشروع الكامل — Mafhroui-Vue (مسار)

Vue 3 (Options API) + Vue Router + Pinia + Tailwind. `src/` فقط، مرتّب بالمجلد.

> ملاحظة: `stores/*.js` مكتوبة بـ Pinia setup-style (دوال `ref`/`computed` داخل `defineStore('x', () => {...})`) — الاستثناء الوحيد عن Options API بمعظم بقية الملفات.

> **زيرو باك إند حقيقي.** كل بيانات المشروع (فرق، طلاب، مشرفون، مقترحات، مهام، اجتماعات، مواعيد مناقشات، أرشيف مشاريع، إحصائيات، إشعارات، فصول دراسية) بيانات ثابتة مكتوبة مباشرة بـ `data()` كل صفحة أو بملفات `src/data/*.js` مشتركة. `services/api.js` موجود لكن غير مستهلَك فعليًا إلا بمخطط `auth.store.js` (تسجيل الدخول يعتمد فعليًا على `DEMO_ACCOUNTS` ثابتة، لا نداء شبكة حقيقي).

> **الأدوار الأربعة الفعلية:** COMMITTEE (لجنة الإشراف)، SUPERVISOR (المشرف)، TEAM_LEADER (قائد الفريق)، STUDENT (الطالب). كل دور له مجلد `views/<role>/` ومسارات `router/routes/<role>.routes.js` مستقلة، تشترك جميعًا بـ `layouts/DashboardLayout.vue`.

---

## الجذر

| ملف | وظيفة |
|---|---|
| `src/main.js` | نقطة الإقلاع: ينشئ `app`، يركّب Pinia + Router + Toast plugin + `main.css`، يسجّل directives `v-magnetic`/`v-tilt` عالميًا، يشغّل `initRevealObserver()` و`initParallax()` |
| `src/App.vue` | الجذر — `dir="rtl"`، يركّب `ScrollProgressBar` + `CursorSpotlight` (عالميًا لكل الصفحات) + `<router-view>` + `ToastContainer`، يهيّئ الوضع الداكن عبر `ui.store.initTheme()` عند `onMounted` |

---

## `router/`

| ملف | وظيفة |
|---|---|
| `index.js` | يجمع كل مجموعات المسارات (`landing + auth + committee + supervisor + team-leader + student`)، يضيف `/403` و`catch-all 404`، يركّب `authGuard` + `titleGuard` كـ `beforeEach`/`afterEach` |
| `guards.js` | `authGuard(to)`: يتحقق `requiresAuth`/`roles`. `titleGuard(to)`: يضبط عنوان التبويب من `meta.title` |
| `routes/landing.routes.js` | مسارات الصفحة العامة (لا مصادقة): `landing`, `projects-archive`, `project-showcase/:id` |
| `routes/auth.routes.js` | تسجيل دخول، نسيت كلمة المرور، إعادة تعيين/قبول دعوة، تغيير كلمة المرور |
| `routes/committee.routes.js` | `/committee/*` — **استيراد مباشر (static import)، لا lazy** |
| `routes/supervisor.routes.js` | `/supervisor/*` — **استيراد مباشر** |
| `routes/team-leader.routes.js` | `/team-leader/*` — **استيراد مباشر** |
| `routes/student.routes.js` | `/student/*` — **استيراد مباشر** |

كل مسارات لوحات التحكم الأربعة `component:` تشير لمكوّن مستورد ثابتًا أعلى الملف (ليس `() => import(...)`) — قرار متعمّد لتنقّل فوري بلا وميض تحميل عند كل ضغطة بالقائمة الجانبية.

---

## `layouts/`

| ملف | وظيفة |
|---|---|
| `AuthLayout.vue` | إطار صفحات تسجيل الدخول/كلمة المرور — يحتوي `AuthBrandPanel` |
| `LandingLayout.vue` | إطار الصفحة العامة — `WaterBackground` + `LandingNavBar` + `<router-view>` بانتقال fade/blur + `LandingFooter` |
| `DashboardLayout.vue` | إطار موحّد للأدوار الأربعة — `WaterBackground` + كتل ضبابية عائمة (`animate-blob`) + `AppSidebar` + `AppTopbar` + `<router-view>` بانتقال fade سريع (150ms). يقرأ `userRole` من `auth.store` ويشتق `navItems`/`roleLabel` من `utils/navConfig.js` |

---

## `views/` — الصفحات

### جذر
| ملف | وظيفة |
|---|---|
| `ForbiddenPage.vue` | 403 — دور بلا صلاحية |
| `NotFoundPage.vue` | 404 |

### `auth/`
| ملف | وظيفة |
|---|---|
| `LoginPage.vue` | نموذج دخول → `authStore.login()`، حسابات تجريبية ثابتة (`DEMO_ACCOUNTS`) |
| `ForgotPasswordPage.vue` | صفحة معلومات ثابتة توجّه لمراسلة لجنة الإشراف (`mailto:`) |
| `ResetPasswordPage.vue` | تُستخدم أيضًا لقبول الدعوة الأولى |
| `ChangePasswordPage.vue` | تغيير كلمة المرور |

### `landing/`
| ملف | وظيفة |
|---|---|
| `LandingPage.vue` | الصفحة الرئيسية العامة — تجمّع مكوّنات `components/landing/*`، تقرأ `featured` من `landing.store` |
| `ProjectsArchivePage.vue` | أرشيف عام للمشاريع (بلا مصادقة) — بحث + فلترة قسم/درجة + ترقيم صفحات محلي |
| `ProjectShowcasePage.vue` | صفحة عرض مشروع مفرد — بطاقة فيديو على هويّة "مسار" البصرية (بدون تضمين يوتيوب حقيقي)، شبكة معلومات المشروع |

### `committee/` (role: COMMITTEE، `/committee/*`)
| ملف | Route name | وظيفة |
|---|---|---|
| `DashboardPage.vue` | `committee-dashboard` | إحصائيات + توزيع حالات المشاريع + متوسط الإنجاز |
| `TeamsPage.vue` | `committee-teams` | إدارة الفرق: إضافة طالب/مشرف، تعيين قائد فريق، تصدير Excel/PDF |
| `MembersPage.vue` | `committee-members` | طلاب + مشرفون، تقييد دخول، توليد كلمات سر |
| `DeletedMembersPage.vue` | `committee-deleted-members` | سجل الأعضاء المحذوفين |
| `ProposalsPage.vue` | `committee-proposals` | موافقة/رفض مقترحات وتقارير نهائية |
| `AppointmentsPage.vue` | `committee-appointments` | مواعيد المناقشات: عرض + إنشاء + تصدير Excel/PDF |
| `ProjectArchivePage.vue` / `ProjectDetailPage.vue` | `committee-project-archive` / `committee-project-detail` | أرشيف المشاريع المكتملة، تفاصيل مشروع مفرد |
| `ProgressPage.vue` | `committee-progress` | نسبة تقدّم كل المشاريع |
| `AddCommitteePage.vue` | `committee-add-committee` | إدارة أعضاء لجنة الإشراف |
| `AssistantPage.vue` | `committee-assistant` | مساعد آلي (شات) |

### `supervisor/` (role: SUPERVISOR، `/supervisor/*`)
| ملف | Route | وظيفة |
|---|---|---|
| `ProfilePage.vue` | `supervisor-dashboard` (الرئيسية) | الملف الشخصي + الفرق المُشرَف عليها + إحصائيات |
| `TeamsPage.vue` | `supervisor-teams` | نفس بنية لجنة الإشراف، بلا إضافة/حذف |
| `ProposalsPage.vue` | `supervisor-proposals` | موافقة/رفض المقترحات والتقارير |
| `TasksPage.vue` | `supervisor-tasks` | لوحة Kanban (حاليًا صفحة فارغة — لم تُبنَ بعد) |
| `MeetingsPage.vue` | `supervisor-meetings` | الاجتماعات |
| `AppointmentsPage.vue` | `supervisor-appointments` | مواعيد المناقشات |
| `ProjectArchivePage.vue` / `ProjectDetailPage.vue` | `supervisor-project-archive` / `supervisor-project-detail` | أرشيف المشاريع |
| `ProgressPage.vue` | `supervisor-progress` | نسبة تقدّم الفرق |
| `AssistantPage.vue` | `supervisor-assistant` | مساعد آلي |

### `team-leader/` (role: TEAM_LEADER، `/team-leader/*`)
| ملف | Route | وظيفة |
|---|---|---|
| `ProfilePage.vue` | `team-leader-dashboard` (الرئيسية) | الملف الشخصي + فريقي + مخطط تقدّم المشروع |
| `ProposalPage.vue` | `team-leader-proposal` | تسليم المقترح والتقرير النهائي — نظام بنود تلقائي بالحقول، إرفاق ملف، توليد PDF رسمي فعلي |
| `TasksPage.vue` | `team-leader-tasks` | لوحة Kanban (فارغة — لم تُبنَ بعد) |
| `MeetingsPage.vue` | `team-leader-meetings` | إنشاء/عرض اجتماعات |
| `AssistantPage.vue` | `team-leader-assistant` | مساعد آلي |

### `student/` (role: STUDENT، `/student/*`)
| ملف | Route | وظيفة |
|---|---|---|
| `ProfilePage.vue` | `student-dashboard` (الرئيسية) | نفس بنية قائد الفريق، وسم "عضو" بدل "قائد الفريق" |
| `ProposalPage.vue` | `student-proposal` | نفس فورم قائد الفريق، لكن **مقفل/معتم بصريًا** إن لم يكن الطالب قائد الفريق |
| `TasksPage.vue` | `student-tasks` | لوحة Kanban (فارغة — لم تُبنَ بعد) |
| `MeetingsPage.vue` | `student-meetings` | عرض الاجتماعات، زر "اجتماع جديد" يظهر فقط لقائد الفريق |
| `AssistantPage.vue` | `student-assistant` | مساعد آلي |

---

## `components/ui/` — عناصر أساس (Design System)

| ملف | وظيفة |
|---|---|
| `BaseButton.vue` | زر عام (`variant, size, icon, loading, to/href`) — `v-magnetic` مطبّق على الجذر |
| `BaseInput.vue` / `BaseTextarea.vue` / `BaseSelect.vue` / `BaseCheckbox.vue` | حقول نماذج عامة |
| `BaseBadge.vue` | شارة حالة ملوّنة |
| `BaseModal.vue` | مودال عام — Teleport + إغلاق بـ Esc/الخلفية |
| `DataTable.vue` | جدول بيانات عام — يتحول تلقائيًا لبطاقات موبايل، صفوف بكلاس `row-interactive` (هفر/ضغط احترافي موحّد) |
| `Pagination.vue` | ترقيم صفحات عام، يصدر `change` |
| `EmptyState.vue` / `ErrorState.vue` | حالات فارغة/خطأ |
| `LoadingSpinner.vue` / `SkeletonLoader.vue` | مؤشرات تحميل |
| `CountUp.vue` | عدّاد يتحرك من 0 إلى القيمة النهائية عند دخوله الشاشة (مرة واحدة) |
| `ScrollProgressBar.vue` | شريط تقدّم رفيع أعلى الصفحة يعكس نسبة التمرير |
| `ToastContainer.vue` | يعرض قائمة التنبيهات من `ui.store` عبر `$toast` |

## `components/shared/`

| ملف | وظيفة |
|---|---|
| `AssistantChat.vue` | مكوّن شات مساعد آلي عام، تُستخدم بصفحات `*/AssistantPage.vue` الأربع |
| `TaskBoard.vue` | لوحة Kanban عامة (غير موصولة بعد بصفحات المهام الفعلية) |
| `MeetingCard.vue` | بطاقة اجتماع مفردة |
| `ClauseTextarea.vue` | حقل نص بنظام "بند" تلقائي — Enter أو مسافتين يبدأ بندًا جديدًا (فورم المقترح) |
| `SubmittedState.vue` | حالة نجاح/رفض بعد تسليم مقترح/تقرير، مع عناصر ملف/فيديو قابلة للفتح |
| `SemesterSelect.vue` | قائمة اختيار الفصل الدراسي بالـ Topbar — بيانات ثابتة، تُحدَّد تلقائيًا للفصل النشط |
| `NotificationBell.vue` | جرس إشعارات بالـ Topbar — بيانات ثابتة |
| `FileDropzone.vue` | سحب-وإفلات ملفات |
| `PasswordStrengthMeter.vue` | مؤشر قوة كلمة المرور |
| `WaterBackground.vue` | خلفية فقاعات ماء (canvas) — مثبّتة بكل لوحات التحكم واللاندنج، متجاوبة مع الوضع الداكن وحركة الفأرة |
| `CursorSpotlight.vue` | إضاءة خفيفة تتبع الفأرة — سطح المكتب فقط |

## `components/auth/`

| ملف | وظيفة |
|---|---|
| `AuthBrandPanel.vue` | اللوحة الجانبية بهوية المنصة بصفحات تسجيل الدخول — كتل ضبابية عائمة |
| `AuthTextField.vue` / `AuthPasswordField.vue` | حقول نماذج مخصصة للمصادقة |

## `components/landing/`

`HeroSection` (فيديو تعريفي على الهوية البصرية + إحصائيات)، `FeaturedProjects` (+ `ProjectCard`، سلايدر 3 مشاريع/سلايد)، `RolesSection`, `HowItWorksSection`, `DepartmentsSection`, `StatsBanner`, `CtaSection`, `LandingNavBar` (زر الوضع الداكن + تسجيل الدخول), `LandingFooter`.

## `components/committee/`

| ملف | وظيفة |
|---|---|
| `StatusOverviewCard.vue` | بطاقة توزيع حالات مشاريع |

## `components/layout/`

| ملف | وظيفة |
|---|---|
| `AppSidebar.vue` | القائمة الجانبية العامة — تقبل `navItems`/`roleLabel`، Drawer على الموبايل |
| `AppTopbar.vue` | الشريط العلوي — "مرحبًا، {الاسم}" بالصفحة الرئيسية لكل دور، عنوان الصفحة بالباقي، زر الوضع الداكن، `SemesterSelect`, `NotificationBell` |

## `components/icons/`

| ملف | وظيفة |
|---|---|
| `AppIcon.vue` | غلاف أيقونات موحّد للصفحة العامة — `name` يُطابَق بقاموس `ICON_PATHS` داخلي |

---

## `stores/` (Pinia، composition-style)

| ملف | وظيفة |
|---|---|
| `auth.store.js` | `DEMO_ACCOUNTS` ثابتة (4 حسابات، دور لكل واحد)، `login, logout, hasRole, homeRoute` |
| `landing.store.js` | كل بيانات الصفحة العامة مبنية من `data/projectArchive.js` + `utils/specializations.js` — `stats, featured, projects (أرشيف مفلتر/مرقّم محليًا), departments` — **بلا أي نداء API** |
| `committee.store.js` | بيانات مساعدة للجنة الإشراف |
| `supervisor.store.js` | بيانات مساعدة للمشرف |
| `deletedMembers.store.js` | سجل الأعضاء المحذوفين (`deleteStudent`, `deleteSupervisor`) |
| `notifications.store.js` | إشعارات ثابتة (5 عناصر تجريبية)، `markAsRead`/`markAllAsRead` محليًا |
| `ui.store.js` | `isDark`/`toggleTheme` (الوضع الداكن)، `sidebarOpen`, `semesters` (بيانات ثابتة)، `activeSemesterId`، Toasts |

---

## `services/`

| ملف | وظيفة |
|---|---|
| `api.js` | نسخة Axios واحدة — موجودة للتوافق المستقبلي، غير مستهلَكة فعليًا بأي صفحة/متجر حاليًا |

---

## `utils/`

| ملف | وظيفة |
|---|---|
| `constants.js` | `ROLES`, `ROLE_LABELS`, `STORAGE_KEYS`, `SIDEBAR_BREAKPOINT`, `APP_NAME`, `CONTACT` |
| `navConfig.js` | `NAV_ITEMS_BY_ROLE` — عناصر الشريط الجانبي للأدوار الأربعة |
| `formatters.js` | `formatDate, formatDateTime, formatNumber, truncate, initials`… |
| `validators.js` | `passwordStrength(value)` |
| `password.js` | `genPass()` — توليد كلمة سر عشوائية |
| `specializations.js` | `SPECIALIZATIONS` (5 تخصصات) + `DEPARTMENTS` (قسمان) — القائمة الموحّدة المستخدمة بكل فلاتر التخصص بالتطبيق |
| `exportReport.js` | `exportStyledExcel()` (ExcelJS، دمج خلايا، تنسيق احترافي) + `exportGroupsPdf()` (jsPDF عبر html2canvas) — تحميل كسول للمكتبتين |
| `filePreview.js` | `openPlaceholderPdf()`, `openPlaceholderVideo()`, `generateOfficialPdf()` — توليد/فتح ملفات PDF ومعاينات فيديو تجريبية |

## `data/`

| ملف | وظيفة |
|---|---|
| `projectArchive.js` | `PROJECT_ARCHIVE` — أرشيف المشاريع المشترك (9 مشاريع)، مصدر بيانات صفحات الأرشيف بكل الأدوار + الصفحة العامة |

## `composables/` و`directives/`

| ملف | وظيفة |
|---|---|
| `composables/useClickOutside.js` | Composable (استثناء Composition API) |
| `directives/reveal.js` | `initRevealObserver()` — ظهور تدريجي لأي عنصر بكلاس `.reveal` عند دخوله الشاشة (IntersectionObserver + MutationObserver لعناصر SPA الجديدة) |
| `directives/parallax.js` | `initParallax()` — حركة خفيفة مرتبطة بالتمرير لأي عنصر بـ `data-parallax="السرعة"` |
| `directives/magnetic.js` | `v-magnetic` — الزر يتبع الفأرة (حتى 10px) وينضغط بصريًا عند الضغط |
| `directives/tilt.js` | `v-tilt` — إمالة 3D خفيفة (حتى 6°) تتبع موضع الفأرة داخل البطاقة |

جميع التأثيرات أعلاه تحترم `prefers-reduced-motion` وتُعطَّل تلقائيًا على `pointer: coarse` (اللمس) عند الحاجة.

---

## `plugins/`

| ملف | وظيفة |
|---|---|
| `toast.js` | يوفّر `this.$toast` بكل مكوّن Options API |

---

## `styles/`

| ملف | وظيفة |
|---|---|
| `design-tokens.css` | كل متغيرات الهوية البصرية (ألوان، مسافات، ظلال، خطوط) — نسختان: `:root` (فاتح) و`:root[data-theme="dark"]` (داكن، تغطية كاملة لكل الألوان الدلالية) |
| `main.css` | Tailwind base/components/utilities + كلاسات مشتركة: `.reveal`, `.row-interactive`, `.animate-blob`/`.animate-float`/`.animate-pulse-glow`, دعم `prefers-reduced-motion` |

---

## فجوات معروفة (خارج النطاق الحالي)

- صفحات المهام (Kanban) الثلاث (`*/TasksPage.vue` لقائد الفريق/المشرف/الطالب) فارغة — لم تُبنَ بعد، `TaskBoard.vue` جاهز لكن غير موصول.
- `services/api.js` موجود بدون استهلاك فعلي — أي ربط مستقبلي بباك إند حقيقي يبدأ من هنا.
