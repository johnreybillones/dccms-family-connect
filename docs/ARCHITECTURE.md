# Architecture

## System Boundary

This repository contains one application with two clearly separated surfaces:

- a public DCCMS Family Connect website for parents, guardians, barangay officials, and evaluators
- a protected DCCMS management app for authorized daycare staff

The protected app is committed scope on the `management-system` branch. It includes Student
Records, Attendance, Reports, offline synchronization, and role-based access in V1. The public
site remains in the same repo and must continue to work alongside the protected management app.

## Architectural Intent

The codebase must preserve these product boundaries:

- public routes stay publicly accessible and avoid sensitive data
- protected staff routes require authenticated sessions before showing private data or actions
- offline behavior is scoped to the staff login and protected staff experience, not the public
  site
- V1 private scope includes records, attendance, reports, automatic sync, and administrator/staff
  role separation

## Current Stack

The app uses TanStack Start, TanStack Router file routes, React 19, TypeScript, Tailwind CSS v4,
and Vite 7. The build configuration is standard Vite and uses official community plugins.

Cloudflare deployment support is represented by `wrangler.jsonc` and `src/server.ts`. The server
entry wraps TanStack Start's server handler and normalizes catastrophic SSR failures into the
shared branded error page.

Protected V1 data architecture uses:

- Cloudflare D1 as canonical server storage
- encrypted IndexedDB on one activated daycare-controlled device for offline operation
- TanStack Start server routes for authentication, admin actions, bootstrap, synchronization, and
  protected data access

## Source Layout

- `src/routes/` contains TanStack file routes for public pages, API routes, and protected staff
  pages
- `src/routes/__root.tsx` contains the shared document shell, providers, and global error UI
- `src/components/` contains shared layout and public-facing UI components
- `src/components/staff/` contains protected staff UI and workflow components
- `src/components/ui/` contains shadcn-style reusable primitives
- `src/features/staff/contracts/` contains shared protected-app schemas and types
- `src/features/staff/client/` contains offline storage, activation, sync, auth, and export
  helpers
- `src/features/staff/server/` contains server-only protected-app modules
- `src/assets/` contains images imported through Vite
- `src/lib/` contains shared utilities and error helpers
- `src/styles.css` defines Tailwind v4 sources, theme tokens, fonts, and base styles
- `src/routeTree.gen.ts` is generator-owned output and must not be hand-edited

## Routing Model

Routes are declared with `createFileRoute` in `src/routes/`. Shared document shell,
stylesheet injection, query providers, error UI, and 404 UI remain in `src/routes/__root.tsx`.

Routing is intentionally split into:

- public content routes such as `/`, `/about`, `/announcements`, and `/contact`
- the shared `/login` entry route
- protected staff routes under `/staff`
- protected API routes under `/api`

Public pages should continue to use `PublicLayout`. Protected staff pages should use a dedicated
staff shell and gate access before rendering private data.

Use TanStack Router APIs only. Do not introduce React Router patterns such as `BrowserRouter`,
`Routes`, or `react-router-dom` navigation.

## Protected V1 Domain Model

Expanded V1 centers on five private concerns:

- authenticated staff sessions
- `administrator` and `staff` role enforcement
- student enrollment records
- daily attendance records
- report export plus export-audit tracking

Administrator responsibilities include staff account management, device lifecycle management, and
audit visibility. Staff responsibilities include approved record, attendance, and report-export
workflows.

## Data Flow

Public pages remain mostly static and local to route files. Announcements continue to use sample
content until a later publishing workflow is explicitly approved.

Protected staff data follows a local-first architecture:

1. An authorized user signs in online.
2. An administrator-approved daycare-controlled device is activated for offline use.
3. Each authorized user enrolls an offline PIN on that activated device after a successful online
   login.
4. Student-record changes, attendance changes, and export-audit events save to encrypted local
   storage first.
5. The sync layer automatically sends queued operations to protected server routes when
   connectivity returns.
6. D1 remains the canonical synchronized store.

This flow exists to satisfy the SIPP requirement that core staff work remain usable despite weak or
intermittent connectivity.

## Reports And Export Boundaries

Reports are committed V1 behavior, not a future placeholder. The protected app must support local
generation and export of:

- Student Masterlist
- Attendance Register / Summary
- Accomplishment Summary

Exports are generated on the unlocked authorized client from the local replica so they remain
available offline. Export audit metadata is part of the protected sync model.

Report files and personal-data API responses must not be exposed through service-worker caches,
public asset locations, or unauthenticated endpoints.

## Separation Rules

- Public website pages are not part of the installed offline staff app shell
- Protected routes must not leak personal data into public caches or unauthenticated responses
- The staff app is role-aware and must not expose administrator-only actions to ordinary staff
- Deferred modules such as health records, child-development tracking, reminders, and
  staff-managed announcement publishing must not be implied as complete before they are explicitly
  implemented
- `src/routeTree.gen.ts` remains generator-owned

## Stability Rules

- Do not move protected scope out of this repository unless a later approved plan says otherwise
- Do not reduce V1 below records, attendance, reports, offline sync, and role-based access without
  explicit product approval
- Do not treat public placeholders as verified official contact information until the client
  confirms them
