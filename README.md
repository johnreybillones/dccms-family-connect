# DCCMS Family Connect

DCCMS Family Connect is the public-facing website for the Day Care Center Management
System of Barangay San Antonio de Padua I, Dasmarinas City, Cavite. It presents public
information for parents and guardians, then provides a staff login page that acts as the
gateway to the private management system.

## Current Scope

This repository covers the public site only:

- Home page for the Day Care Center Management System
- About page with mission, vision, partners, and project background
- Announcements page with sample announcement states
- Contact page with placeholders for official contact details
- Staff login prototype for authorized personnel

The private records, attendance, reports, offline sync, and production authentication flows
belong to the management system layer and should not be invented in this repo without a
clear requirement.

## Tech Stack

- React 19 and TypeScript
- TanStack Start and TanStack Router file routes
- TanStack Query provider at the root route
- Vite 7 standard build system
- Tailwind CSS v4 tokens in `src/styles.css`
- Cloudflare Worker entry wrapper in `src/server.ts`

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

Format files:

```bash
npm run format
```

## Documentation Map

- `AGENTS.md` - concise contributor guide for future coding agents.
- `docs/ARCHITECTURE.md` - current app structure, routing, boundaries, and old-doc carryover.
- `docs/PROJECT_CONTEXT.md` - approved product context, audience, content rules, and known placeholders.
- `docs/DESIGN_SYSTEM.md` - visual language, tokens, assets, and UI conventions.
- `docs/AGENT_WORKFLOWS.md` - how future agents should approach changes in this repo.
- `docs/website_specifications.md` - original page and content requirements.

## Notes for Contributors

Do not hand-edit `src/routeTree.gen.ts` unless intentionally resolving generated router output.
Do not add duplicate Vite plugins already configured in `vite.config.ts`.
Keep placeholders explicit when official contact details, Messenger links, or production login
behavior are not yet provided.
