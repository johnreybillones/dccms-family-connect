# DCCMS Roadmap

## Purpose

This roadmap aligns project direction with `docs/paper/DayCareCenter_SIPP.md`, which is the
requirements authority for `management-system` work. It distinguishes what already exists in this
repo, what is approved for the first protected release, what remains deferred, and what is out of
scope.

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

Release 1 is the first real protected management release inside this repository. It covers the
minimum SIPP-aligned operational workflow needed for authorized daycare staff to maintain records,
track attendance, and prepare exportable reports even with unstable connectivity.

### Approved V1 Pages

| Page | Route | Purpose |
| --- | --- | --- |
| Staff Login | `/login` | Authenticate authorized personnel |
| Staff Home | `/staff` | Provide a simple protected landing page with the primary staff actions |
| Student Records List | `/staff/students` | Find and open student enrollment records |
| New Student Record | `/staff/students/new` | Create an enrollment profile with the approved fields only |
| Student Record View | `/staff/students/$profileId` | Read-only view of one record |
| Student Record Edit | `/staff/students/$profileId/edit` | Update an existing record |
| Attendance List | `/staff/attendance` | Review attendance entries by date and student |
| New Attendance Entry | `/staff/attendance/new` | Record daily attendance |
| Attendance Edit | `/staff/attendance/$entryId/edit` | Update an attendance entry |
| Reports | `/staff/reports` | Generate and export the approved reports in `PDF` and `XLSX` |

### Approved V1 Behavior

- Protected access for authorized daycare personnel with `administrator` and `staff` roles
- One deployment-provisioned administrator account plus staff accounts managed by the administrator
- Mobile-first installed PWA behavior starts at `/login`, with desktop as a supplemental layout
- Offline-capable student records, attendance, and report export on one activated
  daycare-controlled device
- Local-first save flow with automatic synchronization when connectivity returns
- Student-record actions limited to create, find, view, and update
- Attendance actions limited to create, filter, view, and update
- Report generation for:
  - Student Masterlist
  - Attendance Register / Summary
  - Accomplishment Summary
- Report export formats limited to `PDF` and `XLSX`
- The installed/offline app experience covers the staff login, activation, unlock, and protected
  staff pages only; it does not include the public website pages

### Why This V1 Boundary

The SIPP identifies paper-based student records, slow retrieval, unstable connectivity, delayed
reporting, and the need for role-based protection as the main operational bottlenecks. Release 1
therefore includes the smallest coherent private workflow that addresses those bottlenecks without
claiming the entire future management system is complete.

## Deferred Areas

These areas remain planned but are not part of Release 1. They must not be presented as partially
working or production-ready during v1 implementation.

| Area | Why Deferred | Key Dependency |
| --- | --- | --- |
| Activities / Child Development | The SIPP mentions curriculum and developmental tracking, but this is separate from the initial records/attendance/reporting workflow | Stable protected shell and profile model |
| Health Records | The SIPP references health-related data, but v1 stays with enrollment records plus attendance only | Stable profile model and approved health-data schema |
| Staff Announcement Management | Public announcements stay sample-driven in v1; authoring tools are deferred | Staff auth and approved content workflow |
| Reminders / Notifications | The SIPP mentions reminders, but scheduling and delivery behavior are not yet specified | Staff auth, records foundation, future delivery design |

### Deferred Release Principle

No deferred area should appear editable, production-ready, or implicitly complete in v1. If shown
in the staff experience at all, it must be clearly labeled as unavailable.

## Explicit Exclusions

The following items are outside the approved scope for this roadmap unless a later plan explicitly
reintroduces them:

- Payroll or financial management
- Parent chat or direct teacher-parent messaging
- A separate native mobile application
- Biometric authentication or other advanced auth methods
- Direct government-system integration beyond export-oriented reporting

## Release Boundary Summary

### Release 0: Public Information Site

- Home
- About
- Announcements with sample data
- Contact
- Prototype login entry

### Release 1: Protected Records, Attendance, and Reports V1

- Real staff login
- Role-based access for `administrator` and `staff`
- Protected staff home
- Offline-capable Student Records workflow
- Offline-capable Attendance workflow
- Offline report generation and export in `PDF` and `XLSX`
- One active device policy
- Local-first sync to canonical server storage

### Later Releases

- Health records
- Activities / Child Development
- Staff-managed announcements
- Reminders / notifications

## Implementation Notes

- The detailed locked decisions and shared contract summary for Release 1 live in
  [2026-05-25 Student Records Offline PWA Design](./superpowers/specs/2026-05-25-student-records-offline-pwa-design.md).
- This roadmap is intentionally product-facing. It describes approved boundaries, not technical
  implementation details beyond what is necessary to define scope.
