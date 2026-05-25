# Mobile-First Offline Student Records V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** Replace the inaccurate future-features document with a SIPP-grounded roadmap and build
the first protected DCCMS feature: a simple, offline-capable student enrollment-record workflow
for authorized staff.

**Architecture:** `docs/paper/DayCareCenter_SIPP.md` is the product requirements authority. V1
adds real staff authentication, a protected mobile-first staff shell, and Student Records using
Cloudflare D1 as canonical storage and an encrypted IndexedDB replica on one activated,
daycare-controlled device. The UI saves locally first and automatically synchronizes
`createProfile` and `updateProfile` operations when online.

**Tech Stack:** React 19, TypeScript, TanStack Start/Router/Query, Tailwind CSS v4, shadcn/Radix,
Framer Motion, Zod, Cloudflare Workers and D1, Vite PWA service worker, IndexedDB, Web Crypto.

---

## Locked Product Decisions

- Source priority: `docs/paper/DayCareCenter_SIPP.md` overrides `docs/FUTURE_FEATURES.md`.
- V1 authenticated feature: Student Records only; public announcements remain sample-driven.
- V1 pages: real `/login`, protected `/staff`, and protected Student Records list/new/view/edit.
- Deferred private pages: Attendance, Reports, Activities/Child Development, Announcement
  Management, and Reminders.
- Record actions: create, find, view, and update only; no archive, delete, health, attendance,
  document, or report fields in v1.
- Users: one deployment-provisioned staff account; account administration and additional roles are
  deferred because the SIPP does not define their permissions.
- Offline device policy: exactly one activated daycare-controlled, OS-locked phone or desktop may
  hold real local student data. Borrowed/shared devices are not approved for real data.
- UX rule: reduce staff decisions. One dominant action per screen, one guided entry form, one
  prominent search box, plain-language status, no fake dashboard metrics.
- Responsive rule: mobile-first installed PWA; desktop is supported as a supplemental layout.
- Offline unlock: staff authenticate online for activation and establish a 6-digit offline PIN.
  The PIN is usability-oriented defense in depth, not sufficient protection for shared devices.
- Recovery: a lost PIN/device requires online reauthentication and reactivation. Unsynced local
  changes are unrecoverable after local reset; warn before reset.

## Agent Ownership And Required Skills

Changes to the contract task must be merged before frontend and backend agents branch. Neither
parallel agent may silently change fields, endpoint payloads, sync states, or the device policy;
contract changes return to the coordinating agent.

| Track | Owned Scope | Must Use During Execution | Must Not Decide Independently |
| --- | --- | --- | --- |
| Coordinator | Roadmap/spec, contract types, fixtures, merges, integration acceptance | `writing-plans`, `requesting-code-review`, `verification-before-completion` | Product scope expansion |
| Frontend agent | Protected routes/UI, client stores, PWA install/offline behavior, responsive and accessibility verification | `frontend-design`, `ui-ux-pro-max`, `impeccable`, `framer-motion-animator`, `frontend-patterns`, `e2e-testing`, `test-driven-development`, `find-docs`, `verification-before-completion` | API/schema/auth rules; adding deferred modules |
| Backend agent | D1 schema/migrations, auth/session/device API, sync API, audit logging and backend tests | `coding-standards`, `backend-patterns`, `api-design`, `database-migrations`, `security-review`, `test-driven-development`, `find-docs`, `deployment-patterns`, `verification-before-completion` | UI behavior; adding roles/record fields |

## Frozen Shared Contract

### Enrollment Profile

The coordinator creates `src/features/staff/contracts/enrollment-profile.ts` with the following
shape and validation. All UI forms, IndexedDB records, D1 mapping, fixtures, and APIs use these
names exactly.

```ts
type StudentSex = "Female" | "Male" | "Not specified";

type EnrollmentProfile = {
  id: string; // UUID created on the client so offline creates have stable identity.
  recordNumber: string | null; // Assigned on the server after first synchronized create.
  childFirstName: string;
  childMiddleName: string | null;
  childLastName: string;
  childSuffix: string | null;
  birthDate: string; // YYYY-MM-DD.
  sex: StudentSex;
  address: string;
  guardianFullName: string;
  guardianRelationship: string;
  guardianContactNumber: string;
  schoolYear: string; // YYYY-YYYY.
  enrollmentDate: string; // YYYY-MM-DD.
  revision: number; // Starts at 0 locally; server increments on accepted writes.
  createdAt: string;
  updatedAt: string;
};
```

