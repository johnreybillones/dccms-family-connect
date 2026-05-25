# Student Records, Attendance, and Reports Offline PWA Design

## Purpose

This spec defines the committed V1 protected DCCMS release on the `management-system` branch. It
translates the SIPP into an implementation boundary that explicitly includes Student Records,
Attendance, Reports, offline synchronization, and role-based access while preserving the existing
public website.

## Source Priority

- `docs/paper/DayCareCenter_SIPP.md` is the product requirements authority
- This spec defines the approved V1 implementation boundary for the protected management app
- Repo docs must align to this spec rather than treating these behaviors as deferred or optional

## Committed V1 Scope

V1 is the first real protected management release in this repository. The following are committed
behavior, not future placeholders:

- real `/login` for authorized daycare personnel
- protected `/staff` home
- protected Student Records list, create, view, and edit pages
- protected Attendance list, create, and edit pages
- protected Reports page with local `PDF` and `XLSX` export
- `administrator` and `staff` role separation
- one activated daycare-controlled device for offline-capable use
- local-first save flow with automatic synchronization back to canonical server storage

## Locked Product Decisions

### V1 Product Boundary

- V1 authenticated features are Student Records, Attendance, and Reports
- Public announcements remain sample-driven in V1
- The installed PWA starts from `/login` and covers the staff login and protected staff experience
- Public website pages such as `/`, `/about`, `/announcements`, and `/contact` remain outside the
  installable staff app shell
- V1 pages are:
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
- Deferred private pages remain:
  - Activities / Child Development
  - Staff Announcement Management
  - Reminders / Notifications

### Record, Attendance, and Report Actions

- Student Records support create, find, view, and update only
- Attendance supports create, filter, view, and update only
- Reports support generate and export only, using `PDF` and `XLSX`
- V1 does not include archive, delete, health-record expansion, child-development records,
  document uploads, direct parent messaging, or extra workflow modules

### Roles And Permissions

- V1 roles are `administrator` and `staff`
- `administrator` can:
  - create and deactivate staff users
  - activate and deactivate the approved offline device
  - access student records and attendance
  - generate approved exports
  - review audit history
- `staff` can:
  - access student records and attendance
  - generate approved exports
  - use the approved offline workflow on the activated device
- `staff` cannot manage users, device lifecycle, or audit-history access

### Device And Offline Policy

- Exactly one activated daycare-controlled, OS-locked phone or desktop may hold real local data
- Borrowed or shared devices are not approved for real student data
- Staff must authenticate online before first offline use on the activated device
- The activated device keeps an encrypted local replica of student records, attendance, and queued
  export-audit metadata
- Each authorized user on the activated device must enroll an individual 6-digit offline PIN after
  a successful online login
- The offline PIN is defense in depth for the approved device, not a substitute for the dedicated
  hardware rule

### Recovery Policy

- Lost PIN or lost device requires online reauthentication and reactivation
- Local reset is allowed only with a clear warning that unsynced local changes will be lost
- Deactivated users lose online access immediately and lose offline access after the next
  successful authorization sync on the activated device

### UX Direction

- Mobile-first installed PWA beginning at staff login, with desktop as supplemental support
- Reduce staff decisions by keeping one dominant action per screen
- Use one guided enrollment form rather than competing record-entry flows
- Use one prominent search box for student lookup
- Use one clear date context plus a small attendance status set
- Keep status language plain and operational; do not fill the staff home with fake metrics

### UI Decision Note

The staff UI should stay branded and task-focused. Reuse the existing Fredoka and Nunito fonts and
current OKLCH theme tokens, avoid decorative image-heavy management screens, keep one primary
action per view, and respect reduced-motion preferences.

## Committed Workflows

### Student Records Workflow

- Staff can create enrollment records with the approved field set only
- Staff can find records by simple lookup and open a read-only detail view
- Editing is intentional and separate from read-only viewing
- New offline-created records show `Awaiting sync` until the server assigns a canonical sequential
  record number

### Attendance Workflow

- Attendance is recorded per student per day
- Valid statuses are `present`, `absent`, and `excused`
- `excused` requires a note
- One canonical attendance record exists for each student/date pair

### Reports Workflow

- Reports are generated from the unlocked local replica so they remain available while offline
- Supported report outputs are:
  - Student Masterlist
  - Attendance Register / Summary
  - Accomplishment Summary
- Supported export formats are `PDF` and `XLSX`
- Each export must indicate generation time and whether unsynced changes were included
- Export audit records are part of the synchronization model

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
- Possible duplicate warning uses normalized child first name, child last name, and birth date
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
| `POST /api/auth/login` | `{ user, hasActiveDevice, offlinePinEnrolled }` plus session cookie | `401 INVALID_CREDENTIALS`; log failed attempt |
| `POST /api/auth/logout` | `204` and cleared session cookie | Safe and idempotent |
| `GET /api/auth/session` | `{ user, device }` | `401 UNAUTHENTICATED` |
| `POST /api/admin/staff-users` | `{ user }` | `403 FORBIDDEN`, validation errors |
| `POST /api/admin/staff-users/$userId/deactivate` | `204` | `403 FORBIDDEN` |
| `GET /api/admin/audit-events` | `{ events }` | `403 FORBIDDEN` |
| `POST /api/staff/device/activate` | `{ device, bootstrapRequired: true }` | `409 DEVICE_ALREADY_ACTIVE` unless replacing after explicit deactivation |
| `POST /api/staff/device/deactivate` | `204` | Requires authenticated administrator session |
| `GET /api/staff/bootstrap?deviceId=...` | `{ profiles, attendanceRecords, syncedAt }` | `403 DEVICE_NOT_ACTIVE`; `Cache-Control: no-store` |
| `POST /api/staff/sync` | `{ acknowledgedOperationIds, profiles, attendanceRecords, syncedAt }` | `401 REAUTH_REQUIRED`, `403 DEVICE_NOT_ACTIVE`, `409 REFRESH_REQUIRED` |

## Reporting Rules

- Reports are generated on the unlocked authorized client from the encrypted local replica so they
  can be exported while offline
- Report export is committed for:
  - Student Masterlist by school year
  - Attendance Register / Summary by date range
  - Accomplishment Summary by selected period
- Exported files are submission-ready working documents for CSWD and regional-office workflows,
  but they are not claimed to match official government templates
- Export audit records must sync like other protected mutations
- Report files and API responses containing personal data must never be cached in the service
  worker or exposed through public asset paths

## Synchronization Rules

- `POST /api/staff/sync` is the only V1 write transport for profile, attendance, and export-audit
  mutations
- Online and offline UI both save locally first, then synchronize through the sync endpoint
- Synchronization is single-writer because only one active offline device is allowed
- Revision mismatch returns `REFRESH_REQUIRED` and must not silently discard local pending edits
- Offline auto-sync is committed V1 behavior when connectivity returns and authorization remains
  valid

## Release Discipline

- Do not reduce V1 below Student Records, Attendance, Reports, offline sync, and role-based access
- Do not silently change field names, endpoint payloads, sync states, roles, or device policy
- Do not present deferred modules as completed features
- The following SIPP-adjacent areas remain deferred and must be called out explicitly when needed:
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
