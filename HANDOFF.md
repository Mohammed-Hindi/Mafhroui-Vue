# HANDOFF — Committee (لجنة الإشراف) dashboard build-out

Session context for continuing this work in a fresh chat. Delete this file once the work below is finished and merged.

## Where things stand

**Live deployment:** https://gp-platform-two.vercel.app (Vercel, manual deploy — auto-deploy-on-push is NOT wired up yet, GitHub↔Vercel connection needs re-auth). Repo: `github.com/anas9929/gp-platform`, branch `main`.

**Uncommitted changes right now** (`git status --short`):
```
 M .gitignore                                  (added .vercel/)
 M src/components/landing/HeroSection.vue       (hero paragraph copy fix)
 M src/components/landing/LandingFooter.vue     (footer copy/links/contact)
 M src/components/landing/RolesSection.vue      (roles bullet-point copy)
 M src/components/shared/SemesterSelect.vue     (rebuilt on BaseSelect)
 M src/components/ui/BaseSelect.vue             (rebuilt: custom dropdown)
 M src/services/endpoints/committee.api.js      (full endpoint list written)
 M src/stores/landing.store.js                  (demo-data fallback)
 M src/utils/constants.js                       (CONTACT updated)
 M src/views/landing/LandingPage.vue             (#features anchor added)
 M src/views/landing/ProjectsArchivePage.vue     (filters use BaseSelect)
?? src/utils/demoData.js                        (new: DEMO_STATS/PROJECTS/DEPARTMENTS)
?? vercel.json                                  (SPA rewrite rule)
```
Nothing has been committed since `5d28a31`. Review the diff and commit before doing anything else — don't lose this work.

## Fully done (do not redo)

1. **Landing page** — hero copy, roles copy, footer copy/links/contact, and a demo-data fallback (`src/utils/demoData.js`) so the public site shows realistic content instead of error/empty states until the real `/public/*` API exists. `landing.store.js`'s `fetchStats`/`fetchFeaturedProjects`/`fetchDepartments`/`fetchProjects` all catch failures and fall back to `DEMO_STATS`/`DEMO_PROJECTS`/`DEMO_DEPARTMENTS`. **Keep this pattern** — don't replace it with hard error states.
2. **Custom dropdown** — `src/components/ui/BaseSelect.vue` was rebuilt from a native `<select>` into a button+panel dropdown (checkmark for selected option, `shadow-dropdown`, uses `clickOutsideMixin`). Props: `modelValue, options, label, placeholder, valueKey, labelKey, required, disabled, includePlaceholderOption`. When `includePlaceholderOption` is true, the placeholder becomes a real selectable "الكل" option (matches the screenshots the user gave — checkmark shown on the currently active "الكل"/"جميع الأقسام" item). `SemesterSelect.vue` and the filters in `ProjectsArchivePage.vue` were migrated onto it. **Any new `<select>` anywhere in the app (including the committee pages below) must use `BaseSelect`, not a native `<select>`.**
3. **Auth pages** (login/forgot-password/reset-password) and the full landing rebuild from an earlier phase of this session — already done, deployed, working.
4. **`src/services/endpoints/committee.api.js`** — fully written with every endpoint the committee pages need (see file). Nothing else to add there unless a page design changes.

## Not started — this is the actual remaining work

The user pasted 8 raw HTML mockups (Cairo/Tajawal fonts, same CSS-variable design system already ported into `design-tokens.css`) for the **لجنة الإشراف (Committee)** role's interior dashboard. These need to become Vue Options-API pages following the exact same conventions as every other file in this repo (Options API only, `mapState`/`mapActions` from `pinia`, Tailwind classes bound to design tokens, `AppIcon` for decorative icons / `lucide-vue-next` for functional UI icons, toasts via `this.$toast`, RTL, dark-mode automatically inherited via CSS vars — no `dark:` classes needed except rare gradients).

**If the HTML mockups aren't still in the new chat's context, ask the user to re-paste them** (`dashboard.html`, `teams.html`, `members.html`, `proposals.html`, `appointments.html`, `project-archive.html`, `project-detail.html`, `progress.html`) — they're needed to match pixel sizes/spacing per the user's explicit "التزم في الأحجام والخطوط والمسافات بشكل كامل" instruction.

### Pages to build (all under `src/views/committee/`)

1. **`DashboardPage.vue`** — replace the current `PlaceholderPage` stub. 3 `StatCard`s (مشاريع مكتملة/شعب/طلاب — reuse `src/components/shared/StatCard.vue`), a status-distribution bar-list card, and a donut/circular-progress "متوسط الإنجاز" card (SVG circle, like the reference `progress.html`/`dashboard.html` — `stroke-dasharray`/`stroke-dashoffset` trick). API: `committeeApi.getDashboardStats()`.

