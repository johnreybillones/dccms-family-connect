# Student Records Offline PWA Design

## Purpose

This spec freezes the approved product decisions for the first protected DCCMS release on the
`management-system` branch. It is derived from `docs/paper/DayCareCenter_SIPP.md` and narrows the
SIPP feature set into a controlled V1 implementation sequence.

## Approved Scope

- Real `/login` for authorized daycare staff
- Protected `/staff` home
- Protected Student Records list, new, view, and edit pages
- Cloud-backed canonical student records with one activated offline-capable device
- Local-first saves with automatic synchronization for approved record mutations

## Locked Product Decisions

### Source Priority

- `docs/paper/DayCareCenter_SIPP.md` overrides earlier roadmap notes if they conflict
- This spec defines the approved V1 release boundary for implementation work

### V1 Product Boundary

- V1 authenticated feature: Student Records only
- Public announcements remain sample-driven in v1
- The installed PWA starts from `/login` and covers only the staff login and protected staff
  experience
- Public website pages such as `/`, `/about`, `/announcements`, and `/contact` remain outside the
  PWA app shell
- V1 pages: `/login`, `/staff`, `/staff/students`, `/staff/students/new`,
  `/staff/students/$profileId`, and `/staff/students/$profileId/edit`
- Deferred private pages: Attendance, Reports, Activities/Child Development, Announcement
  Management, and Reminders

### Student Record Actions

- Allowed in v1: create, find, view, and update
- Not allowed in v1: archive, delete, health-record expansion, attendance fields, document
  uploads, report fields, or extra workflow modules

### User And Device Policy

- One deployment-provisioned staff account for the initial release
- Additional roles and account administration are deferred
- Exactly one activated daycare-controlled, OS-locked phone or desktop may hold real local student
  data
- Borrowed or shared devices are not approved for real student data

### Offline And Recovery Policy

- Staff must authenticate online to activate the device
- Activation establishes a 6-digit offline PIN
- The PIN is defense in depth for an approved controlled device, not a substitute for dedicated
  hardware policy
- Lost PIN or device requires online reauthentication and reactivation
- Unsynced local changes are unrecoverable after local reset, so the UI must warn before reset

### UX Direction

- Mobile-first installed PWA beginning at staff login, with desktop as a supplemental layout
- Reduce staff decisions: one dominant action per screen
- Use one guided enrollment form rather than multiple competing flows
- Use one prominent search box for finding records
- Use plain-language status, no fake dashboard metrics

### UI Decision Note

The staff UI should stay branded and task-focused. It should reuse the existing Fredoka and Nunito
fonts and the current OKLCH theme tokens, avoid decorative image-heavy record screens, keep one
primary action per view, and respect reduced-motion preferences.

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

### Authentication, Device, And Sync Concepts

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

### API Summary

| Endpoint | Success Shape | Required Failure Behavior |
| --- | --- | --- |
| `POST /api/auth/login` | `{ user, hasActiveDevice }` plus session cookie | `401 INVALID_CREDENTIALS` |
| `POST /api/auth/logout` | `204` and cleared session cookie | Safe and idempotent |
| `GET /api/auth/session` | `{ user, device }` | `401 UNAUTHENTICATED` |
| `POST /api/staff/device/activate` | `{ device, bootstrapRequired: true }` | `409 DEVICE_ALREADY_ACTIVE` |
| `POST /api/staff/device/deactivate` | `204` | Requires authenticated session |
| `GET /api/staff/bootstrap?deviceId=...` | `{ profiles, syncedAt }` | `403 DEVICE_NOT_ACTIVE` |
| `POST /api/staff/sync` | `{ acknowledgedOperationIds, profiles, syncedAt }` | `401 REAUTH_REQUIRED`, `403 DEVICE_NOT_ACTIVE`, `409 REFRESH_REQUIRED` |

## Security And Data Handling Rules

- The service worker and installable app shell must be scoped to the staff login and protected
  staff experience, not the public website
- API responses containing personal data must not be cached by the browser or service worker
- `POST /api/staff/sync` is the only V1 write transport for profile mutations
- Online and offline UI both save locally first, then synchronize through the sync endpoint
- Synchronization is treated as single-writer because only one active offline device is allowed
- A server-side revision mismatch returns `REFRESH_REQUIRED` and must not silently discard local
  pending edits

## Release Discipline

- Do not expand V1 scope beyond Student Records without an approved follow-up plan
- Do not silently change field names, endpoint payloads, sync states, or device policy during
  later tasks
- Do not present placeholders or deferred modules as completed features

## Related Documents

- [SIPP Source Document](../../paper/DayCareCenter_SIPP.md)
- [Roadmap](../../FUTURE_FEATURES.md)
- [Project Context](../../PROJECT_CONTEXT.md)
- [Website Specifications](../../website_specifications.md)