Validation rules:

- Required trimmed text fields: child first/last name, address, guardian name/relationship/contact.
- Optional text fields persist as `null`, not empty strings.
- `birthDate` and `enrollmentDate` are valid ISO dates; birth date cannot be later than enrollment.
- `schoolYear` matches `^\d{4}-\d{4}$` and end year equals start year plus one.
- Possible duplicate warning: same normalized child first/last name plus birth date. It warns but
  does not block save.
- Record number display: while `recordNumber === null`, show `Awaiting sync`; after sync the
  server assigns sequential `DCC-000001` format.

### Authentication, Device, And Synchronization

```ts
type SessionUser = { id: string; username: string; role: "staff" };

type DeviceActivation = {
  deviceId: string;
  deviceName: string;
  activatedAt: string;
};

type SyncOperation =
  | {
      operationId: string;
      kind: "createProfile";
      clientRecordedAt: string;
      profile: EnrollmentProfile;
    }
  | {
      operationId: string;
      kind: "updateProfile";
      clientRecordedAt: string;
      baseRevision: number;
      profile: EnrollmentProfile;
    };

type SyncStatus =
  | "offline"
  | "saved_locally"
  | "syncing"
  | "synced"
  | "sync_failed"
  | "reauth_required";
```

### API Endpoints

| Endpoint | Request | Success | Required Failure Behavior |
| --- | --- | --- | --- |
| `POST /api/auth/login` | `{ username, password }` | `{ user, hasActiveDevice }` and session cookie | `401 INVALID_CREDENTIALS`; log failed attempt |
| `POST /api/auth/logout` | Empty | `204` and clear session cookie | Always safe/idempotent |
| `GET /api/auth/session` | Empty | `{ user, device }` | `401 UNAUTHENTICATED` |
| `POST /api/staff/device/activate` | `{ deviceId, deviceName }` | `{ device, bootstrapRequired: true }` | `409 DEVICE_ALREADY_ACTIVE` unless replacing after explicit deactivation |
| `POST /api/staff/device/deactivate` | `{ deviceId }` | `204` | Requires current authenticated session |
| `GET /api/staff/bootstrap?deviceId=...` | Empty | `{ profiles, syncedAt }` | `403 DEVICE_NOT_ACTIVE`; response is `Cache-Control: no-store` |
| `POST /api/staff/sync` | `{ deviceId, operations, lastSyncedAt }` | `{ acknowledgedOperationIds, profiles, syncedAt }` | `401 REAUTH_REQUIRED`, `403 DEVICE_NOT_ACTIVE`, `409 REFRESH_REQUIRED` |

Rules:

- API responses containing personal data are never cached by the service worker or browser cache.
- `POST /api/staff/sync` is the sole v1 profile-write transport. Online and offline UI both save
  to local storage/outbox first, then use this endpoint.
- Synchronization is single-writer because one active offline device is allowed. A revision
  mismatch is an exceptional server-change case; return `REFRESH_REQUIRED` and do not discard
  local pending edits.

## Planned File Boundaries

| Responsibility | Planned Paths |
| --- | --- |
| Roadmap and approved design | `docs/FUTURE_FEATURES.md`, `docs/superpowers/specs/2026-05-25-student-records-offline-pwa-design.md` |
| Shared contract and fixtures | `src/features/staff/contracts/*.ts`, `src/features/staff/contracts/*.test.ts` |
| Authentication/server security | `src/features/staff/server/auth.server.ts`, `session.server.ts`, `password.server.ts`, API routes under `src/routes/api/auth/` |
| D1 profiles/device/sync/audit | `migrations/*.sql`, `src/features/staff/server/*.server.ts`, API routes under `src/routes/api/staff/` |
| Protected layout and screens | `src/components/staff/`, `src/routes/staff.tsx`, `src/routes/staff/` |
| Client offline layer | `src/features/staff/client/offline-vault.ts`, `staff-db.ts`, `sync-client.ts`, related tests |
| PWA support | `vite.config.ts`, `src/pwa/service-worker.ts`, manifest/icon assets as approved during implementation |
| Existing entry point | `src/routes/login.tsx` |
| Generated route output | `src/routeTree.gen.ts` is generator-owned; never edit manually |

