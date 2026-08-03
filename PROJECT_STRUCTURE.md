# هيكل المشروع الكامل — Mafhroui-Vue

Vue 3 (Options API) + Vue Router + Pinia + Tailwind. `src/` فقط، مرتّب بالمجلد.

> ملاحظة: `stores/*.js` مكتوبة بـ Pinia setup-style (دوال `ref`/`computed` داخل `defineStore(...، () => {})`), وليست Options API — الاستثناء الوحيد بالمشروع عن بقية الملفات.

> **أدوار المشروع حاليًا: COMMITTEE (لجنة الإشراف) + SUPERVISOR (المشرف/المدرس) فقط.** أدوار SUPER_ADMIN / TEAM_LEADER / STUDENT كانت لوحات placeholder محلية بلا باك إند حقيقي — حُذفت بالكامل (views + routes) بناءً على طلب صريح، للتركيز على الأدوار الفعلية فقط. `ROLES`/`ROLE_LABELS` بـ `constants.js` ما زالت تحتوي كل الأدوار الخمسة لأنها عقد بيانات مع الباك إند (تسجيل الدخول)، لم تُمس.

---

## الجذر

| ملف | وظيفة |
|---|---|
| `src/main.js` | نقطة الإقلاع: ينشئ `app`، يركّب Pinia + Router + Toast plugin + `main.css`، يشغّل `initRevealObserver()` (أنيميشن ظهور العناصر عند التمرير) |
| `src/App.vue` | الجذر — `<router-view>` فقط |

---

## `router/`

| ملف | وظيفة |
|---|---|
| `index.js` | يجمع `landing + auth + committee + supervisor` routes فقط، يضيف `/403` و `catch-all 404`، يركّب `authGuard` + `titleGuard` كـ `beforeEach` |
| `guards.js` | `authGuard(to)`: يتحقق `requiresAuth`/`roles`/`guestOnly`، يستعيد المستخدم بعد Reload عبر `fetchCurrentUser()`. `titleGuard(to)`: يضبط عنوان التبويب |
| `routes/landing.routes.js` | مسارات الصفحة العامة (لا مصادقة) — ملك فريق ربط الباك، لم يُمس |
| `routes/auth.routes.js` | تسجيل دخول، نسيت كلمة المرور، إعادة تعيين، تغيير كلمة المرور — ملك فريق ربط الباك، لم يُمس |
| `routes/committee.routes.js` | `/committee` — dashboard, teams, members, proposals, appointments, project-archive, progress |
| `routes/supervisor.routes.js` | `/supervisor` — dashboard, assistant, tasks, meetings |

---

## `layouts/`

| ملف | وظيفة |
|---|---|
| `AuthLayout.vue` | إطار صفحات تسجيل الدخول/كلمة المرور — لم يُمس |
| `LandingLayout.vue` | إطار الصفحة العامة (Navbar + Footer) — لم يُمس |
| `DashboardLayout.vue` | إطار موحّد للوحتي التحكم المتبقيتين (committee/supervisor) — `Sidebar + Topbar + router-view`. يقرأ `userRole` من `auth.store` ويشتق `navItems`/`roleLabel` من `utils/navConfig.js` + `ROLE_LABELS` |

---

## `views/` — الصفحات

### جذر
| ملف | وظيفة |
|---|---|
| `ForbiddenPage.vue` | 403 — دور بلا صلاحية |
| `NotFoundPage.vue` | 404 |
| `PlaceholderPage.vue` | صفحة نائبة لمسارات لم تُبنَ بعد |

### `auth/` — ملك فريق ربط الباك، لم تُمس
| ملف | وظيفة |
|---|---|
| `LoginPage.vue` | نموذج دخول → `authStore.login()` |
| `ForgotPasswordPage.vue` | لا نموذج/API — صفحة معلومات ثابتة توجّه لمراسلة لجنة الإشراف (`mailto:`) لطلب رابط دعوة |
| `ResetPasswordPage.vue` | تُستخدم أيضًا لقبول الدعوة الأولى (`POST /invite/{token}/accept`) |
| `ChangePasswordPage.vue` | تغيير كلمة المرور — تُستدعى تلقائيًا عبر بوابة 423 (`must_change_password`) |

