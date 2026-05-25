# Student Records, Attendance, and Reports Offline PWA Design

## Purpose

This spec defines the approved V1 protected release for DCCMS on the `management-system` branch.
It is derived from `docs/paper/DayCareCenter_SIPP.md` and aligns the first implementation
boundary with the SIPP requirements for student records, attendance, report generation, offline
operation, and role-based access.

## Approved Scope

- Real `/login` for authorized daycare personnel
- Protected `/staff` home
- Protected Student Records list, new, view, and edit pages
- Protected Attendance list, daily entry, and edit pages
- Offline-capable report export for Student Masterlist, Attendance Register/Summary, and
  Accomplishment Summary
- Cloud-backed canonical records with one activated daycare-controlled offline device
- Local-first saves with automatic synchronization for approved record and audit mutations

## Locked Product Decisions

### Source Priority

- `docs/paper/DayCareCenter_SIPP.md` overrides earlier roadmap notes if they conflict
- This spec defines the approved V1 release boundary for implementation work

### V1 Product Boundary

- V1 authenticated features: Student Records, Attendance, and Reports
- Public announcements remain sample-driven in v1
- The installed PWA starts from `/login` and covers only the staff login and protected staff
  experience
- Public website pages such as `/`, `/about`, `/announcements`, and `/contact` remain outside the
  PWA app shell
- V1 pages:
  - `/login`
  - `/staff`
  - `/staff/students`
  - `/staff/students/new`
  - `/staff/students/$profileId`
  - `/staff/students/$profileId/edit`
  - `/staff/attendance`
  - `/staff/attendance/new`
  - `/staff/attendance/$entryId/edit`
  - `/staff/reports`
- Deferred private pages: Activities / Child Development, Staff Announcement Management, and
  Reminders / Notifications

### Record and Report Actions

- Allowed in v1 for student records: create, find, view, and update
- Allowed in v1 for attendance: create, filter, view, and update
- Allowed in v1 for reports: generate and export offline-capable files in `PDF` and `XLSX`
- Not allowed in v1: archive, delete, health-record expansion, child-development records,
  document uploads, parent chat, or extra workflow modules

### User Roles and Device Policy

- V1 roles are `administrator` and `staff`
- `administrator` can provision/deactivate staff accounts, manage the approved offline device,
  access student records and attendance, generate exports, and view audit history
- `staff` can access student records and attendance and generate approved exports, but cannot
  manage users, manage devices, or browse audit history
- Exactly one activated daycare-controlled, OS-locked phone or desktop may hold real local data
- Borrowed or shared devices are not approved for real student data

### Offline and Recovery Policy

- Staff must authenticate online to activate the device
- The activated device keeps an encrypted local replica of student records, attendance, and queued
  audit/export metadata
- Each authorized user on the activated device must enroll an individual offline PIN after a
  successful online login
- The offline PIN is defense in depth for an approved controlled device, not a substitute for
  dedicated hardware policy
- Lost PIN or device requires online reauthentication and reactivation
- Unsynced local changes are unrecoverable after local reset, so the UI must warn before reset

### UX Direction

- Mobile-first installed PWA beginning at staff login, with desktop as a supplemental layout
- Reduce staff decisions: one dominant action per screen
- Use one guided enrollment form rather than multiple competing flows
- Use one prominent search box for finding student records
- Use one clear day/date picker plus a small attendance status set for daily attendance
- Use plain-language status, no fake dashboard metrics

### UI Decision Note

The staff UI should stay branded and task-focused. It should reuse the existing Fredoka and Nunito
fonts and the current OKLCH theme tokens, avoid decorative image-heavy management screens, keep
one primary action per view, and respect reduced-motion preferences.

## Shared Contract Summary

All later implementation tasks must use the exact field names and concepts summarized here.

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

Validation summary:

- Required trimmed text: child first name, child last name, address, guardian full name,
  guardian relationship, guardian contact number