## Task 1: Document The SIPP-Grounded Roadmap

**Owner:** Coordinator

**Files:**
- Modify: `docs/FUTURE_FEATURES.md`
- Create: `docs/superpowers/specs/2026-05-25-student-records-offline-pwa-design.md`

- [ ] Replace the duplicated design-system content in `docs/FUTURE_FEATURES.md` with a
  page-organized roadmap sourced from `docs/paper/DayCareCenter_SIPP.md`.
- [ ] Document existing public pages and state that `/announcements` remains sample-driven in v1.
- [ ] Document v1 pages: Staff Login, Staff Home, and Student Records.
- [ ] Document deferred areas: Attendance, Reports, Activities/Child Development, Staff
  Announcement Management, and Reminders, including their dependencies on auth/student records.
- [ ] Document exclusions: payroll, parent chat, native application, biometric authentication,
  and direct government-system integration beyond future export.
- [ ] Write the approved design spec containing the locked decisions and shared-contract summary.
- [ ] Self-review both Markdown files for placeholder requirements accidentally presented as
  committed features, contradictions with SIPP, and broken links.
- [ ] Commit:

```bash
git add docs/FUTURE_FEATURES.md docs/superpowers/specs/2026-05-25-student-records-offline-pwa-design.md
git commit -m "docs: define protected student records v1 roadmap"
```

**Gate:** User reviews the new roadmap/spec before application-code work starts.

## Task 2: Establish Contract And Test Infrastructure