### `landing/` — ملك فريق ربط الباك، لم تُمس
| ملف | وظيفة |
|---|---|
| `LandingPage.vue` | الصفحة الرئيسية العامة — تجمّع مكوّنات `components/landing/*` |
| `ProjectShowcasePage.vue` | صفحة عرض مشروع مفرد للزوار |
| `ProjectsArchivePage.vue` | أرشيف عام للمشاريع (بلا مصادقة) |

### `committee/` (role: COMMITTEE، `/committee/*`) — متصلة بباك إند حقيقي، لم تُمس
| ملف | Route name | وظيفة |
|---|---|---|
| `DashboardPage.vue` | `committee-dashboard` | إحصائيات محسوبة محليًا من `GET /teams` (فرق، طلاب، مشرفين، توزيع حالات) |
| `TeamsPage.vue` | `committee-teams` | إنشاء فريق + استيراد طلاب بالجملة (preview/confirm) + عرض قوائم |
| `MembersPage.vue` | `committee-members` | طلاب ومشرفون مُشتقّون من `GET /teams` (getters بالـ store)، إعادة إرسال دعوة |
| `ProposalsPage.vue` | `committee-proposals` | موافقة/رفض مقترح بإدخال رقمه يدويًا — لا يوجد endpoint قائمة مقترحات |
| `AppointmentsPage.vue` | `committee-appointments` | مواعيد المناقشات: عرض + إنشاء (`POST /discussions`) + تصدير xlsx |
| `ProjectArchivePage.vue` | `committee-project-archive` | كل المشاريع من `GET /teams` |
| `ProgressPage.vue` | `committee-progress` | `GET /teams/{id}/progress` بالتوازي لكل فريق + تصدير `GET /progress/export` |

### `supervisor/` (role: SUPERVISOR، `/supervisor/*`) — بيانات محلية placeholder، لا API
| ملف | Route | وظيفة |
|---|---|---|
| `DashboardPage.vue` | `supervisor-dashboard` | لوحة رئيسية للمشرف |
| `AssistantPage.vue` | `supervisor-assistant` | يغلّف `AssistantChat.vue` — اقتراحات وردود مخصّصة (متابعة تقدّم الفرق، صياغة ملاحظات) |
| `TasksPage.vue` | `supervisor-tasks` | يغلّف `TaskBoard.vue` بوضع `read-only` — نظرة عامة على مهام كل الفرق |
| `MeetingsPage.vue` | `supervisor-meetings` | يغلّف `MeetingsBoard.vue` بوضع `can-create=false` — عرض مُجمّع لاجتماعات كل الفرق |

**محذوف بالكامل (بناءً على طلب صريح):** `views/super-admin/`, `views/team-leader/`, `views/student/` + `router/routes/{super-admin,team-leader,student}.routes.js` — كانت لوحات placeholder بلا باك إند حقيقي.

---

## `components/ui/` — عناصر أساس (Design System)

| ملف | props رئيسية | وظيفة |
|---|---|---|
| `BaseButton.vue` | `variant, size, icon, loading, to/href` | زر عام، يتحوّل تلقائيًا لـ `router-link`/`a`/`button` |
| `BaseInput.vue` | `modelValue, label, type, icon, error, hint` | حقل نص عام مع `v-model` |
| `BaseTextarea.vue` | نفس `BaseInput` + `rows` | حقل نص متعدد الأسطر |
| `BaseSelect.vue` | — | قائمة اختيار عامة |
| `BaseCheckbox.vue` | `modelValue, label, disabled` | مربع اختيار — يُستخدم بـ `LoginPage.vue` |
| `BaseBadge.vue` | `variant, dot` | شارة حالة ملوّنة |
| `BaseModal.vue` | `modelValue, title, size, closeOnOverlay` | مودال عام — Teleport + إغلاق بـ Esc/الخلفية |
| `DataTable.vue` | `columns, rows, rowKey, loading` | جدول بيانات عام قابل لإعادة الاستخدام |
| `Pagination.vue` | `currentPage, lastPage, total` | ترقيم صفحات عام، يصدر `change` |
| `EmptyState.vue` | `title, description, icon` | حالة "لا توجد بيانات" |
| `ErrorState.vue` | `title, message` | حالة خطأ + زر إعادة محاولة (`retry`) |
| `LoadingSpinner.vue` | `size, inline` | مؤشر تحميل |
| `SkeletonLoader.vue` | `rows, height` | هيكل تحميل وهمي (skeleton) |
| `ToastContainer.vue` | — | يعرض قائمة التنبيهات من `ui.store` عبر `$toast` |