- Optional text persists as `null`, not empty strings
- `birthDate` and `enrollmentDate` use `YYYY-MM-DD`
- `birthDate` cannot be later than `enrollmentDate`
- `schoolYear` uses `YYYY-YYYY`, and the second year must be the first year plus one
- Possible duplicate warning: same normalized child first name, child last name, and birth date
- `recordNumber` displays `Awaiting sync` until the server assigns a canonical sequential number

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

Validation summary:

- `attendanceDate` uses `YYYY-MM-DD`
- `status` must be one of `present`, `absent`, or `excused`
- `note` is required when `status === "excused"` and otherwise stored as `null`
- One canonical attendance record exists per `profileId` plus `attendanceDate`

### Authentication, Device, Reports, and Sync Concepts

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

### API Summary

| Endpoint | Success Shape | Required Failure Behavior |
| --- | --- | --- |
| `POST /api/auth/login` | `{ user, hasActiveDevice, offlinePinEnrolled }` plus session cookie | `401 INVALID_CREDENTIALS` |
| `POST /api/auth/logout` | `204` and cleared session cookie | Safe and idempotent |
| `GET /api/auth/session` | `{ user, device }` | `401 UNAUTHENTICATED` |
| `POST /api/admin/staff-users` | `{ user }` | `403 FORBIDDEN`, validation errors |
| `POST /api/admin/staff-users/$userId/deactivate` | `204` | `403 FORBIDDEN` |
| `GET /api/admin/audit-events` | `{ events }` | `403 FORBIDDEN` |
| `POST /api/staff/device/activate` | `{ device, bootstrapRequired: true }` | `409 DEVICE_ALREADY_ACTIVE` |
| `POST /api/staff/device/deactivate` | `204` | Requires authenticated administrator session |
| `GET /api/staff/bootstrap?deviceId=...` | `{ profiles, attendanceRecords, syncedAt }` | `403 DEVICE_NOT_ACTIVE` |
| `POST /api/staff/sync` | `{ acknowledgedOperationIds, profiles, attendanceRecords, syncedAt }` | `401 REAUTH_REQUIRED`, `403 DEVICE_NOT_ACTIVE`, `409 REFRESH_REQUIRED` |

## Reporting Rules

- Reports are generated on the unlocked authorized client from the encrypted local replica so they
  can be exported while offline
- Report export is supported for:
  - Student Masterlist for a selected school year
  - Attendance Register / Summary for a selected date range
  - Accomplishment Summary for a selected period
- Exported files are submission-ready working documents for CSWD and regional-office workflows,
  but they are not claimed to match any official government template
- Each export must visibly indicate the generation timestamp and whether unsynced local changes
  were included
- The app must never cache report files or API responses containing personal data in public caches

## Security and Data Handling Rules

- The service worker and installable app shell must be scoped to the staff login and protected
  staff experience, not the public website
- API responses containing personal data must not be cached by the browser or service worker
- `POST /api/staff/sync` is the only V1 write transport for profile, attendance, and export-audit
  mutations
- Online and offline UI both save locally first, then synchronize through the sync endpoint
- Synchronization is treated as single-writer because only one active offline device is allowed
- A server-side revision mismatch returns `REFRESH_REQUIRED` and must not silently discard local
  pending edits
- Deactivated users lose online access immediately and lose offline access after the next
  successful authorization sync on the activated device

## Release Discipline

- Do not reduce V1 below Student Records, Attendance, Reports, offline sync, and role-based access
- Do not silently change field names, endpoint payloads, sync states, roles, or the device policy
  during later tasks
- Do not present deferred modules as completed features
- The following SIPP areas remain deferred and must be called out explicitly when relevant:
  - health records
  - child-development and activity records
  - reminders and notifications
  - staff-managed announcement publishing

## Related Documents

- [SIPP Source Document](../../paper/DayCareCenter_SIPP.md)
- [Roadmap](../../FUTURE_FEATURES.md)
- [Architecture](../../ARCHITECTURE.md)
- [Project Context](../../PROJECT_CONTEXT.md)
- [Website Specifications](../../website_specifications.md)