2. **`TeamsPage.vue`** — accordion list of group cards (`teams.html` reference: `.group-card`, expandable `.group-body` with a member table). Needs: add-supervisor modal, add-student modal (`BaseModal`), inline edit on group header fields (supervisor/section/specialization — use `BaseSelect` for the dropdowns, not native `<select>`), inline edit per member row (reuse `src/components/shared/InlineEditableRow.vue` pattern or replicate its edit/save/cancel UX), Excel import/export (`FileDropzone.vue` or a plain file input + a client-side XLSX library — the reference used `xlsx.full.min.js` from a CDN; check if `xlsx` is already an npm dependency before adding a new one), bulk WhatsApp/mail buttons (`wa.me/...` and `mailto:`/Gmail compose links — pure client-side, no API call), deep-link support (`?group=31` opens + scrolls to that group, matches `openGroupFromURL()` in the reference).

3. **`MembersPage.vue`** — two sections: طلاب table + مشرفون table. Password column with reveal/hide toggle (mask by default — reuse the `Eye`/`EyeOff` icon pattern already used in `AuthPasswordField.vue`/`PasswordRevealInput.vue`), a "restrict login" toggle button per row (`PATCH .../restrict`), search + `BaseSelect` filters (specialization/supervisor), bulk WhatsApp/mail buttons.

4. **`ProposalsPage.vue`** — table of proposals with a status badge (`BaseBadge`), approve button (calls API, updates row inline), reject button opens a `BaseModal`/`ConfirmDialog`-style modal requiring a reason textarea before confirming (`committeeApi.rejectProposal(id, reason)`).

5. **`AppointmentsPage.vue`** — grouped-by-team appointment cards (same accordion shape as Teams), a modal to register a new appointment (group/project/supervisor/place/date/time/committee members/student WhatsApp), per-student WhatsApp/mail send buttons, bulk send-all, Excel import/export, `TruncatableText.vue` for the "لجنة المناقشة" (committee members) list — this component already exists and matches the reference's `truncatable()` JS helper exactly, just use it instead of reimplementing.

6. **`ProjectArchivePage.vue` + `ProjectDetailPage.vue`** — archive table (department, specialization, team, project, date, files link, star toggle button) + a detail page showing a gradient hero block (project title/description/team/date) and a file-cards grid (video/report/proposal). Star toggle: `committeeApi.starProject(id, starred)`.

7. **`ProgressPage.vue`** — status-distribution card + donut chart (can extract both into a small shared component used by both this page and the Dashboard, since the reference HTML duplicates the exact same markup on both pages — `src/components/committee/StatusOverviewCard.vue` + `CompletionDonut.vue` would be the non-duplicated way to do it), plus a filterable table with a percentage progress bar per row (`BaseSelect` for specialization/supervisor/status filters).

### Store

**`src/stores/committee.store.js` does not exist yet — create it.** Follow the `landing.store.js` shape: one state block per concern (dashboardStats, groups, students, supervisors, proposals, appointments, archivedProjects, projectDetail, progressList), each with its own `xLoading`/`xError`, and one fetch action per concern calling the already-written `committee.api.js` functions. Given the volume, it's fine for this store to be large (same precedent as `landing.store.js` covering 4 concerns) — don't split into 6+ near-empty stores.

### Routing / layout wiring

- **`src/router/routes/committee.routes.js`** — currently only has the `committee-dashboard` route. Add children for `teams`, `members`, `proposals`, `appointments`, `project-archive`, `project-archive/:id` (detail), `progress`. Follow the exact pattern already in the file (`meta: { title }`, lazy `() => import(...)`).
- **`src/layouts/CommitteeLayout.vue`** — `navItems` array currently has only one entry. The lucide icons `ClipboardList`, `Users`, `FileCheck` are already imported in this file but unused (that's a pre-existing lint warning — they were clearly pre-staged for this exact task). Wire them in: `Users` → الفرق/الأعضاء, `ClipboardList` → المقترحات, `FileCheck` → أرشيف المشاريع or نسبة التقدم. Add `CalendarClock`/`Calendar` (or similar) from `lucide-vue-next` for مواعيد المناقشات, and `TrendingUp`/`BarChart3` for نسبة تقدم المشاريع.

### Docs

- **Write `API_REFERENCE.md`** at the project root once all committee pages exist: one section per screen, listing every endpoint (method + path + params), the exact request/response JSON shape expected, matching the `// TODO API` comments already scattered through the code. This was requested explicitly by the user ("اعطيني ملف كامل لمحتوى الصفحات والركويست وايش البيانات التي يجب تحتوي عليها الركويستات").

### Before declaring done

- `npm run lint` must show no *new* errors beyond the pre-existing baseline (currently: 1 error in `AppTopbar.vue` — `Menu` reserved name — and a handful of unused-icon-import warnings in the other role layouts; none of that is yours to fix unless asked).
- Every write/update/delete action (approve, reject, restrict, save edit, delete row, import excel) should end with a `this.$toast.success(...)` or `this.$toast.error(...)` call — the user explicitly asked for notifications to be "activated" across these screens.
- Match reference pixel sizes where the design token scale doesn't already cover them exactly (same exception precedent already used on the landing/auth pages) — but prefer existing tokens (`h-icon-btn` = 42px matches the reference's `.icon-btn`/`.semester-select` height already; `radius-lg/md/sm` = 20/14/10px already matches the reference `--radius-lg/md/sm` exactly).