**محذوف (orphan، صفر استخدام بأي صفحة):** `BaseChip.vue`, `ConfirmDialog.vue`

## `components/shared/`

| ملف | وظيفة |
|---|---|
| `AssistantChat.vue` | مكوّن شات مساعد آلي عام — `props: title, emptyHint, suggestions, replies`. تُستخدم بـ `supervisor/AssistantPage.vue` |
| `TaskBoard.vue` | لوحة Kanban عامة — 4 أعمدة، سحب-وإفلات، تخزين `localStorage`. `readOnly` تُستخدم بنظرة المشرف العامة |
| `MeetingsBoard.vue` | لوحة اجتماعات عامة — قوائم قادمة/منتهية مع Pagination، مودال طلب اجتماع (`canCreate`)، تذكير واتساب، تخزين `localStorage` |
| `MeetingCard.vue` | بطاقة اجتماع مفردة — داخل `MeetingsBoard` |
| `StatCard.vue` | بطاقة إحصائية (`label, value, icon, tone, loading`) |
| `SemesterSelect.vue` | قائمة اختيار الفصل الدراسي — تُستخدم بـ `AppTopbar.vue` (تصميم فقط، لا `GET /semesters` بالباك إند) |
| `NotificationBell.vue` | جرس إشعارات بـ `AppTopbar.vue` (تصميم فقط، لا endpoints بعد) |
| `FileDropzone.vue` | سحب-وإفلات ملفات — تُستخدم بـ `committee/TeamsPage.vue` (استيراد Excel) |
| `PasswordRevealInput.vue` | حقل كلمة مرور بزر إظهار/إخفاء |
| `PasswordStrengthMeter.vue` | مؤشر قوة كلمة المرور |

**محذوف (orphan):** `InlineEditableRow.vue`, `TruncatableText.vue`

## `components/auth/` — ملك فريق ربط الباك، لم تُمس

| ملف | وظيفة |
|---|---|
| `AuthBrandPanel.vue` | اللوحة الجانبية بهوية المنصة بصفحات تسجيل الدخول |
| `AuthTextField.vue` | حقل نص مخصص لنماذج المصادقة |
| `AuthPasswordField.vue` | حقل كلمة مرور مخصص لنماذج المصادقة |

## `components/landing/` — ملك فريق ربط الباك، لم تُمس

`HeroSection`, `StatsBanner`, `RolesSection`, `HowItWorksSection`, `FeaturedProjects` (+ `ProjectCard`)، `DepartmentsSection`, `CtaSection`, `LandingNavBar`, `LandingFooter`.

## `components/committee/`

| ملف | وظيفة |
|---|---|
| `StatusOverviewCard.vue` | بطاقة توزيع حالات مشاريع — تُستخدم بـ `committee/DashboardPage.vue` |

**محذوف (orphan):** `CompletionDonut.vue`

## `components/layout/`

| ملف | وظيفة |
|---|---|
| `AppSidebar.vue` | القائمة الجانبية العامة — تقبل `navItems`/`roleLabel` |
| `AppTopbar.vue` | الشريط العلوي — يحتوي `SemesterSelect` + `NotificationBell` |

## `components/icons/`

