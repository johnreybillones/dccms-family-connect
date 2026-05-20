# CLAUDE.md — Agent Guide for DCCMS Family Connect

Public-facing website for the Day Care Center Management System of Barangay San Antonio de Padua I,
Dasmarinas City, Cavite. This repo covers public pages and a staff login prototype **only** — do not add
student records, attendance, reports, offline sync, or production auth without an explicit requirement.

## Commands

```bash
npm run dev        # Start local Vite dev server
npm run build      # Production build (validate with lint first)
npm run lint       # ESLint — must pass before claiming work done
npm run format     # Prettier
npm run preview    # Inspect the production build locally
```

## Stack

React 19 + TypeScript · TanStack Start + TanStack Router (file routes) · TanStack Query (root provider) ·
Tailwind CSS v4 · shadcn/ui (New York, Radix UI, Lucide) · Vite 7 via `@lovable.dev/vite-tanstack-config` ·
Cloudflare Workers (`src/server.ts` + `wrangler.jsonc`) · React Hook Form + Zod

## Source Layout

```
src/
├── assets/              # Images — imported via Vite, NOT served from public/
├── components/
│   ├── ui/              # shadcn-style primitives (Radix-based, do not reinvent)
│   ├── Navbar.tsx / Footer.tsx / PublicLayout.tsx / CloudDivider.tsx
├── hooks/use-mobile.tsx
├── lib/                 # utils.ts (cn), error-capture.ts, error-page.ts
├── routes/
│   ├── __root.tsx       # <html>, providers, error/404 UI — app shell lives here
│   ├── index.tsx / about.tsx / announcements.tsx / contact.tsx / login.tsx
│   └── routeTree.gen.ts # ⚠ AUTO-GENERATED — never hand-edit
├── server.ts            # Cloudflare Worker SSR entry + error wrapper
└── styles.css           # Tailwind v4 @theme tokens, fonts, base styles
```

## Critical Rules

| Rule                                        | Why                                                                                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Never hand-edit `src/routeTree.gen.ts`      | Regenerated on every route change; edits are overwritten                                                                                      |
| Never add duplicate Vite plugins            | `@lovable.dev/vite-tanstack-config` already includes React, Tailwind, Cloudflare, tsconfig paths, TanStack Start — duplicates break the build |
| Use TanStack Router `<Link>` for navigation | Do **not** use React Router v6 (`BrowserRouter`, `Routes`, `Route`, `Outlet` from `react-router-dom`)                                         |
| Never import `server-only`                  | Use TanStack Start server-only conventions (`*.server.ts`) instead                                                                            |
| Never invent official details               | Contact numbers, emails, Messenger URLs, hours, faculty names must stay as explicit placeholders until the user provides real values          |

## Coding Style

- **Files**: `.ts` / `.tsx` only; PascalCase components, camelCase hooks/functions
- **Prettier**: 100-char width · semicolons · double quotes · trailing commas (all)
- **Routing**: `createFileRoute` per file in `src/routes/`; shared shell in `__root.tsx`
- **Styling**: Tailwind v4 only — no `tailwind.config.js`, no PostCSS, no v3 directives.
  All tokens in `src/styles.css` using `@theme inline`; colors in `oklch`
- **Fonts**: `Fredoka` (display/headings) · `Nunito` (body)
- **Components**: Prefer existing `src/components/ui/` primitives; use `lucide-react` for icons
- **Layout**: Wrap public pages in `PublicLayout`; constrain width with `max-w-7xl` or narrower

## Before Every Change

1. Read `AGENTS.md` for the concise contributor reference.
2. Pick the relevant doc from `docs/`:
   - UI/page work → `docs/DESIGN_SYSTEM.md`
   - Routing/app-shell → `docs/ARCHITECTURE.md` + `src/routes/__root.tsx`
   - Copy/content → `docs/PROJECT_CONTEXT.md` + `docs/website_specifications.md`
   - Build/deploy → `vite.config.ts`, `src/server.ts`, `wrangler.jsonc`
3. Inspect the existing code in scope before making edits.

## Verification

```bash
npm run lint && npm run build   # Must both pass
```

For UI changes: run `npm run dev` and check affected pages at both desktop and mobile widths.
For docs-only changes: verify file paths, links, and Markdown readability.
