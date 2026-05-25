# Mobile-First Offline Student Records, Attendance, and Reports V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`
> (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** Build the first protected DCCMS release in this repository with role-based access,
offline-capable student records, daily attendance, and report export for daycare staff.

**Architecture:** `docs/paper/DayCareCenter_SIPP.md` is the product requirements authority. V1
adds real authentication, `administrator` and `staff` roles, a protected mobile-first staff shell,
Cloudflare D1 as canonical storage, and an encrypted IndexedDB replica on one activated,
daycare-controlled device. The UI saves student records, attendance, and export audit data locally
first and automatically synchronizes approved operations when online.

**Tech Stack:** React 19, TypeScript, TanStack Start/Router/Query, Tailwind CSS v4, shadcn/Radix,
Framer Motion, Zod, Cloudflare Workers and D1, Vite PWA service worker, IndexedDB, Web Crypto,
PDF generation library, XLSX export library.

---

## Locked Product Decisions

- Source priority: `docs/paper/DayCareCenter_SIPP.md` overrides `docs/FUTURE_FEATURES.md`.
- V1 authenticated features: Student Records, Attendance, and Reports; public announcements remain
  sample-driven.
- V1 pages: real `/login`, protected `/staff`, protected Student Records routes, protected
  Attendance routes, and `/staff/reports`.
- Deferred private pages: Activities / Child Development, Staff Announcement Management, and
  Reminders / Notifications.
- Student record actions: create, find, view, and update only; no archive, delete, or health-data
  expansion in v1.
- Attendance actions: create, filter, view, and update only; one record per student per day.
- Report actions: generate and export Student Masterlist, Attendance Register / Summary, and
  Accomplishment Summary in `PDF` and `XLSX`.
- Roles: `administrator` and `staff`. Administrator manages users, devices, exports, and audit
  history. Staff manages records, attendance, and approved report export only.
- Offline device policy: exactly one activated daycare-controlled, OS-locked phone or desktop may
  hold real local data. Borrowed/shared devices are not approved for real data.
- Offline unlock: each authorized account on the activated device must enroll its own 6-digit
  offline PIN after a successful online login.
- Recovery: lost PIN/device requires online reauthentication and reactivation. Unsynced local
  changes are unrecoverable after local reset; warn before reset.
- Report positioning: exported files are submission-ready working documents for CSWD and
  regional-office workflows, but are not claimed to match official agency templates.

## Frozen Shared Contract

### Enrollment Profile

```ts
type StudentSex = "Female" | "Male" | "Not specified";

type EnrollmentProfile = {
  id: string;
  recordNumber: string | null;
  childFirstName: string;
  childMiddleName: string | null;
  childLastName: string;
  childSuffix: string | null;
  birthDate: string;
  sex: StudentSex;
  address: string;
  guardianFullName: string;
  guardianRelationship: string;
  guardianContactNumber: string;
  schoolYear: string;
  enrollmentDate: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
```

Validation rules:

- Required trimmed text fields: child first/last name, address, guardian name/relationship/contact
- Optional text fields persist as `null`, not empty strings
- `birthDate` and `enrollmentDate` are valid ISO dates; birth date cannot be later than enrollment
- `schoolYear` matches `^\d{4}-\d{4}$` and end year equals start year plus one
- Possible duplicate warning: same normalized child first/last name plus birth date
- Record number display: while `recordNumber === null`, show `Awaiting sync`; after sync the
  server assigns sequential `DCC-000001` format

### Attendance Record

```ts
type AttendanceStatus = "present" | "absent" | "excused";

type AttendanceRecord = {
  id: string;
  profileId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  note: string | null;
  recordedByUserId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
```

Validation rules:

- `attendanceDate` is a valid `YYYY-MM-DD` date
- `status` is one of `present`, `absent`, or `excused`
- `note` is required only when `status === "excused"`
- Only one canonical attendance record exists for each `profileId` plus `attendanceDate`

### Authentication, Device, Reports, and Synchronization

```ts
type SessionRole = "administrator" | "staff";

type SessionUser = {
  id: string;
  username: string;
  role: SessionRole;
  displayName: string;
};

type DeviceActivation = {
  deviceId: string;
  deviceName: string;
  activatedAt: string;
};

type ReportType =
  | "student_masterlist"
  | "attendance_register_summary"
  | "accomplishment_summary";

type ReportFormat = "pdf" | "xlsx";

type ExportAuditRecord = {
  id: string;
  reportType: ReportType;
  reportFormat: ReportFormat;
  generatedByUserId: string;
  generatedAt: string;
  schoolYear: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  includedUnsyncedChanges: boolean;
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
    }
  | {
      operationId: string;
      kind: "upsertAttendance";
      clientRecordedAt: string;
      baseRevision: number | null;
      attendance: AttendanceRecord;
    }
  | {
      operationId: string;
      kind: "recordExportAudit";
      clientRecordedAt: string;
      exportAudit: ExportAuditRecord;
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
| `POST /api/auth/login` | `{ username, password }` | `{ user, hasActiveDevice, offlinePinEnrolled }` and session cookie | `401 INVALID_CREDENTIALS`; log failed attempt |
| `POST /api/auth/logout` | Empty | `204` and clear session cookie | Always safe/idempotent |
| `GET /api/auth/session` | Empty | `{ user, device }` | `401 UNAUTHENTICATED` |
| `POST /api/admin/staff-users` | `{ username, displayName, role, password }` | `{ user }` | `403 FORBIDDEN`, validation errors |
| `POST /api/admin/staff-users/$userId/deactivate` | Empty | `204` | `403 FORBIDDEN` |
| `GET /api/admin/audit-events` | Empty | `{ events }` | `403 FORBIDDEN` |
| `POST /api/staff/device/activate` | `{ deviceId, deviceName }` | `{ device, bootstrapRequired: true }` | `409 DEVICE_ALREADY_ACTIVE` unless replacing after explicit deactivation |
| `POST /api/staff/device/deactivate` | `{ deviceId }` | `204` | Requires authenticated administrator session |
| `GET /api/staff/bootstrap?deviceId=...` | Empty | `{ profiles, attendanceRecords, syncedAt }` | `403 DEVICE_NOT_ACTIVE`; response is `Cache-Control: no-store` |
| `POST /api/staff/sync` | `{ deviceId, operations, lastSyncedAt }` | `{ acknowledgedOperationIds, profiles, attendanceRecords, syncedAt }` | `401 REAUTH_REQUIRED`, `403 DEVICE_NOT_ACTIVE`, `409 REFRESH_REQUIRED` |

Rules:

- API responses containing personal data are never cached by the service worker or browser cache
- `POST /api/staff/sync` is the sole v1 write transport. Online and offline UI both save to local
  storage/outbox first, then use this endpoint
- Reports are generated locally from the unlocked replica; export audit records synchronize through
  the sync endpoint
- Synchronization is single-writer because one active offline device is allowed. A revision
  mismatch returns `REFRESH_REQUIRED` and does not discard local pending edits

## Planned File Boundaries

| Responsibility | Planned Paths |
| --- | --- |
| Roadmap and approved design | `docs/FUTURE_FEATURES.md`, `docs/superpowers/specs/2026-05-25-student-records-offline-pwa-design.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT_CONTEXT.md` |
| Shared contract and fixtures | `src/features/staff/contracts/*.ts`, `src/features/staff/contracts/*.test.ts` |
| Authentication, roles, and security | `src/features/staff/server/auth.server.ts`, `session.server.ts`, `password.server.ts`, `users.server.ts`, API routes under `src/routes/api/auth/` and `src/routes/api/admin/` |
| D1 profiles, attendance, sync, and audit | `migrations/*.sql`, `src/features/staff/server/*.server.ts`, API routes under `src/routes/api/staff/` |
| Protected layout and screens | `src/components/staff/`, `src/routes/staff.tsx`, `src/routes/staff/` |
| Client offline layer | `src/features/staff/client/offline-vault.ts`, `staff-db.ts`, `sync-client.ts`, `reports-client.ts`, related tests |
| PWA support | `vite.config.ts`, `src/pwa/service-worker.ts`, manifest/icon assets as approved during implementation |
| Existing entry point | `src/routes/login.tsx` |
| Generated route output | `src/routeTree.gen.ts` is generator-owned; never edit manually |

## Task 1: Rewrite Product Documents For Expanded V1

**Owner:** Coordinator

**Files:**
- Modify: `docs/FUTURE_FEATURES.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/PROJECT_CONTEXT.md`
- Modify: `docs/superpowers/specs/2026-05-25-student-records-offline-pwa-design.md`

- [ ] Rewrite the roadmap so Release 1 includes Student Records, Attendance, Reports, offline sync,
  and role-based access.
- [ ] Update architecture and project-context docs so this repository explicitly contains the
  protected management app as approved scope, while preserving the public pages.
- [ ] Rewrite the design spec so attendance, reports, PDF/XLSX export, and administrator/staff
  roles are treated as committed v1 behavior rather than deferred work.
- [ ] Self-review all four documents for contradictions with the SIPP, especially report export,
  role-based access, and offline auto-sync.
- [ ] Commit:

```bash
git add docs/FUTURE_FEATURES.md docs/ARCHITECTURE.md docs/PROJECT_CONTEXT.md docs/superpowers/specs/2026-05-25-student-records-offline-pwa-design.md
git commit -m "docs: align v1 scope with records attendance and reports"
```

## Task 2: Establish Expanded Contracts And Test Infrastructure

**Owner:** Coordinator, before parallel dispatch

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/features/staff/contracts/enrollment-profile.ts`
- Create: `src/features/staff/contracts/attendance-record.ts`
- Create: `src/features/staff/contracts/auth.ts`
- Create: `src/features/staff/contracts/reports.ts`
- Create: `src/features/staff/contracts/sync.ts`
- Create: `src/features/staff/contracts/fixtures.ts`
- Test: `src/features/staff/contracts/enrollment-profile.test.ts`
- Test: `src/features/staff/contracts/attendance-record.test.ts`
- Test: `src/features/staff/contracts/reports.test.ts`
- Test: `src/features/staff/contracts/sync.test.ts`

- [ ] Add Vitest and testing-library dependencies/scripts needed for shared unit tests; do not add
  React/Vite/Tailwind plugins already managed by `@lovable.dev/vite-tanstack-config`.
- [ ] Write failing contract tests for enrollment validation, attendance validation, role parsing,
  report types/formats, export audit metadata, and sync operation variants.
- [ ] Run contract tests and verify they fail because schemas do not exist yet.
- [ ] Implement Zod schemas and inferred TypeScript types matching the frozen contract above.
- [ ] Add fixtures for one synchronized profile, one attendance record, one unsynced create, one
  unsynced attendance update, and one export audit operation.
- [ ] Run contract tests, lint, and build; fix only contract/tooling issues.
- [ ] Commit:

```bash
git add package.json package-lock.json vitest.config.ts src/features/staff/contracts
git commit -m "test: establish expanded staff contracts and fixtures"
```

## Task 3: Backend Foundation, Roles, And Security Primitives

**Owner:** Backend agent

**Files:**
- Modify: `wrangler.jsonc`
- Create: `migrations/0001_staff_records.sql`
- Create: `src/features/staff/server/env.server.ts`
- Create: `src/features/staff/server/db.server.ts`
- Create: `src/features/staff/server/password.server.ts`
- Create: `src/features/staff/server/session.server.ts`
- Create: `src/features/staff/server/users.server.ts`
- Test: `src/features/staff/server/password.server.test.ts`
- Test: `src/features/staff/server/session.server.test.ts`
- Test: `src/features/staff/server/users.server.test.ts`

- [ ] Use official Cloudflare D1 and TanStack Start server-route documentation to confirm bindings
  and server-only module placement before editing configuration.
- [ ] Add the D1 binding named `DB` and local/preview database configuration required by Wrangler.
- [ ] Create migration tables: `staff_users`, `sessions`, `activated_devices`,
  `authorized_device_users`, `enrollment_profiles`, `attendance_records`, `sync_operations`, and
  `audit_events`.
- [ ] Add indexes for username lookup, active device lookup, attendance uniqueness by
  `profileId/attendanceDate`, record number uniqueness, duplicate warning checks, and audit
  timestamp lookup.
- [ ] Write failing tests for password hashing/verification, session-cookie attributes,
  administrator/staff role enforcement, and user creation/deactivation.
- [ ] Implement password verification using Web Crypto PBKDF2-HMAC-SHA-256 with unique salt and
  the current approved OWASP work factor.
- [ ] Implement opaque session tokens stored hashed in D1 and sent in a `__Host-dccms_session`
  cookie with `Secure`, `HttpOnly`, `SameSite=Strict`, and `Path=/`.
- [ ] Add an operational provisioning command or documented Wrangler/D1 procedure to create the
  first administrator account without exposing password creation in the UI.
- [ ] Run backend tests, lint, and build.
- [ ] Commit:

```bash
git add wrangler.jsonc migrations src/features/staff/server package.json package-lock.json
git commit -m "feat: add staff roles database and session foundation"
```

## Task 4: Backend Authentication, User Management, Device APIs, And Audit Access

**Owner:** Backend agent

**Files:**
- Create: `src/features/staff/server/audit.server.ts`
- Create: `src/features/staff/server/device.server.ts`
- Create: `src/routes/api/auth/login.ts`
- Create: `src/routes/api/auth/logout.ts`
- Create: `src/routes/api/auth/session.ts`
- Create: `src/routes/api/admin/staff-users.ts`
- Create: `src/routes/api/admin/staff-users/$userId/deactivate.ts`
- Create: `src/routes/api/admin/audit-events.ts`
- Create: `src/routes/api/staff/device/activate.ts`
- Create: `src/routes/api/staff/device/deactivate.ts`
- Test: `src/features/staff/server/auth.integration.test.ts`
- Test: `src/features/staff/server/device.integration.test.ts`
- Test: `src/features/staff/server/admin.integration.test.ts`

- [ ] Write failing tests for invalid/valid login, session issuance, logout invalidation,
  protected-route denial, administrator-only user creation, administrator-only audit access,
  activation success, second-device rejection, and deactivation.
- [ ] Implement API handlers using only the committed contract schemas for input/output.
- [ ] Require authentication and same-origin protection for modifying requests.
- [ ] Log login success/failure, logout, user provisioning/deactivation, activation, and
  deactivation audit events.
- [ ] Ensure no endpoint returns password hashes, offline PIN material, or session-token hashes.
- [ ] Run focused API tests, lint, and build.
- [ ] Commit:

```bash
git add src/features/staff/server src/routes/api
git commit -m "feat: implement staff auth admin and device management APIs"
```

## Task 5: Backend Enrollment, Attendance, Synchronization, And Export Audit Processing

**Owner:** Backend agent

**Files:**
- Create: `src/features/staff/server/profiles.server.ts`
- Create: `src/features/staff/server/attendance.server.ts`
- Create: `src/features/staff/server/sync.server.ts`
- Create: `src/routes/api/staff/bootstrap.ts`
- Create: `src/routes/api/staff/sync.ts`
- Test: `src/features/staff/server/sync.integration.test.ts`

- [ ] Write failing tests for active-device bootstrap, inactive-device rejection, create profile
  synchronization, generated `DCC-000001` record number, attendance upsert synchronization,
  export-audit synchronization, idempotent operation replay, revision mismatch, and audit events.
- [ ] Implement bootstrap to return all v1 enrollment profiles and attendance records for the
  authenticated activated device with `Cache-Control: no-store`.
- [ ] Implement idempotent profile, attendance, and export-audit processing in one D1 transaction
  per sync request.
- [ ] Assign sequential display record numbers on accepted server creation only.
- [ ] Enforce one attendance record per profile/date and preserve manual refresh on conflicts.
- [ ] Log accepted profile mutations, attendance mutations, export audit records, and sync
  outcomes, preserving client action time and server receipt time.
- [ ] Run backend tests, lint, and build.
- [ ] Commit:

```bash
git add src/features/staff/server src/routes/api
git commit -m "feat: add records attendance and sync backend"
```

## Task 6: Frontend Protected Shell, Role-Aware Entry, And Staff Home

**Owner:** Frontend agent

**Files:**
- Modify: `src/routes/login.tsx`
- Create: `src/components/staff/StaffLayout.tsx`
- Create: `src/components/staff/SyncStatus.tsx`
- Create: `src/routes/staff.tsx`
- Create: `src/routes/staff/index.tsx`
- Create: `src/features/staff/client/auth-client.ts`
- Test: `src/components/staff/StaffLayout.test.tsx`
- Test: `src/routes/staff/index.test.tsx`

- [ ] Write failing UI tests for login errors, protected-route redirection, role-aware staff home,
  administrator-only navigation, connection state, and accessible naming/focus.
- [ ] Replace demo credential behavior with the committed login/session contract and redirect
  authenticated users into `/staff`.
- [ ] Implement a compact responsive staff shell with sign out, connection/sync summary, Student
  Records, Attendance, and Reports entries.
- [ ] Show administrator-only controls only to administrators and keep deferred pages visibly
  labeled `Not available yet`; do not create actions for deferred modules.
- [ ] Use motion only for meaningful view/state changes and respect `prefers-reduced-motion`.
- [ ] Run frontend tests, lint, and build.
- [ ] Commit:

```bash
git add src/routes/login.tsx src/routes/staff.tsx src/routes/staff src/components/staff src/features/staff/client
git commit -m "feat: add protected role-aware staff entry experience"
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
- [ ] Write failing tests for activation, per-user PIN-derived unlock, encrypted IndexedDB values,
  locked state, offline outbox persistence, automatic retry state transitions, and reset warning.
- [ ] Implement IndexedDB stores for encrypted profiles, encrypted attendance, encrypted queued
  operations, authorized user metadata, activation metadata, and sync metadata.
- [ ] Generate a random AES-GCM data-encryption key on activation and wrap it using each enrolled
  user's PIN-derived key; never store unencrypted personal data or the raw PIN.
- [ ] Add local failed-PIN delay behavior and an online-reactivation recovery path; present the
  unsynced-data-loss warning before reset.
- [ ] Implement service-worker caching for installable shell/static assets only; bypass all API
  calls and personal-data responses.
- [ ] Run offline reload, API cache exclusion, reduced motion, lint, and build verification.
- [ ] Commit:

```bash
git add vite.config.ts package.json package-lock.json src/features/staff/client src/pwa
git commit -m "feat: add encrypted offline staff pwa foundation"
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

- [ ] Write failing tests for local list rendering, one-box search by child name and record
  number, optional school-year filter, guided form validation, duplicate warning, local save,
  read-only detail display, explicit edit, and offline feedback.
- [ ] Implement the list screen with one primary `Add student record` action and no advanced
  filtering controls.
- [ ] Implement one form divided into Child Information, Guardian Information, and Enrollment
  Information, using the frozen contract without extra fields.
- [ ] Render `Awaiting sync` for offline-created records before canonical record number assignment.
- [ ] Save creates/updates locally first, enqueue operations, and display only simple sync
  feedback.
- [ ] Keep detail view read-only until `Edit` is intentionally selected; do not expose delete or
  archive actions.
- [ ] Run frontend tests, lint, and build.
- [ ] Commit:

```bash
git add src/components/staff src/routes/staff src/features/staff/client
git commit -m "feat: implement offline student records workflow"
```

## Task 9: Frontend Attendance Workflow

**Owner:** Frontend agent

**Files:**
- Create: `src/components/staff/AttendanceEntryForm.tsx`
- Create: `src/components/staff/AttendanceList.tsx`
- Create: `src/routes/staff/attendance/index.tsx`
- Create: `src/routes/staff/attendance/new.tsx`
- Create: `src/routes/staff/attendance/$entryId.edit.tsx`
- Create: `src/features/staff/client/attendance-repository.ts`
- Test: `src/components/staff/AttendanceEntryForm.test.tsx`
- Test: `src/routes/staff/attendance/attendance.test.tsx`

- [ ] Write failing tests for date selection, student selection, valid statuses, required excused
  note, duplicate-day editing behavior, local save, offline queueing, and sync feedback.
- [ ] Implement a daily attendance flow with one date context, one student picker, and one small
  status set: `Present`, `Absent`, `Excused`.
- [ ] Default new entry flows to today while allowing explicit date change.
- [ ] Show existing attendance entries by date with clear edit affordances and no delete action.
- [ ] Save attendance locally first, enqueue sync operations, and keep feedback plain-language.
- [ ] Run frontend tests, lint, and build.
- [ ] Commit:

```bash
git add src/components/staff src/routes/staff src/features/staff/client
git commit -m "feat: implement offline attendance workflow"
```

## Task 10: Frontend Offline Report Export Workflow

**Owner:** Frontend agent

**Files:**
- Create: `src/components/staff/ReportExportPanel.tsx`
- Create: `src/routes/staff/reports.tsx`
- Create: `src/features/staff/client/reports-client.ts`
- Create: `src/features/staff/client/pdf-export.ts`
- Create: `src/features/staff/client/xlsx-export.ts`
- Test: `src/components/staff/ReportExportPanel.test.tsx`
- Test: `src/routes/staff/reports.test.tsx`

- [ ] Write failing tests for report-type selection, required school-year/date-range parameters,
  offline export availability, unsynced-data labeling, administrator/staff access, and queued
  export-audit synchronization.
- [ ] Implement report generation for Student Masterlist, Attendance Register / Summary, and
  Accomplishment Summary using the local unlocked data replica.
- [ ] Generate `PDF` and `XLSX` files on the client and label exports with generation time and
  whether unsynced changes were included.
- [ ] Queue export audit records locally and synchronize them when connectivity returns.
- [ ] Ensure report files are not persisted into service-worker caches or public asset locations.
- [ ] Run frontend tests, lint, and build.
- [ ] Commit:

```bash
git add src/components/staff src/routes/staff src/features/staff/client
git commit -m "feat: implement offline report export workflow"
```

## Task 11: Integration And End-To-End Verification

**Owner:** Coordinator with both agents

**Files:**
- Create or modify: `playwright.config.ts`
- Create: `e2e/staff-management.spec.ts`
- Update: documentation only if implemented behavior differs from the approved contract after an
  explicit user-approved change

- [ ] Merge the backend and frontend branches only after verifying neither changed committed
  contract schemas independently.
- [ ] Resolve generated TanStack route updates through the normal generator/build process; never
  hand-edit `src/routeTree.gen.ts`.
- [ ] Write end-to-end scenarios for online login, administrator user management, device
  activation, profile creation, attendance creation, offline reload, reconnection sync, report
  export in both formats, session expiry before sync, and protected-route rejection.
- [ ] Execute local D1 migrations and run the PWA/API against local Cloudflare-compatible
  development bindings.
- [ ] Verify service-worker behavior does not cache `/api/` responses or expose personal data or
  report files through ordinary caches.
- [ ] Verify audit entries exist for authentication, user management, device lifecycle, profile
  mutations, attendance mutations, export generation, and sync processing.
- [ ] Run:

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```

- [ ] Inspect the installed app workflow at a phone viewport first and desktop second, including
  offline transition and reduced-motion behavior.
- [ ] Conduct the backend security review before entering real child data.
- [ ] Commit:

```bash
git add .
git commit -m "test: verify offline staff management integration"
```

## Definition of Done

- `docs/FUTURE_FEATURES.md` accurately maps SIPP features by page and release boundary.
- `/login` authenticates the provisioned accounts, unauthorized users cannot reach `/staff`, and
  administrator-only controls remain protected.
- One approved device can be activated for offline use with per-user offline PIN unlock and
  explicit recovery warning.
- Staff can create, find, view, and update the approved enrollment-profile fields with an
  interface that requires minimal decisions.
- Staff can record and update daily attendance with the approved three-status model.
- Student Masterlist, Attendance Register / Summary, and Accomplishment Summary export in `PDF`
  and `XLSX` even while offline on the activated device.
- All records remain available offline in encrypted local storage, and queued writes and export
  audit events automatically synchronize to D1 after connectivity returns.
- API data and generated files are excluded from service-worker caching.
- Audit logging covers security, user management, device lifecycle, records, attendance, exports,
  and sync events.
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
