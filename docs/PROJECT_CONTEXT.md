# Project Context

## Purpose

DCCMS Family Connect serves two connected purposes in this repository:

- a public information site for the Day Care Center of Barangay San Antonio de Padua I,
  Dasmarinas City, Cavite
- the approved protected DCCMS staff application for student records, attendance, report export,
  offline sync, and role-based access

The product should help parents, guardians, daycare personnel, barangay officials, and project
evaluators understand the daycare center while also giving authorized staff a practical internal
workflow for daily record management and reporting.

## Audience

- Public users: parents and guardians looking for announcements, contact information, and daycare
  context
- Staff users: authorized daycare personnel using the protected management workflow
- Administrative users: authorized personnel who manage staff access, device activation, and audit
  visibility
- Project evaluators: reviewers inspecting scope, usability, and system intent

## Approved Public Pages

- Home: introduces the daycare center and links staff to the login entry point
- About: explains the center, mission, values, partners, and commitments
- Announcements: presents parent-facing daycare announcements using sample data until staff
  publishing is explicitly built
- Contact: displays address, communication channels, office hours, Messenger access, and map
- Login: serves as the entry point to the protected staff application

## Approved Protected V1 Scope

Release 1 in this repository includes:

- role-based login for `administrator` and `staff`
- student record creation, retrieval, viewing, and editing
- daily attendance entry and editing using `Present`, `Absent`, and `Excused`
- report generation and export for Student Masterlist, Attendance Register / Summary, and
  Accomplishment Summary
- offline-capable operation with local-first save and automatic sync when connectivity returns

Release 1 does not yet include health records, child-development/activity records, reminders,
notifications, or staff-managed announcement publishing.

## Content Rules

Use clear, parent-friendly language on public pages. Keep the tone warm, simple, and official. Do
not invent official contact numbers, email addresses, Messenger URLs, office hours, faculty names,
or production credentials. If missing, keep visible placeholders or ask for the exact value before
finalizing public content.

Use the official location as:

`Barangay San Antonio de Padua I, Dasmarinas City, Cavite, Philippines`

The current site includes placeholders for contact number, email, office hours, Messenger link,
and map embed. These should stay explicit until verified details are provided.

## Product Boundary

This repo is no longer limited to the public website only. It now explicitly includes the first
protected DCCMS management release on the `management-system` branch.

Still out of scope unless later documentation expands them explicitly:

- payroll or financial management
- direct teacher-parent chat
- a separate native mobile app
- biometric authentication
- direct government-system integration beyond export-oriented reporting

## Implementation Direction

The login page is currently a prototype in code, but the approved direction is to replace demo
behavior with a real protected flow backed by concrete API and security requirements. Public pages
remain ordinary website routes. Protected routes must keep personal data isolated from public
content, public caches, and unauthenticated responses.

## Source of Truth

Use this file, `docs/FUTURE_FEATURES.md`, and `docs/website_specifications.md` for product intent.
Use `docs/ARCHITECTURE.md`, the approved protected-app spec under `docs/superpowers/specs/`, and
the codebase for implementation truth. If these documents conflict with source code or the SIPP,
inspect the code and update the docs or implementation deliberately.
