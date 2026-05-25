# DCCMS Roadmap

## Purpose

This roadmap aligns repo scope with `docs/paper/DayCareCenter_SIPP.md`, which is the product
requirements authority for `management-system` work. It distinguishes the already-shipped public
site from the committed V1 protected management release and the features that remain deferred.

## Source Priority

1. `docs/paper/DayCareCenter_SIPP.md`
2. Approved implementation specs under `docs/superpowers/specs/`
3. Repo product docs such as `docs/PROJECT_CONTEXT.md` and `docs/website_specifications.md`

If these sources conflict, the SIPP and approved implementation specs take precedence for roadmap
decisions.

## Release Structure

### Release 0: Public Information Site

The existing public-facing pages remain part of this repository and remain publicly accessible.

| Page          | Route            | Purpose                                                              | Status in Expanded V1          |
| ------------- | ---------------- | -------------------------------------------------------------------- | ------------------------------ |
| Home          | `/`              | Introduces the daycare center and provides a staff login entry point | Keep public                    |
| About         | `/about`         | Explains the daycare center, mission, values, and context            | Keep public                    |
| Announcements | `/announcements` | Parent-facing updates and notices                                    | Keep public and sample-driven  |
| Contact       | `/contact`       | Public location and contact placeholders                             | Keep public                    |
| Login         | `/login`         | Entry point into the protected staff experience                      | Upgrade to real authentication |

Public-site notes:

- Public announcements remain sample-driven in V1. Staff authoring for announcements is deferred.
- Public pages must not invent official details such as contact numbers, office hours, Messenger
  links, or staff names until the client supplies them.
- The public website does not become part of the installed offline staff app shell.

### Release 1: Protected Management App

Release 1 is now the committed first protected DCCMS management release in this repository. It is
not a placeholder or prototype scope. It includes Student Records, Attendance, Reports, offline
sync, and role-based access as approved V1 features.

| Area                    | Routes                                                                                                    | V1 Commitment                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Authentication          | `/login`                                                                                                  | Real staff login with protected session handling                                                                      |
| Staff Home              | `/staff`                                                                                                  | Protected landing page for staff workflows                                                                            |
| Student Records         | `/staff/students`, `/staff/students/new`, `/staff/students/$profileId`, `/staff/students/$profileId/edit` | Create, find, view, and update enrollment records                                                                     |
| Attendance              | `/staff/attendance`, `/staff/attendance/new`, `/staff/attendance/$entryId/edit`                           | Create, filter, view, and update daily attendance                                                                     |
| Reports                 | `/staff/reports`                                                                                          | Generate and export Student Masterlist, Attendance Register / Summary, and Accomplishment Summary in `PDF` and `XLSX` |
| Offline Device Workflow | protected staff flow                                                                                      | One activated daycare-controlled device, local-first saves, and automatic sync when online                            |
| Access Control          | protected staff flow                                                                                      | `administrator` and `staff` roles with separate responsibilities                                                      |

### Committed V1 Behavior

- Protected access for authorized daycare personnel only
- Two committed roles:
  - `administrator` manages staff accounts, device activation/deactivation, export oversight, and
    audit visibility
  - `staff` manages approved student-record, attendance, and report-export workflows
- Mobile-first protected experience with desktop support
- One approved activated daycare-controlled device may hold encrypted local data for offline use
- Online and offline staff actions save locally first and synchronize automatically when
  connectivity returns
- Student-record actions are limited to create, find, view, and update
- Attendance actions are limited to create, filter, view, and update
- Reports are generated from the unlocked local replica and exported in `PDF` and `XLSX`
- Public pages remain public and continue to coexist with the protected staff app in this repo

### Why This Is The V1 Boundary

The SIPP identifies paper-based records, slow retrieval, unstable connectivity, insecure storage,
and manual reporting as the main operational problems. Release 1 therefore includes the smallest
complete protected workflow that directly addresses those problems:

- authenticated staff access
- student-record management
- attendance management
- report export
- offline-first operation with automatic synchronization

## Deferred Areas

These items are still acknowledged by the SIPP or earlier project materials, but they are not part
of the committed V1 release. They must not be presented as already available.

| Area                           | V1 Decision                               | Reason                                                                          |
| ------------------------------ | ----------------------------------------- | ------------------------------------------------------------------------------- |
| Health Records                 | Deferred                                  | V1 keeps the record model focused on approved enrollment fields plus attendance |
| Activities / Child Development | Deferred                                  | Separate workflow not required for the first operational release                |
| Staff Announcement Management  | Deferred                                  | Public announcements stay sample-driven in V1                                   |
| Reminders / Notifications      | Deferred                                  | Mentioned in source materials but not required for the first protected workflow |
| Parent Messaging / Chat        | Deferred and out of current release scope | Not part of the approved protected V1 implementation                            |

Deferred release rule:

- Deferred modules may be mentioned in roadmap language, but they must be clearly labeled as not
  available yet if referenced in product or UI docs.

## Explicit Exclusions

The following remain out of scope unless a later approved plan expands them:

- payroll or financial management
- biometric or advanced authentication beyond the approved V1 session and offline PIN model
- a separate native mobile application
- direct integration with government systems beyond file export

## Release Summary

### Current Public Site

- Home
- About
- Announcements with sample data
- Contact
- Login entry point

### Expanded V1 Protected Release

- Real login for staff accounts
- Role-based access for `administrator` and `staff`
- Protected staff home
- Offline-capable Student Records workflow
- Offline-capable Attendance workflow
- Offline-capable Reports workflow with `PDF` and `XLSX` export
- One approved-device policy
- Local-first persistence with automatic sync to canonical server storage

### Later Releases

- Health records
- Activities / Child Development
- Staff-managed announcements
- Reminders / notifications

## Implementation Notes

- The detailed V1 product decisions and contract summary live in
  [2026-05-25 Student Records Offline PWA Design](./superpowers/specs/2026-05-25-student-records-offline-pwa-design.md).
- This roadmap is product-facing. It defines committed boundaries and release separation rather
  than low-level implementation details.
