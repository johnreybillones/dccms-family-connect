# Agent Workflows

## Start Here

Before changing code, read `AGENTS.md`, this file, and any relevant product or architecture doc.
Use `README.md` for commands and `docs/PROJECT_CONTEXT.md` for content boundaries.

## Picking the Right Guidance

- UI/page changes: read `docs/DESIGN_SYSTEM.md` and inspect the affected route/component.
- Routing or app-shell changes: read `docs/ARCHITECTURE.md` and inspect `src/routes/__root.tsx`.
- Copy/content changes: read `docs/PROJECT_CONTEXT.md` and `docs/website_specifications.md`.
- Build or deployment changes: inspect `vite.config.ts`, `src/server.ts`, and `wrangler.jsonc`.

## Skills and Review Habits

For future agent sessions, use a frontend/design skill before significant UI work and a browser
or visual verification workflow after starting the dev server. Use a debugging workflow before
patching unexplained runtime, SSR, routing, or build failures. Use documentation co-authoring
when creating or restructuring project docs.

Do not use subagents unless the user explicitly asks for parallel agent work.

## Implementation Rules

Keep edits scoped to the request. Do not rewrite generated router output unless the task is
about route generation. Do not add React Router APIs; this app uses TanStack Router. Do not add
duplicate Vite plugins already included by `@lovable.dev/vite-tanstack-config`.

Preserve explicit placeholders for unknown official details. Ask the user for exact values before
turning placeholders into public-facing claims.

## Verification

For documentation-only changes, verify file paths, links, and Markdown readability. For code or
UI changes, run:

```bash
npm run lint
npm run build
```

When changing visible UI, also run the dev server and inspect affected pages in a browser. For
public page changes, check both desktop and mobile widths.
