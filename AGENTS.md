# AGENTS.md - Agent Guide for DCCMS Family Connect

Public-facing website for the Day Care Center Management System of Barangay San Antonio de Padua I,
Dasmarinas City, Cavite. This repo covers public pages and a staff login prototype only. Do not add
student records, attendance, reports, offline sync, or production auth unless the user explicitly
asks for them.

## Commands

```bash
npm run dev        # Start local Vite dev server
npm run build      # Production build
npm run build:dev  # Development-mode build
npm run lint       # ESLint; must pass before claiming work done
npm run format     # Prettier
npm run preview    # Inspect the production build locally
```

## Stack

React 19 + TypeScript, TanStack Start + TanStack Router file routes, TanStack Query, Tailwind CSS
v4, shadcn/ui with Radix UI and Lucide, Vite 7 via `@lovable.dev/vite-tanstack-config`,
Cloudflare Workers via `src/server.ts` and `wrangler.jsonc`, plus React Hook Form and Zod.

## Source Layout

```text
src/
|-- assets/              # Images and local media; import through Vite, never serve app assets from public/
|-- components/
|   |-- ui/              # shadcn-style primitives; prefer reuse over custom replacements
|   |-- Navbar.tsx / Footer.tsx / PublicLayout.tsx / CloudDivider.tsx
|-- hooks/use-mobile.tsx
|-- lib/                 # utils.ts (cn), error-capture.ts, error-page.ts
|-- routes/
|   |-- __root.tsx       # app shell, providers, error and 404 UI
|   |-- index.tsx / about.tsx / announcements.tsx / contact.tsx / login.tsx
|   `-- routeTree.gen.ts # AUTO-GENERATED; never hand-edit
|-- server.ts            # Cloudflare Worker SSR entry + error wrapper
`-- styles.css           # Tailwind v4 theme tokens, fonts, base styles
```

## Critical Rules

| Rule                                   | Why                                                                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Never hand-edit `src/routeTree.gen.ts` | Route generation overwrites manual edits                                                                                                                         |
| Never add duplicate Vite plugins       | `@lovable.dev/vite-tanstack-config` already includes React, Tailwind, Cloudflare, tsconfig paths, TanStack Start, and related wiring; duplicates break the build |
| Use TanStack Router APIs only          | Do not introduce React Router patterns such as `BrowserRouter`, `Routes`, `Route`, or `react-router-dom` navigation                                              |
| Never import `server-only`             | Use TanStack Start server-only conventions such as `*.server.ts`                                                                                                 |
| Never invent official details          | Contact info, Messenger URLs, hours, faculty names, and similar org details must stay placeholders until the user provides real values                           |

## Coding Style

- Use `.ts` and `.tsx` files only.
- Use PascalCase for React components and camelCase for hooks and functions.
- Follow Prettier defaults already used here: 100-character width, semicolons, double quotes, trailing commas.
- Use `createFileRoute` in `src/routes/` and keep shared shell concerns in `src/routes/__root.tsx`.
- Use Tailwind CSS v4 syntax only. Do not add `tailwind.config.js`, PostCSS setup, or Tailwind v3 directives.
- Keep theme tokens in `src/styles.css` with `@theme inline`, and keep color values in `oklch`.
- Prefer existing primitives in `src/components/ui/` and use `lucide-react` for icons.
- Wrap public pages in `PublicLayout` and keep page width at `max-w-7xl` or narrower unless the design clearly needs otherwise.

## Before Every Change

1. Read this file before touching app structure, routing, styling, or build config.
2. Inspect the code already in scope before editing.
3. Use the relevant reference from `docs/` when needed:
   - UI and page work: `docs/DESIGN_SYSTEM.md`
   - Routing and app shell: `docs/ARCHITECTURE.md` and `src/routes/__root.tsx`
   - Copy and content: `docs/PROJECT_CONTEXT.md` and `docs/website_specifications.md`
   - Build and deploy: `vite.config.ts`, `src/server.ts`, and `wrangler.jsonc`
4. Keep generated files, formatting, and lockfiles stable unless the task requires changing them.
5. Do not overwrite unrelated local changes; inspect the worktree before broad edits.

## Verification

```bash
npm run lint
npm run build
```

For UI changes, also run `npm run dev` and inspect the affected pages at desktop and mobile widths.
For docs-only changes, verify paths, links, and Markdown readability.

## Test Login Credentials

| Username | Role | Password | Display Name |
| :--- | :--- | :--- | :--- |
| **`admin`** | `administrator` | `CorrectPassword!2026` | Administrator |
| **`admin2`** | `administrator` | `AdminPassword2!2026` | Administrator II |
| **`admin3`** | `administrator` | `AdminPassword3!2026` | Administrator III |
| **`staff`** | `staff` | `StaffPassword!2026` | Staff |
| **`staff2`** | `staff` | `StaffPassword2!2026` | Staff User II |
| **`staff3`** | `staff` | `StaffPassword3!2026` | Staff User III |

*All accounts use 100,000 iteration hashes for Cloudflare Workers compatibility.*

