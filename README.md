# Masar — Frontend

Frontend for **Masar** (مسار), a graduation-project management platform — teams, proposals, tasks, meetings, discussions, and the review workflow between students, supervisors, and the committee. Four role-based dashboards plus a public marketing/archive site.

Vue 3 + Vite, talking to the [Mashroui](https://github.com/iMumd/Mashroui) Laravel API — no mock data, no offline mode.

## Stack

- **Vue 3** — Options API in views/components; `<script setup>` in small presentational/landing components
- **Vite 5**
- **Vue Router 4** — lazy-loaded routes with idle-time prefetch of the active section
- **Pinia** — composition-style stores, consumed via `mapState`/`mapActions`
- **Axios** (`src/services/api.js`) — central instance, injects the auth token and active `term_id`, 20s timeout, auto-retry of transient GET failures
- **GSAP** (`composables/useScrollMotion.js`) — calm scroll/entry motion
- **Styling** — design-system CSS (`design-tokens.css` tokens, `ucas-site.css` for the public site, `ucas-portal.css` for dashboards) with Tailwind utilities; dark mode via `[data-theme="dark"]`
- **jsPDF + html2canvas** — PDF export (proposals, reports) · **ExcelJS** — Excel import/export

## Setup

```bash
npm install
cp .env.example .env
npm run dev              # http://localhost:5173
```

Requires the [backend](https://github.com/iMumd/Mashroui) running locally at `http://127.0.0.1:8000`. Log in with any account seeded by the backend — see its README / `TestUsersSeeder` for one account per role.

```bash
npm run build            # production build in dist/
npm run preview          # preview the production build
npm run lint             # eslint --fix
```

## Environment

| Variable | Purpose |
|---|---|
| `VITE_APP_NAME` | Display name (`مسار`) |
| `VITE_API_BASE_URL` | Backend API base URL, including `/api` |
| `VITE_PUBLIC_URL` | Public site origin — drives SEO canonical/OG tags, `robots.txt` and `sitemap.xml`. Change it (and rebuild) to move the site to a new domain. |
| `VITE_CONTACT_EMAIL` / `VITE_CONTACT_PHONE` / `VITE_CONTACT_PHONE_RAW` / `VITE_CONTACT_ADDRESS` | Footer contact details shown on the public site (all have sensible defaults). |

## Roles

Four roles, matching the backend's `RoleEnum` (`src/utils/constants.js`): `super_admin`, `committee`, `supervisor`, `student`. The active user's role is read from `auth.store.js` and drives the dashboard layout, sidebar nav (`utils/navConfig.js`), and routes.

| Role | Dashboard |
|---|---|
| Super admin (`/super-admin`) | Supervisor/committee accounts, bulk credential notifications |
| Committee (`/committee`) | Teams, members, proposals, discussion schedule, project archive, progress |
| Supervisor (`/supervisor`) | Own teams, proposal/final-report review, tasks, meetings, discussion schedule, archive, progress |
| Student (`/student`) | Team proposal/final-report, tasks, meetings (read-only on submission unless they lead the team) |

> There is no "team leader" role in the UI; `leader_id` is managed internally only because the API requires it.

## Public site

Unauthenticated, indexable pages served by `LandingLayout`:

- `/` — home
- `/projects` — featured-projects archive (filterable by department)
- `/projects/:id` — project showcase
- `/about` — about the platform
- `/team` — dev team

### SEO

- `robots.txt` and `sitemap.xml` are generated at build time from `VITE_PUBLIC_URL` (see `vite.config.js`), covering the public pages only.
- `index.html` carries the default meta, Open Graph, Twitter Card and Organization JSON-LD (domain injected at the `__SITE_URL__` token).
- Per navigation, `router/guards.js` → `seoGuard` updates the title, description, canonical and og/twitter tags; dashboard and auth pages are set `noindex, nofollow`.

## How the project is organized

```
src/
├── components/    ui/ (Base*, DataTable, Modal…) · layout/ · shared/ · auth/ · landing/ · committee/ · icons/
├── layouts/       DashboardLayout (authenticated roles) · AuthLayout · LandingLayout
├── views/         auth/ · landing/ · committee/ · supervisor/ · student/ · super-admin/ · shared/
├── stores/        auth · users · teams · discussions · progress · notifications · notify · committee · landing · ui
├── router/        index.js · guards.js · routes/{auth,landing,committee,supervisor,student,super-admin}.routes.js
├── services/      api.js — Axios instance: auth token + active term_id, timeout, transient-GET retry
├── utils/         constants · navConfig · formatters · validators · password · exportReport · filePreview
├── composables/   useScrollMotion · useClickOutside
├── directives/    reveal · parallax · tilt
└── styles/        design-tokens.css · main.css · ucas-site.css · ucas-portal.css
```

An **academic term** scopes most backend data (teams, proposals, discussions); the frontend tracks the active term in `ui.store.js` and sends it as `term_id` on every request. Switching terms in the navbar reloads the app so every page re-fetches under the new term.

## Notes for contributors

- Options API in `views`/`components`, fixed order: `name → components → props → emits → data → computed → watch → created → mounted → beforeUnmount → methods`. Small visual/landing components may use `<script setup>`.
- Pinia stores are defined composition-style (`defineStore('x', () => {…})`) but consumed only through `mapState`/`mapActions`.
- No hardcoded colors — every color/shadow/radius goes through a `design-tokens.css` variable with both light and dark values.
- RTL and responsive on every page; every table needs a mobile card view.
- Any listener added in `mounted()` is removed in `beforeUnmount()`.
- Routes are lazy-loaded; after the first visit to a section its sibling pages are prefetched on browser idle for instant navigation.
- Commits and PRs are in English, even though planning and conversations around the project are in Arabic.