| ملف | وظيفة |
|---|---|
| `AppIcon.vue` | غلاف أيقونات موحّد — `name` يُطابَق بقاموس `ICON_PATHS` داخلي، مستخدَم 19+ مرة |

---

## `stores/` (Pinia، composition-style)

| ملف | الحالة/الأفعال | وظيفة |
|---|---|---|
| `auth.store.js` | `login, acceptInvite, changePassword, fetchCurrentUser, logout, hasRole` | ملك فريق ربط الباك، لم يُمس |
| `committee.store.js` | `fetchTeams, createTeam, previewImport, confirmImport, fetchAllTeamsProgress, exportProgress, fetchDiscussions, exportDiscussions, createDiscussion, fetchRefData` | كل بيانات لوحة لجنة الإشراف — باك إند حقيقي، لم يُمس |
| `landing.store.js` | `fetchStats, fetchFeaturedProjects, fetchProjects, fetchDepartments` | ملك فريق ربط الباك، لم يُمس |
| `notifications.store.js` | `fetchNotifications` | معلّقة (`TODO API`)، لا endpoint حقيقي بعد |
| `ui.store.js` | `isSidebarOpen, isLoading, toggleSidebar, setLoading` | حالة واجهة عامة |

---

## `services/`

| ملف | وظيفة |
|---|---|
| `api.js` | نسخة Axios واحدة — يستهلكها `auth.store`/`landing.store`/`committee.store`. ملك فريق ربط الباك، لم يُمس |

---

## `utils/`

| ملف | وظيفة |
|---|---|
| `constants.js` | `ROLES`, `ROLE_LABELS`, `ROLE_HOME_ROUTE`, `STORAGE_KEYS`, `SIDEBAR_BREAKPOINT`, `PAGE_SIZE_OPTIONS` — لم يُمس (عقد بيانات مع تسجيل الدخول، يحتوي كل الأدوار الخمسة رغم حذف 3 لوحات) |
| `navConfig.js` | `NAV_ITEMS_BY_ROLE` — الآن COMMITTEE + SUPERVISOR فقط، يستهلكها `DashboardLayout.vue` |
| `formatters.js` | `formatDate, formatDateTime, formatRelativeTime, formatNumber, formatFileSize, truncate, initials` |
| `validators.js` | `passwordStrength(value)` |

---

## `composables/` و `directives/`

| ملف | وظيفة |
|---|---|
| `composables/useClickOutside.js` | Composable (استثناء وحيد Composition API) |
| `directives/reveal.js` | `initRevealObserver()` — أنيميشن الصفحة العامة عند التمرير |

---

## `plugins/`

| ملف | وظيفة |
|---|---|
| `toast.js` | يوفّر `this.$toast` بكل مكوّن Options API |

---

## خلاصة آخر تنظيف (هذه الجولة)

- حُذفت لوحات SUPER_ADMIN / TEAM_LEADER / STUDENT بالكامل (views + routes + navConfig entries) — كانت placeholder محلي بلا باك إند.
- حُذفت 5 مكوّنات orphan صفر استخدام: `CompletionDonut.vue`, `InlineEditableRow.vue`, `TruncatableText.vue`, `BaseChip.vue`, `ConfirmDialog.vue`.
- حُذف `API_REFERENCE.md`, `HANDOFF.md` (وثائق باك إند، مش شغل فرونت).
- ملفات فريق ربط الباك (`auth/`, `landing/`, `services/api.js`, الـ 3 stores المرتبطة) **لم تُمس إطلاقًا**.
- `committee` module (باك إند حقيقي، منشور Vercel) **لم يُمس إطلاقًا**.

## فجوات باقية (خارج نطاق هذه الجولة)

- لا endpoint لقائمة المقترحات (`ProposalsPage`)
- لا تعديل/حذف فريق أو عضو بعد إنشائه
- لا `GET /semesters`، لا endpoints إشعارات
- `supervisor/*` بالكامل بيانات محلية (`localStorage`) — لا اتصال باك إند حقيقي
