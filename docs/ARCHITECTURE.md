# Architecture

## System Boundary

This repo is the public website layer for DCCMS. It is separate from the private management
system that handles student records, attendance, reports, offline sync, and production
authentication. The public site may link or redirect to that private layer later, but this repo
currently contains only the public pages and a prototype login flow.

## Current Stack

The app uses TanStack Start, TanStack Router file routes, React, TypeScript, Tailwind CSS v4,
and Vite. Vite configuration is provided by `@lovable.dev/vite-tanstack-config`; do not add
the TanStack Start, React, Tailwind, Cloudflare, tsconfig path, or duplicate plugin setup
manually.

Cloudflare deployment support is represented by `wrangler.jsonc` and the custom server entry
in `src/server.ts`. That server entry wraps TanStack Start's server handler and normalizes
catastrophic SSR errors into the branded error page from `src/lib/error-page.ts`.

## Source Layout

- `src/routes/` contains TanStack file routes for `/`, `/about`, `/announcements`, `/contact`,
  `/login`, and the root route shell.
- `src/components/` contains shared public layout components such as `Navbar`, `Footer`, and
  `PublicLayout`.
- `src/components/ui/` contains shadcn-style reusable primitives.
- `src/assets/` contains imported images processed by Vite.
- `src/lib/` contains shared utilities and error handling helpers.
- `src/styles.css` defines Tailwind v4 sources, theme tokens, fonts, and base styles.
- `src/routeTree.gen.ts` is generated router output and should normally not be edited.

## Routing Model

Routes are declared with `createFileRoute` in `src/routes/*.tsx`. Shared document shell,
stylesheet injection, error UI, 404 UI, and the `QueryClientProvider` live in
`src/routes/__root.tsx`. Public content pages wrap their page body with `PublicLayout`.

Use TanStack Router's `Link` component for internal navigation. Do not introduce React Router
v6 APIs such as `BrowserRouter`, `Routes`, `Route`, or `Outlet` from `react-router-dom`.

## Data Flow

Most current content is static and local to route files. Announcements use local sample data and
simulated loading states. There is no real backend service, CMS, auth API, or environment-based
private-system redirect yet. Add service modules only when an actual data source or API contract
exists.

## Old Architecture Carryover

Still applicable from `old_docs/ARCHITECTURE.md`:

- Public site and private management system should remain decoupled.
- The public routes are `/`, `/about`, `/announcements`, `/contact`, and `/login`.
- The public layout uses shared navigation and footer.
- Avoid heavy state management unless shared client state becomes real.
- Static content can stay local until a backend or CMS is required.

Not applicable anymore:

- React Router v6 examples and `App.tsx` route definitions.
- The old `pages/`, `components/layout/`, `components/sections/`, `services/`, and `constants/`
  folder assumptions.
- Tailwind v3/PostCSS assumptions.
- Public assets in `public/`; current images are imported from `src/assets/`.
