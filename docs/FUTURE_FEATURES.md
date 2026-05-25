# DCCMS Roadmap

## Purpose

This roadmap replaces the earlier placeholder content and aligns the project direction with
`docs/paper/DayCareCenter_SIPP.md`, which is the requirements authority for management-system
work. It distinguishes what already exists in this repo, what is approved for the first protected
release, what is deferred, and what is out of scope.

## Source Priority

1. `docs/paper/DayCareCenter_SIPP.md`
2. Approved implementation specs under `docs/superpowers/specs/`
3. Existing repo docs such as `docs/PROJECT_CONTEXT.md` and `docs/website_specifications.md`

If these sources conflict, the SIPP and approved implementation specs take precedence for this
roadmap.

## Current Public Website

These pages are already part of the public-facing site and remain public in the protected-staff
roadmap:

| Page | Route | Current Role | V1 Status |
| --- | --- | --- | --- |
| Home | `/` | Introduces the daycare center and links staff to the login entry point | Keep |
| About | `/about` | Explains the center, mission, values, and public context | Keep |
| Announcements | `/announcements` | Parent-facing updates and notices | Keep as sample-driven in v1 |
| Contact | `/contact` | Public location and placeholder contact details | Keep |
| Staff Login | `/login` | Current prototype login entry point | Replace prototype with real authentication in v1 |

### Public Content Notes

- `/announcements` remains sample-driven in v1. It should continue to show placeholder/sample
  announcement content until a later staff-managed announcements feature is approved.
- Public pages must continue to avoid invented official details such as contact numbers, office
  hours, and Messenger URLs until the client provides them.
- The public website is not part of the installed offline staff PWA shell. Public pages remain
  regular web pages.

## Protected Staff V1

The first protected release is intentionally narrow. It addresses the SIPP requirement for secure,
offline-capable student record handling without expanding into other private modules yet.

### Approved V1 Pages

| Page | Route | Purpose |
| --- | --- | --- |
| Staff Login | `/login` | Authenticate the one provisioned staff account |
| Staff Home | `/staff` | Provide a simple protected landing page with one dominant next step |
| Student Records List | `/staff/students` | Find and open student enrollment records |
| New Student Record | `/staff/students/new` | Create an enrollment profile with the approved fields only |
| Student Record View | `/staff/students/$profileId` | Read-only view of one record |
| Student Record Edit | `/staff/students/$profileId/edit` | Update an existing record |

### Approved V1 Behavior

- Protected access for authorized daycare staff only
- One deployment-provisioned account for the initial release
- Mobile-first installed PWA behavior starts at `/login`, with desktop as a supplemental layout
- Offline-capable student enrollment records on one activated daycare-controlled device
- Local-first save flow with automatic synchronization when connectivity returns
- Student-record actions limited to create, find, view, and update
- The installed/offline app experience covers the staff login, activation, unlock, and protected
  staff pages only; it does not include the public website pages

### Why Student Records Come First

The SIPP identifies paper-based student records, slow retrieval, limited connectivity, and data
security as the main operational bottlenecks. Student Records is therefore the first protected
module because it directly addresses the highest-friction work while keeping scope controlled.

## Deferred Areas

These areas remain planned but are not part of the first protected release. They depend on the
authentication and student-records foundation being in place first.

| Area | Why Deferred | Key Dependency |
| --- | --- | --- |
| Attendance | The SIPP calls for attendance tracking, but v1 narrows private scope to student records only | Protected staff auth and canonical student profiles |
| Reports | The SIPP calls for report generation, but it depends on stable records and later attendance/activity data | Student records, attendance data, export rules |
| Activities / Child Development | Mentioned in the SIPP as curriculum and development support, but not needed for the first secure data workflow | Protected staff shell and stable profile model |
| Staff Announcement Management | Public announcements stay sample-driven in v1; authoring tools are deferred | Staff auth and approved content workflow |
| Reminders / Notifications | The SIPP mentions reminders, but scheduling and delivery behavior are not yet specified | Staff auth, records foundation, future delivery design |

### Deferred Release Principle

No deferred area should appear partially implemented, editable, or production-ready in v1. The
staff experience may label them as unavailable, but it must not expose working forms, fake data
entry, or implied completion.

## Explicit Exclusions

The following items are outside the approved scope for this roadmap unless a later plan explicitly
reintroduces them:

- Payroll or financial management
- Parent chat or direct teacher-parent messaging
- A separate native mobile application
- Biometric authentication or other advanced auth methods
- Direct government-system integration beyond future export-oriented reporting

## Release Boundary Summary

### Release 0: Public Information Site

- Home
- About
- Announcements with sample data
- Contact
- Prototype login entry

### Release 1: Protected Student Records V1

- Real staff login
- Protected staff home
- Offline-capable Student Records workflow
- One active device policy
- Local-first sync to canonical server storage

### Later Releases

- Attendance
- Reports
- Activities / Child Development
- Staff-managed announcements
- Reminders / notifications

## Implementation Notes

- The detailed locked decisions and shared contract summary for Student Records V1 live in
  [2026-05-25 Student Records Offline PWA Design](./superpowers/specs/2026-05-25-student-records-offline-pwa-design.md).
- This roadmap is intentionally product-facing. It describes approved boundaries, not technical
  implementation details beyond what is necessary to define scope.
