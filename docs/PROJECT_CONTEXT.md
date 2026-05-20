# Project Context

## Purpose

DCCMS Family Connect is the public information layer for the Day Care Center Management System
serving Barangay San Antonio de Padua I, Dasmarinas City, Cavite. The site should help parents,
guardians, daycare personnel, barangay officials, and project evaluators understand the system
and find public daycare information.

## Audience

Primary public users are parents and guardians looking for announcements, contact information,
and daycare context. Staff users use the login page as the entry point to the private system.
Project evaluators may also inspect the site to understand scope, usability, and system intent.

## Approved Public Pages

- Home: introduces DCCMS and links to staff login.
- About: explains who built the project, mission, vision, partners, and commitments.
- Announcements: presents daycare announcements and parent-facing updates.
- Contact: displays address, communication channels, office hours, Messenger access, and map.
- Login: states that access is for authorized daycare personnel only.

## Content Rules

Use clear, parent-friendly language. Keep the tone warm, simple, and official. Do not invent
official contact numbers, email addresses, Messenger URLs, office hours, faculty names, or
production credentials. If missing, keep visible placeholders or ask for the exact value before
finalizing public content.

Use the official location as:

`Barangay San Antonio de Padua I, Dasmarinas City, Cavite, Philippines`

The current site includes placeholders for contact number, email, office hours, Messenger link,
and map embed. These should stay explicit until verified details are provided.

## Product Boundary

This repo is not the full private DCCMS management app. Do not add student record management,
attendance workflows, report generation, parent portals, Supabase integration, or offline sync
unless the task explicitly expands this repo's scope.

The login page is currently a prototype. It uses local state and demo behavior. Treat any real
authentication, credential storage, session handling, redirect URL, or audit logging as future
work requiring a concrete API/security requirement.

## Source of Truth

Use this file and `docs/website_specifications.md` for product intent. Use
`docs/ARCHITECTURE.md` and the codebase for implementation truth. If this document conflicts
with source code, inspect the code and update the docs or implementation deliberately.
