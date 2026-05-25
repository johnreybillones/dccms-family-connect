# Architecture

## System Boundary

This repository now contains both:

- the public-facing DCCMS Family Connect website for parents, guardians, barangay officials, and
  evaluators
- the protected DCCMS staff application approved on the `management-system` branch for student
  records, attendance, report export, offline sync, and role-based access

The public site and protected staff app share one codebase but remain separate at the route,
layout, caching, and data-handling levels. Public routes stay publicly accessible. Protected staff
routes are authenticated, role-aware, and scoped to the installable offline experience.

## Current Stack

The app uses TanStack Start, TanStack Router file routes, React, TypeScript, Tailwind CSS v4, and
Vite. Vite configuration is provided by `@lovable.dev/vite-tanstack-config`; do not add the
TanStack Start, React, Tailwind, Cloudflare, tsconfig path, or duplicate plugin setup manually.

Cloudflare deployment support is represented by `wrangler.jsonc` and the custom server entry in
`src/server.ts`. That server entry wraps TanStack Start's server handler and normalizes
catastrophic SSR errors into the branded error page from `src/lib/error-page.ts`.

Release 1 protected storage uses:

- Cloudflare D1 as canonical server storage
- encrypted IndexedDB on one activated daycare-controlled device for offline operation
- TanStack Start server routes for authentication, admin actions, bootstrap, and synchronization

## Source Layout

- `src/routes/` contains TanStack file routes for public pages and protected staff pages
- `src/routes/__root.tsx` contains the shared document shell, providers, and global error UI
- `src/components/` contains shared layout and public UI components
- `src/components/staff/` contains protected staff-specific components
- `src/components/ui/` contains shadcn-style reusable primitives
- `src/features/staff/contracts/` contains shared protected-app schemas and types
- `src/features/staff/client/` contains offline storage, sync, auth, and export helpers
- `src/features/staff/server/` contains server-only protected-app modules
- `src/assets/` contains imported images processed by Vite
- `src/lib/` contains shared utilities and error handling helpers
- `src/styles.css` defines Tailwind v4 sources, theme tokens, fonts, and base styles
- `src/routeTree.gen.ts` is generated router output and should normally not be edited

## Routing Model

Routes are declared with `createFileRoute` in `src/routes/*.tsx`. Shared document shell,
stylesheet injection, error UI, 404 UI, and the `QueryClientProvider` live in
`src/routes/__root.tsx`.

Public content pages wrap their page body with `PublicLayout`. Protected pages use a dedicated
staff shell and must enforce authentication before showing private data or actions.

Use TanStack Router's `Link` component for internal navigation. Do not introduce React Router v6
APIs such as `BrowserRouter`, `Routes`, `Route`, or `Outlet` from `react-router-dom`.

## Data Flow

Public pages remain mostly static and local to route files. Announcements use local sample data and
simulated loading states.

Protected staff data uses a local-first flow:

- online authentication establishes a secure session
- one approved device is activated for offline use
- the client writes student records, attendance, and export audit metadata to encrypted local
  storage first
- the sync layer submits queued operations to server routes when connectivity returns
- D1 remains the canonical data store for synchronized records

Generated report files are produced on the authorized client from the unlocked local replica so
exports remain available offline. Personal data and generated files must not be exposed through
service-worker caches or public asset paths.

## Separation Rules

- Public website pages are not part of the installed offline staff app shell
- Protected routes must not leak personal data into public caches or unauthenticated responses
- Deferred modules such as health records, child-development tracking, reminders, and
  staff-managed announcement publishing must not be implied as complete before they are explicitly
  implemented
- `src/routeTree.gen.ts` remains generator-owned and must not be hand-edited

## Old Architecture Carryover

Still applicable from `old_docs/ARCHITECTURE.md`:

- The public routes are `/`, `/about`, `/announcements`, `/contact`, and `/login`
- The public layout uses shared navigation and footer
- Static public content can stay local until a backend or CMS is required

Not applicable anymore:

- The assumption that this repo contains only the public site
- The assumption that private management features belong in a separate app
- React Router v6 examples and `App.tsx` route definitions
- The old `pages/`, `components/layout/`, `components/sections/`, `services/`, and `constants/`
  folder assumptions
- Tailwind v3/PostCSS assumptions
- Public assets in `public/`; current images are imported from `src/assets/`
