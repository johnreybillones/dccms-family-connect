# Day Care Center Management System (DCCMS)

Day Care Center Management System (DCCMS) is a TanStack Start application for the Day Care Center of
Barangay San Antonio de Padua I, Dasmarinas City, Cavite. It now contains two
connected surfaces:

- a public information website for parents, guardians, barangay stakeholders, and evaluators
- a protected DCCMS management app for authorized daycare personnel

The public site remains the community-facing entry point. The protected app is the approved V1
management scope for staff workflows: authentication, student records, attendance, report exports,
offline-capable operation, and role-based access.

## Current Scope

### Public Website

Public routes stay accessible without authentication and must not expose private staff data.

- `/` - home page for the Day Care Center and staff login entry point
- `/about` - daycare center context, mission, values, community support, and personnel placeholder
- `/announcements` - sample parent-facing announcements and notice states
- `/contact` - official location plus visible placeholders for unverified contact details
- `/login` - shared staff entry point

Public announcements are still sample-driven in V1. Staff-managed announcement publishing is
deferred.

### Protected Staff App

Protected staff routes are for authorized daycare personnel only.

- `/staff` - protected staff home and workflow dashboard
- `/staff/students` - find and review student records
- `/staff/students/new` - create student enrollment records
- `/staff/students/$profileId` - view a student profile
- `/staff/students/$profileId/edit` - update a student profile
- `/staff/attendance` - filter and review attendance records
- `/staff/attendance/new` - create daily attendance records
- `/staff/reports` - generate and export report files

V1 report exports cover:

- Student Masterlist
- Attendance Register / Summary
- Accomplishment Summary

Exports are working documents in `PDF` and `XLSX` formats. They are not claimed to be official
government templates.

### Roles

- `administrator` - manages normal staff workflows plus staff users, approved offline devices, and
  audit visibility
- `staff` - manages approved student records, attendance, and report exports

### Offline And Sync Boundary

The protected app is designed for weak or intermittent connectivity:

- one approved daycare-controlled device can be activated for offline use
- staff data saves locally first on the authorized device
- local staff data is encrypted in IndexedDB
- queued changes synchronize automatically when connectivity returns
- Cloudflare D1 is the canonical server-side store

The public website is not part of the installed offline staff app shell.

## Explicit Limits

The following are not V1 features unless a later approved requirement changes scope:

- health records
- child-development or activity records
- reminders and notifications
- staff-managed announcement publishing
- parent messaging or chat
- payroll or financial management
- biometric authentication
- separate native mobile app
- direct government-system integration beyond file export

Do not invent official contact numbers, email addresses, Messenger URLs, office hours, faculty
details, or production credentials. Unknown public details should remain visible placeholders.

## Tech Stack

- React 19 and TypeScript
- TanStack Start and TanStack Router file routes
- TanStack Query
- Tailwind CSS v4
- shadcn-style primitives with Radix UI and Lucide icons
- React Hook Form and Zod
- Vite 7
- Vitest and Playwright
- Cloudflare Workers support through `src/server.ts` and `wrangler.jsonc`
- Cloudflare D1-oriented protected data layer
- IndexedDB-backed offline staff storage

## Source Layout

```text
src/
|-- assets/              # Images and local media imported through Vite
|-- components/
|   |-- staff/           # Protected staff app UI and workflow components
|   |-- ui/              # shadcn-style primitives
|   |-- Navbar.tsx / Footer.tsx / PublicLayout.tsx / CloudDivider.tsx
|-- features/
|   `-- staff/
|       |-- client/      # Offline storage, sync, auth, reports, exports
|       |-- contracts/   # Shared schemas and protected-app types
|       `-- server/      # Server-only auth, data, sync, device, and audit modules
|-- hooks/use-mobile.tsx
|-- lib/                 # Shared utilities and error helpers
|-- routes/
|   |-- api/             # Protected API routes
|   |-- staff/           # Protected staff pages
|   |-- __root.tsx       # App shell, providers, error and 404 UI
|   |-- index.tsx / about.tsx / announcements.tsx / contact.tsx / login.tsx
|   `-- routeTree.gen.ts # AUTO-GENERATED; never hand-edit
|-- server.ts            # Cloudflare Worker SSR entry and error wrapper
`-- styles.css           # Tailwind v4 theme tokens, fonts, and base styles
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Build and inspect production output:

```bash
npm run build
npm run preview
```

Check code quality:

```bash
npm run lint
```

Run tests:

```bash
npm run test
npm run test:e2e
```

Format files:

```bash
npm run format
```

## Test Login Credentials

These credentials are for the local prototype/testing environment only.

| Username | Role            | Password               | Display Name      |
| -------- | --------------- | ---------------------- | ----------------- |
| `admin`  | `administrator` | `CorrectPassword!2026` | Administrator     |
| `admin2` | `administrator` | `AdminPassword2!2026`  | Administrator II  |
| `admin3` | `administrator` | `AdminPassword3!2026`  | Administrator III |
| `staff`  | `staff`         | `StaffPassword!2026`   | Staff             |
| `staff2` | `staff`         | `StaffPassword2!2026`  | Staff User II     |
| `staff3` | `staff`         | `StaffPassword3!2026`  | Staff User III    |

## Documentation Map

- `docs/PROJECT_CONTEXT.md` - current product scope, audience, content rules, and source priority
- `docs/ARCHITECTURE.md` - app surfaces, routing, protected V1 architecture, and boundaries
- `docs/FUTURE_FEATURES.md` - release roadmap and deferred areas
- `docs/DESIGN_SYSTEM.md` - visual language, tokens, assets, and UI conventions
- `docs/AGENT_WORKFLOWS.md` - how future agents should approach changes in this repo
- `docs/website_specifications.md` - original public-site page and content requirements
- `docs/superpowers/specs/` - approved implementation specs for protected V1 work

## Contributor Notes

- Do not hand-edit `src/routeTree.gen.ts`.
- Do not add duplicate Vite plugins already configured in `vite.config.ts`.
- Use TanStack Router APIs only; do not introduce React Router patterns.
- Keep public placeholders explicit until official details are verified.
- Keep protected staff data out of public routes, public caches, and unauthenticated responses.
- Preserve the V1 boundary around records, attendance, reports, offline sync, and role-based
  access unless a later approved plan changes it.