**Owner:** Coordinator, before parallel dispatch

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/features/staff/contracts/enrollment-profile.ts`
- Create: `src/features/staff/contracts/api.ts`
- Create: `src/features/staff/contracts/sync.ts`
- Create: `src/features/staff/contracts/fixtures.ts`
- Test: `src/features/staff/contracts/enrollment-profile.test.ts`
- Test: `src/features/staff/contracts/sync.test.ts`

- [ ] Add Vitest and testing-library dependencies/scripts needed for shared unit tests; do not add
  React/Vite/Tailwind plugins already managed by `@lovable.dev/vite-tanstack-config`.
- [ ] Write failing contract tests for required fields, nullable optional names, date rules,
  school-year rule, allowed sex values, operation variants, and API response/error parsing.
- [ ] Run contract tests and verify they fail because schemas do not exist yet.
- [ ] Implement Zod schemas and inferred TypeScript types matching the frozen contract above.
- [ ] Add fixtures for one synchronized profile, one unsynced create, one update operation, and
  each public sync/auth error code.
- [ ] Run contract tests, lint, and build; fix only contract/tooling issues.
- [ ] Commit:

```bash
git add package.json package-lock.json vitest.config.ts src/features/staff/contracts
git commit -m "test: establish staff records contracts and fixtures"
```

**Gate:** Both implementation agents branch from this commit and consume these types without
editing them.

## Task 3: Backend Foundation, D1 Schema, And Security Primitives

**Owner:** Backend agent

**Required Skills:** `$coding-standards`, `$backend-patterns`, `$api-design`,
`$database-migrations`, `$security-review`, `$test-driven-development`, `$find-docs`,
`$deployment-patterns`, `$verification-before-completion`

**Files:**
- Modify: `wrangler.jsonc`
- Create: `migrations/0001_staff_records.sql`
- Create: `src/features/staff/server/env.server.ts`
- Create: `src/features/staff/server/db.server.ts`
- Create: `src/features/staff/server/password.server.ts`
- Create: `src/features/staff/server/session.server.ts`
- Test: `src/features/staff/server/password.server.test.ts`
- Test: `src/features/staff/server/session.server.test.ts`

- [ ] Use official Cloudflare D1 and TanStack Start server-route documentation to confirm bindings
  and server-only module placement before editing configuration.
- [ ] Add the D1 binding named `DB` and local/preview database configuration required by Wrangler.
- [ ] Create migration tables: `staff_users`, `sessions`, `activated_devices`,
  `enrollment_profiles`, `sync_operations`, and `audit_events`.
- [ ] Add indexes for username lookup, active device lookup, record number uniqueness,
  normalized child-name/birth-date duplicate checking, and audit timestamp lookup.
- [ ] Write failing tests for password hashing/verification and session-cookie attributes.
- [ ] Implement password verification using Web Crypto PBKDF2-HMAC-SHA-256 with unique salt and
  the current approved OWASP work factor (verify the baseline at implementation time).
- [ ] Implement opaque session tokens stored hashed in D1 and sent in a
  `__Host-dccms_session` cookie with `Secure`, `HttpOnly`, `SameSite=Strict`, and `Path=/`.
- [ ] Add an operational provisioning command or documented Wrangler/D1 procedure to create the
  one initial staff account without exposing password creation in the UI.
- [ ] Run backend tests, lint, and build.
- [ ] Commit:

```bash
git add wrangler.jsonc migrations src/features/staff/server package.json package-lock.json
git commit -m "feat: add staff records database and session foundation"
```

## Task 4: Backend Authentication And Device APIs

**Owner:** Backend agent

**Files:**
- Create: `src/features/staff/server/audit.server.ts`
- Create: `src/features/staff/server/device.server.ts`
- Create: `src/routes/api/auth/login.ts`
- Create: `src/routes/api/auth/logout.ts`
- Create: `src/routes/api/auth/session.ts`
- Create: `src/routes/api/staff/device/activate.ts`
- Create: `src/routes/api/staff/device/deactivate.ts`
- Test: `src/features/staff/server/auth.integration.test.ts`
- Test: `src/features/staff/server/device.integration.test.ts`

- [ ] Write failing tests for invalid/valid login, secure session issuance, logout invalidation,
  protected-route denial, activation success, second-device rejection, and deactivation.
- [ ] Implement API handlers using only the committed contract schemas for input/output.
- [ ] Require authentication and same-origin protection for modifying requests.
- [ ] Log login success/failure, logout, activation, and deactivation audit events.
- [ ] Ensure no endpoint returns password hashes, offline PIN material, or session-token hashes.
- [ ] Run focused API tests, lint, and build.
- [ ] Commit:

```bash
git add src/features/staff/server src/routes/api
git commit -m "feat: implement staff authentication and device activation APIs"
```

## Task 5: Backend Profile Bootstrap And Synchronization

**Owner:** Backend agent

**Files:**
- Create: `src/features/staff/server/profiles.server.ts`
- Create: `src/features/staff/server/sync.server.ts`
- Create: `src/routes/api/staff/bootstrap.ts`
- Create: `src/routes/api/staff/sync.ts`
- Test: `src/features/staff/server/sync.integration.test.ts`

- [ ] Write failing tests for active-device bootstrap, inactive-device rejection, create
  synchronization, generated `DCC-000001` record number, update synchronization, idempotent
  operation replay, revision mismatch, duplicate warning query support, and audit events.
- [ ] Implement bootstrap to return all v1 enrollment profiles for the authenticated activated
  device with `Cache-Control: no-store`.
- [ ] Implement idempotent create/update processing in one D1 transaction per sync request.
- [ ] Assign sequential display record numbers on accepted server creation only.
- [ ] Log accepted profile mutations and sync outcomes, preserving client action time and server
  receipt time.
- [ ] Return canonical profiles and acknowledgement IDs exactly as the shared contract defines.
- [ ] Run backend tests, lint, and build.
- [ ] Commit:

```bash
git add src/features/staff/server src/routes/api
git commit -m "feat: add student profile synchronization backend"
```

## Task 6: Frontend Visual Direction And Protected Staff Shell

**Owner:** Frontend agent

**Required Skills:** `$frontend-design`, `$ui-ux-pro-max`, `$impeccable`,
`$framer-motion-animator`, `$frontend-patterns`, `$e2e-testing`, `$test-driven-development`,
`$find-docs`, `$verification-before-completion`

**Required References:** `docs/DESIGN_SYSTEM.md`, approved design spec, `src/styles.css`,
`src/routes/__root.tsx`, and current `src/routes/login.tsx`.

**Files:**
- Modify: `src/routes/login.tsx`
- Create: `src/components/staff/StaffLayout.tsx`
- Create: `src/components/staff/SyncStatus.tsx`
- Create: `src/routes/staff.tsx`
- Create: `src/routes/staff/index.tsx`
- Create: `src/features/staff/client/auth-client.ts`
- Test: `src/components/staff/StaffLayout.test.tsx`
- Test: `src/routes/staff/index.test.tsx`

- [ ] Produce a concise UI decision note in the design spec: branded and task-focused staff UI,
  existing Fredoka/Nunito and OKLCH tokens, no decorative image-heavy record screens, one primary
  action per view, and reduced-motion support.
- [ ] Write failing UI tests for login errors, protected-route redirection, staff home primary
  action, unavailable future-module labels, connection state, and accessible naming/focus.
- [ ] Replace demo credential behavior with the committed login/session contract and redirect
  authenticated staff into `/staff`.
- [ ] Implement a compact responsive staff shell with sign out, connection/sync summary, and a
  single prominent `Student Records` entry.
- [ ] Keep deferred pages visibly labelled `Not available yet`; do not create routes or actions.
- [ ] Use motion only for meaningful view/state changes; respect `prefers-reduced-motion`.
- [ ] Run frontend tests, lint, and build.
- [ ] Commit:

```bash
git add src/routes/login.tsx src/routes/staff.tsx src/routes/staff src/components/staff src/features/staff/client
git commit -m "feat: add protected staff entry experience"
```

## Task 7: Frontend Encrypted Offline Vault And PWA Shell

**Owner:** Frontend agent

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`
- Create: `src/features/staff/client/staff-db.ts`
- Create: `src/features/staff/client/offline-vault.ts`
- Create: `src/features/staff/client/device-activation.ts`
- Create: `src/features/staff/client/sync-client.ts`
- Create: `src/pwa/service-worker.ts`
- Create: manifest/icons at the paths required by the selected PWA plugin configuration
- Test: `src/features/staff/client/offline-vault.test.ts`
- Test: `src/features/staff/client/sync-client.test.ts`

