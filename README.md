# Mashroui — Frontend

Frontend for a graduation-project management platform — teams, proposals, tasks, meetings, discussions, and the review workflow between students, supervisors, and the committee. Five role-based dashboards plus a public marketing/archive site.

Vue 3, Vite, Pinia, Tailwind CSS. Talks to the [Mashroui](https://github.com/iMumd/Mashroui) Laravel API — no mock data, no offline mode.

## Stack

- Vue 3 (Options API in all views/components; `<script setup>` only in small presentational components)
- Vite 5
- Vue Router 4, static route imports (no lazy loading)
- Pinia, composition-style stores, consumed via `mapState`/`mapActions`
- Tailwind CSS 3, tokens in `src/styles/design-tokens.css`, dark mode via `[data-theme="dark"]`
- Axios (`src/services/api.js`)
- jsPDF + html2canvas — PDF export (proposals, reports)
- ExcelJS — Excel import/export (team bulk-create, report tables)

## Setup

```bash
npm install
cp .env.example .env
npm run dev              # http://localhost:5173
```

Requires the [backend](https://github.com/iMumd/Mashroui) running locally at `http://127.0.0.1:8000` (the API base URL is hardcoded in `src/services/api.js`). Log in with any account seeded by the backend — see its README for the default super admin, or `TestUsersSeeder`/`FeaturedProjectSeeder` for one account per role.

```bash
npm run build             # production build in dist/
npm run preview           # preview the production build
npm run lint               # eslint --fix
```

## Roles

Five roles, matching the backend's `RoleEnum`: `super_admin`, `committee`, `supervisor`, `team_leader`, `student`. The active user's role is read from `auth.store.js` and drives which dashboard layout, sidebar nav (`utils/navConfig.js`), and routes (`router/routes/`) are active.

| Role | Dashboard |
|---|---|
| Super admin (`/super-admin`) | Supervisor/committee accounts, bulk credential notifications |
| Committee (`/committee`) | Teams, members, proposals, discussion schedule, project archive, progress |
| Supervisor (`/supervisor`) | Own teams, proposal/final-report review, tasks, meetings, discussion schedule, project archive, progress |
| Team leader (`/team-leader`) | Own team's proposal/final-report, tasks, meetings |
| Student (`/student`) | Same as team leader, read-only on submission unless they're the leader |

## How the project is organized

```
src/
├── components/    ui/ (Base*, DataTable, Modal…) · layout/ · shared/ · auth/ · landing/ · committee/ · icons/
├── layouts/       DashboardLayout (all four authenticated roles) · AuthLayout · LandingLayout
├── views/         auth/ · landing/ · committee/ · supervisor/ · team-leader/ · student/ · super-admin/
├── stores/        auth · users · teams · discussions · progress · notifications · notify · committee · landing · ui
├── router/        index.js · guards.js · routes/{auth,landing,committee,supervisor,team-leader,student,super-admin}.routes.js
├── services/      api.js — central Axios instance, attaches auth token and active term_id to every request
├── utils/         constants · navConfig · formatters · validators · password · exportReport · filePreview
├── composables/   useClickOutside
├── directives/    reveal · parallax · magnetic · tilt
└── styles/        design-tokens.css · main.css
```

An **academic term** scopes most data (teams, proposals, discussions) on the backend; the frontend tracks the active term in `ui.store.js` and sends it as `term_id` on every request. Switching terms in the navbar reloads the app so every page re-fetches under the new term.

## Notes for contributors

- Options API only in `views`/`components`, fixed order: `name → components → props → emits → data → computed → watch → created → mounted → beforeUnmount → methods`. Exception: small visual-effect components (`WaterBackground.vue`, `CursorSpotlight.vue`, `landing/*` sections) may use `<script setup>`.
- Pinia stores are defined composition-style (`defineStore('x', () => {...})`) but consumed in components only through `mapState`/`mapActions`.
- No hardcoded colors — every color/shadow/radius goes through a Tailwind class bound to a `design-tokens.css` variable, with a value for both light and dark mode.
- RTL and responsive on every page, no exceptions — every table needs a mobile card view.
- Any listener added in `mounted()` is removed in `beforeUnmount()`.
- Dashboard routes (`router/routes/{committee,supervisor,team-leader,student,super-admin}.routes.js`) are statically imported, not lazy (`() => import(...)`), for instant navigation.
- Commits are in English even though planning docs and conversations around this project are in Arabic.
