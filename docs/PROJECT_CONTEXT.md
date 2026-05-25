# Project Context

## Purpose

DCCMS Family Connect now serves two connected purposes in one repository:

- a public information site for the Day Care Center of Barangay San Antonio de Padua I,
  Dasmarinas City, Cavite
- a protected DCCMS management app for authorized daycare personnel

The protected app is approved V1 scope on the `management-system` branch. It includes Student
Records, Attendance, Reports, offline synchronization, and role-based access. This repository is
therefore no longer public-site-only work.

## Problem Context

The SIPP identifies the operational problems this product must address:

- slow retrieval from paper-based student records
- manual attendance tracking
- delayed manual report preparation
- weak or inconsistent internet connectivity
- security risk from scattered or poorly controlled data storage
- limited technical confidence among staff users

Product and implementation decisions should continue to optimize for those constraints first.

## Audience

- Public users: parents and guardians looking for announcements, contact information, and daycare
  context
- Staff users: authorized daycare personnel who create and maintain student records, attendance,
  and report exports
- Administrator users: authorized personnel who manage staff access, approved device activation,
  and audit visibility
- Project evaluators: reviewers inspecting scope, usability, and alignment with the SIPP

## Approved Public Pages

- Home: introduces the daycare center and points staff toward `/login`
- About: explains the daycare center, mission, values, and public context
- Announcements: presents parent-facing sample announcements until staff publishing is explicitly
  approved
- Contact: shows the official location plus visible placeholders for any unverified contact details
- Login: serves as the shared entry point into the protected staff application

## Approved Protected V1 Scope

Release 1 in this repository commits to the following protected capabilities:

- real login for authorized daycare personnel
- role-based access with `administrator` and `staff`
- protected staff home and navigation
- student-record creation, retrieval, viewing, and updating
- daily attendance creation, filtering, viewing, and updating
- report generation and export for Student Masterlist, Attendance Register / Summary, and
  Accomplishment Summary
- offline-capable operation on one activated daycare-controlled device
- local-first saves with automatic synchronization when connectivity returns

### Role Intent

- `administrator` manages users, approved offline device access, and audit visibility in addition
  to normal staff workflows
- `staff` manages approved records, attendance, and report exports but not user/device/audit
  administration

### Explicit V1 Limits

- Student records do not include archive/delete flows in V1
- Attendance uses the approved `Present`, `Absent`, and `Excused` model only
- Reports are export-oriented working documents; they are not claimed to be official government
  templates
- Public announcements remain sample-driven in V1

## Deferred For Later

The following may appear in the SIPP or earlier project materials, but they are not committed V1
features in this repo:

- health records
- child-development or activity records
- reminders and notifications
- staff-managed announcement publishing
- parent messaging or chat

These areas must stay clearly labeled as deferred if they are mentioned in documentation or UI
plans.

## Content Rules

Use clear, parent-friendly language on public pages. Keep the tone warm, simple, and official. Do
not invent official contact numbers, email addresses, Messenger URLs, office hours, faculty names,
or production credentials. If a value is unknown, leave a visible placeholder rather than guessing.

Use the official location as:

`Barangay San Antonio de Padua I, Dasmarinas City, Cavite, Philippines`

The current site still carries placeholders for contact number, email, office hours, Messenger
link, and map embed. Those placeholders should remain explicit until verified details are
provided.

## Product Boundary

This repository contains both the public website and the first protected management release. The
public site remains important, but the approved private management workflow is now equally in
scope.

Still out of scope unless later documentation expands them explicitly:

- payroll or financial management
- a separate native mobile app
- biometric authentication
- direct government-system integration beyond file export

## Implementation Direction

The login page in code started as a prototype, but the approved direction is to replace demo
behavior with a real authenticated entry into the protected staff system.

Implementation should preserve these principles:

- public pages remain ordinary website routes
- private staff data stays isolated from public content and public caches
- offline-first behavior is part of the committed V1 staff workflow
- records, attendance, reports, role-aware access, and sync are not optional add-ons for later
  unless a future approved plan changes scope

## Source Of Truth

Use the following authority order when deciding product intent:

1. `docs/paper/DayCareCenter_SIPP.md`
2. Approved implementation specs under `docs/superpowers/specs/`
3. `docs/FUTURE_FEATURES.md`
4. `docs/website_specifications.md`
5. Existing code and implementation-oriented docs such as `docs/ARCHITECTURE.md`

If these sources conflict, resolve the contradiction deliberately instead of carrying both
assumptions forward.