- [ ] Verify the current official Vite PWA and Web Crypto guidance, then add only the additional
  PWA integration required; do not duplicate Vite plugins listed in `vite.config.ts`.
- [ ] Write failing tests for activation, PIN-derived unlock, encrypted IndexedDB values, locked
  state, offline outbox persistence, automatic retry state transitions, and reset warning.
- [ ] Implement IndexedDB stores for encrypted profiles, encrypted queued operations, activation
  metadata, and sync metadata.
- [ ] Generate a random AES-GCM data-encryption key on activation and wrap it using a PIN-derived
  key; never store unencrypted profile payloads or the raw PIN.
- [ ] Add local failed-PIN delay behavior and an online-reactivation recovery path; present the
  unsynced-data-loss warning before reset.
- [ ] Implement service-worker caching for installable shell/static assets only; bypass all API
  calls and personal-data responses.
- [ ] Implement the plain-language sync state adapter used by `SyncStatus`.
- [ ] Test app reload offline, API cache exclusion, reduced motion, lint, and build.
- [ ] Commit:

```bash
git add vite.config.ts package.json package-lock.json src/features/staff/client src/pwa
git commit -m "feat: add encrypted offline staff PWA foundation"
```

## Task 8: Frontend Student Records Workflow

**Owner:** Frontend agent

**Files:**
- Create: `src/components/staff/StudentRecordForm.tsx`
- Create: `src/components/staff/StudentRecordList.tsx`
- Create: `src/components/staff/PossibleDuplicateNotice.tsx`
- Create: `src/routes/staff/students/index.tsx`
- Create: `src/routes/staff/students/new.tsx`
- Create: `src/routes/staff/students/$profileId.tsx`
- Create: `src/routes/staff/students/$profileId.edit.tsx`
- Create: `src/features/staff/client/profile-repository.ts`
- Test: `src/components/staff/StudentRecordForm.test.tsx`
- Test: `src/routes/staff/students/student-records.test.tsx`

