# Project Phases — DCCMS Family Connect

> **Purpose**: High-level roadmap for the full project lifecycle. Each phase builds on the
> previous one.

---

## Phase 1 — Public Website (Current)

**Goal**: Complete the public-facing website for the Barangay San Antonio de Padua I Day Care
Center.

**Scope**:

- Static informational pages: Home, About Us, Announcements, Contact Us
- Staff Login page (prototype UI only — local state, demo credentials)
- All content focused on the Day Care Center itself (not the software system)
- Hardcoded sample announcements demonstrating all required categories
- Placeholder values for unconfirmed official details (phone, email, hours, Messenger, map)
- Responsive design, mobile-friendly, accessible

**Deliverable**: A fully styled, content-complete public website deployable to Cloudflare Workers.

**Detailed spec**: See `docs/website_specifications.md` for page-by-page content requirements.

**Status**: 🔄 In progress

---

## Phase 2 — Website Backend

**Goal**: Add a backend layer to support dynamic content and real authentication.

**Scope** (projected):

- Real staff authentication (replace demo login with secure credential validation)
- Announcements API/CMS — enable daycare personnel to create, edit, and publish announcements
  from the management system, served as real-time data on the public site
- Contact form or inquiry submission (if requested by client)
- Session management and secure redirect to the private management system
- Backend infrastructure (API routes, database, or integration with an existing backend service)

**Deliverable**: A backend-connected public website with real authentication and dynamic
announcements.

**Dependencies**: Phase 1 must be complete. Backend technology decisions and API design need to
be finalized before implementation.

**Status**: 📋 Planned

---

## Phase 3 — Management System

**Goal**: Build the private Day Care Center Management System that authorized personnel access
after login.

**Scope** (abstract — details to be clarified with the client):

- Student record management (enrollment, personal information, guardian details)
- Attendance tracking (daily attendance, absence monitoring)
- Child health and nutrition monitoring (weight tracking, health records)
- Report generation (for submission to CSWD, DSWD, and other offices)
- Announcement management (create/edit/delete announcements shown on the public site)
- Parent communication tools (if requested)
- Offline-first capability (if requested — personnel may have limited internet access)
- Role-based access control (if multiple staff roles are needed)

**Deliverable**: A complete private management system accessible to authorized daycare personnel.

**Dependencies**: Phase 2 must be complete (authentication, backend infrastructure). Detailed
requirements gathering with the client is needed before implementation planning.

**Status**: 📋 Planned — requirements not yet finalized

---

## Phase Progression Rules

1. Each phase should be fully completed and verified before starting the next.
2. Scope changes within a phase should be documented in the relevant spec file before
   implementation.
3. Phase 3 requirements will be detailed in a separate specification document once the client
   provides concrete requirements.
4. The public website (Phase 1) should remain functional and deployable at all times — backend
   and management system work should not break the public site.