- [ ] Write failing tests for local list rendering, one-box search by child name and record number,
  optional school-year filter, guided form validation, possible-duplicate warning, local save,
  read-only detail display, explicit edit, and offline feedback.
- [ ] Implement the list screen with one primary `Add student record` action and no advanced
  filtering controls.
- [ ] Implement one form divided into Child Information, Guardian Information, and Enrollment
  Information, using the frozen contract without extra fields.
- [ ] Render `Awaiting sync` for offline-created records before canonical record number assignment.
- [ ] Save creates/updates locally first, enqueue operations, and display only simple sync
  feedback: `Saved on this device`, `Will sync when connected`, `Synced`, or retry guidance.
- [ ] Keep detail view read-only until `Edit` is intentionally selected; do not expose delete or
  archive actions.
- [ ] Inspect phone-first and desktop supplemental layouts, keyboard/focus behavior, 44px
  interactive targets, and reduced-motion behavior.
- [ ] Run frontend tests, lint, and build.
- [ ] Commit:

```bash
git add src/components/staff src/routes/staff src/features/staff/client
git commit -m "feat: implement simple offline student records workflow"
```

## Task 9: Integration And End-To-End Verification

**Owner:** Coordinator with both agents

**Files:**
- Create or modify: `playwright.config.ts`
- Create: `e2e/staff-student-records.spec.ts`
- Update: documentation only if implemented behavior differs from the approved contract after an
  explicit user-approved change.

- [ ] Merge the backend and frontend branches only after verifying neither changed committed
  contract schemas independently.
- [ ] Resolve generated TanStack route updates through the normal generator/build process; never
  hand-edit `src/routeTree.gen.ts`.
- [ ] Write end-to-end scenarios for online login, device activation, profile creation, search,
  update, offline reload, offline create/update, reconnection sync, session expiry before sync,
  duplicate warning, PIN reset warning, and protected-route rejection.
- [ ] Execute local D1 migrations and run the PWA/API against local Cloudflare-compatible
  development bindings.
- [ ] Verify service-worker behavior does not cache `/api/` responses or expose profiles through
  ordinary caches.
- [ ] Verify audit entries exist for authentication, device lifecycle, profile mutations, and sync
  processing.
- [ ] Run:

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```

- [ ] Inspect the installed app workflow at a phone viewport first and desktop second, including
  offline transition and reduced-motion behavior.
- [ ] Conduct the backend agent's required security review before entering real child data.
- [ ] Commit:

```bash
git add .
git commit -m "test: verify offline student records integration"
```

## Definition Of Done

- `docs/FUTURE_FEATURES.md` is no longer duplicated design-system content and accurately maps
  SIPP features by page and release boundary.
- `/login` authenticates the provisioned staff account; unauthorized users cannot reach `/staff`.
- One approved device can be activated for offline use with a 6-digit PIN unlock and explicit
  recovery warning.
- Staff can create, find, view, and update only the approved enrollment-profile fields with an
  interface that requires minimal decisions.
- All profiles remain available offline on the activated device in encrypted local storage, and
  queued writes automatically synchronize to D1 after connectivity returns.
- API data is session/device-protected and excluded from service-worker caching.
- Audit logging covers security and profile-change events.
- Deferred features are not partially implemented or presented as available.
- Unit/integration/e2e checks, `npm run lint`, `npm run build`, phone-first UI inspection, desktop
  supplemental inspection, offline testing, and security review all pass before real data use.

## Implementation References

- Local source documents: `AGENTS.md`, `docs/paper/DayCareCenter_SIPP.md`,
  `docs/DESIGN_SYSTEM.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT_CONTEXT.md`.
- TanStack Start server routes: <https://tanstack.com/start/latest/docs/framework/react/guide/server-routes>
- Cloudflare D1: <https://developers.cloudflare.com/d1/>
- D1 migrations with Wrangler: <https://developers.cloudflare.com/workers/wrangler/commands/d1/>
- Vite PWA injectManifest: <https://vite-pwa-org.netlify.app/guide/inject-manifest>
- Web Crypto API: <https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API>
- OWASP Password Storage: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>
- OWASP Session Management: <https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html>
