# Website Specifications — Phase 1 Content Plan

> **Purpose**: This document is the source of truth for the content to be placed on each page of
> the public-facing website. It serves as the implementation plan for revising all page content
> from its current DCCMS-system focus to a **Barangay San Antonio de Padua I Day Care Center**
> focus.
>
> **Scope**: Phase 1 — static public website only. No backend, no CMS, no management system
> features. See `docs/PHASES.md` for the full project roadmap.

---

## General Content Direction

### Current State (What Exists Now)

The website currently presents itself as a showcase for the **Day Care Center Management System
(DCCMS)** — the software product built by student developers. Content emphasizes system features
(Student Records, Attendance Tracking, Reports), the development team, and software design
principles.

### Target State (What It Should Become)

The website should present itself as the **official public information site for the Barangay San
Antonio de Padua I Day Care Center**. Content should focus on the center itself — its mission,
programs, personnel, announcements, and contact details. The DCCMS software is an internal tool;
it should not be the public-facing identity.

### Content Rules

- Use clear, parent-friendly language. Warm, simple, and official tone.
- Do not invent official contact numbers, email addresses, Messenger URLs, office hours, or
  production credentials. Keep visible `[placeholder]` text until verified values are provided.
- Confirmed real details:
  - **Location**: Barangay San Antonio de Padua I, Dasmariñas City, Cavite, Philippines
  - **Personnel name**: Ms. Cherry (confirmed daycare personnel)
- All other official details remain as placeholders.

---

## A. Shared Components

### A1. Navbar (`src/components/Navbar.tsx`)

**Current**: Logo area shows "DCCMS" with subtitle "Day Care Center · Management System".

**Change to**:

| Element      | Current                                 | New                            |
| ------------ | --------------------------------------- | ------------------------------ |
| Primary text | `DCCMS`                                 | `Day Care Center`              |
| Subtitle     | `Day Care Center` / `Management System` | `Brgy. San Antonio de Padua I` |
| Aria-label   | `DCCMS Home`                            | `Day Care Center Home`         |

Navigation links remain the same: Home, About Us, Announcements, Contact Us, Login.

---

### A2. Footer (`src/components/Footer.tsx`)

**Current**: Has a "System" column with non-functional links (Student Records, Attendance, Offline
Access) and a "Community" column. Social media icons link to `#`.

**Change to**:

| Column               | Current                                                        | New                                                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Column 1 (Logo)      | Seal + social media icons                                      | Seal + social media icons (keep as-is; links stay `#` until real accounts are provided)                                                                                                            |
| Column 2 "System"    | Student Records, Attendance, Offline Access                    | **Remove entirely** — replace with a "Quick Links" column: Home (`/`), About Us (`/about`), Announcements (`/announcements`), Contact Us (`/contact`)                                              |
| Column 3 "Explore"   | Home, About Us, Announcements, Contact Us                      | **Rename to "Day Care Center"** with items: Our Mission (`/about`), Our Programs (`/about`), Meet Our Team (`/about`), Announcements (`/announcements`) — all linking to the relevant page/section |
| Column 4 "Community" | Day Care Personnel, Barangay, Parents & Guardians, CSWD Office | Keep content but make these non-link text labels (they are informational, not navigable)                                                                                                           |
| Copyright line       | `© YEAR DCCMS · Barangay…`                                     | `© YEAR Barangay San Antonio de Padua I Day Care Center · Dasmariñas City, Cavite`                                                                                                                 |

---

## B. Home Page (`src/routes/index.tsx`)

### B1. Meta Tags

| Field         | Current                                                                               | New                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | `DCCMS — Day Care Center Management System`                                           | `Barangay San Antonio de Padua I Day Care Center`                                                                                                        |
| `description` | `A simple and reliable system for managing student records, attendance, and reports…` | `Welcome to the Day Care Center of Barangay San Antonio de Padua I, Dasmariñas City — nurturing early childhood education for our community's children.` |

### B2. Hero Section

**Current**:

- Headline: "Day Care Center Management System (DCCMS)"
- Subtitle: "Barangay San Antonio de Padua I"
- Description: "A simple and reliable system for managing student records, attendance, and reports."
- Button: "Login"

**Change to**:

- Headline: `Welcome to Barangay San Antonio de Padua I Day Care Center`
- Subtitle: `Dasmariñas City, Cavite`
- Description: `A safe, fun, and nurturing place dedicated to early childhood education and the holistic development of every child in our community.`
- Button: `Staff Login` (change label from "Login" to "Staff Login" for clarity; links to `/login`)

### B3. "About the System" Section → "About Our Day Care Center"

**Current**: Section titled "About the System" describing DCCMS as a digital replacement for
manual record-keeping.

**Change to**:

- Section title: `About Our Day Care Center`
- Body text: `The Day Care Center of Barangay San Antonio de Padua I provides quality early childhood education and care for children in our community. Our dedicated team creates a nurturing environment where children learn, play, and grow — building strong foundations for their future.`
- Keep the existing image (`about-class.jpg`) and layout.

### B4. "Features" Section → "Our Programs"

**Current**: Three feature cards — Student Records, Attendance Tracking, Reports — showcasing
DCCMS software capabilities.

**Change to**: Three program cards showcasing Day Care Center services:

| Card | Title                       | Description (add below title)                                                        |
| ---- | --------------------------- | ------------------------------------------------------------------------------------ |
| 1    | `Early Childhood Education` | `Age-appropriate learning activities that prepare children for primary school.`      |
| 2    | `Child Nutrition & Health`  | `Regular weight monitoring and health tracking to support every child's well-being.` |
| 3    | `Community Engagement`      | `Bringing parents, guardians, and the barangay together for our children's growth.`  |

- Keep the three-column card layout.
- The existing feature images (`feature-records.jpg`, `feature-attendance.jpg`,
  `feature-reports.jpg`) may be reused or replaced with more relevant images. The implementing
  agent should assess whether the current images still fit the new card topics. If not, generate
  new images that match.
- Add a short description paragraph under each card title (currently cards only have a title).

---

## C. About Us Page (`src/routes/about.tsx`)

### C1. Meta Tags

| Field         | Current                                                              | New                                                                                                                                                                   |
| ------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | `About Us — DCCMS`                                                   | `About Us — Barangay San Antonio de Padua I Day Care Center`                                                                                                          |
| `description` | `Learn about DCCMS — our mission, vision, approach, and commitment…` | `Learn about the Day Care Center of Barangay San Antonio de Padua I — our mission, vision, programs, and the people dedicated to nurturing our community's children.` |

### C2. Page Header

**Current**: "ABOUT US!" with a "Read More" button below.

**Change to**: `About Our Day Care Center` — remove the "Read More" button (it currently does
nothing and has no scroll target).

### C3. "Who We Are" Card

**Current**: Describes DCCMS as a service-learning project built by DLSU-D students.

**Change to**:

- Title: `Who We Are`
- Body: `The Day Care Center of Barangay San Antonio de Padua I is a community-supported early childhood education center serving the children and families of our barangay. We are committed to providing a safe, engaging, and developmentally appropriate environment where young learners can thrive.`
- Keep the existing image (`about-class.jpg`).

### C4. Mission & Vision Cards

**Current**: Mission and Vision statements describe the DCCMS software platform.

**Change to** (use the statements from the original spec — these are about the Day Care Center):

- **Mission**: `To provide a safe, nurturing, and stimulating educational environment that fosters the holistic development, well-being, and foundational learning of the children in our community.`
- **Vision**: `To be a leading community partner in early childhood education, ensuring that every child in Barangay San Antonio de Padua I is empowered, cared for, and prepared for lifelong learning.`

### C5. "What We Do" Card → "Our Programs"

**Current**: Lists DCCMS system capabilities (digitizing records, automating reports, offline
design).

**Change to**:

- Title: `Our Programs`
- List items:
  - `Early childhood education through age-appropriate learning activities`
  - `Child nutrition monitoring and regular weight tracking`
  - `Parent-teacher engagement through meetings and open communication`
  - `Health and wellness awareness for children and families`
  - `Preparation of children for entry into primary school`

### C6. "Our Approach" Card → "Our Values"

**Current**: Lists software design principles (Simplicity, Accessibility, Efficiency, Security).

**Change to**:

- Title: `Our Values`
- List items:
  - **Safety** — A secure and caring environment for every child
  - **Inclusivity** — Open to all children in our barangay
  - **Holistic Development** — Nurturing the mind, body, and heart
  - **Community Partnership** — Working hand-in-hand with parents and the barangay

### C7. "Our Commitment" Card

**Current**: Describes commitment to building a functional system.

**Change to**:

- Title: `Our Commitment`
- Body: `We are dedicated to the well-being and development of every child entrusted to our care. Through quality education, consistent health monitoring, and strong partnerships with parents and the community, we strive to give every child the best possible start in life.`

### C8. "Our Partners" Card → "Our Community"

**Current**: Lists project collaborators (DLSU-D students, Barangay Officials, CSWD).

**Change to**:

- Title: `Our Community`
- Intro: `The Day Care Center is supported by:`
- List items:
  - `Barangay San Antonio de Padua I Officials`
  - `Parents and Guardians`
  - `City Social Welfare and Development (CSWD) Office`
  - `Department of Social Welfare and Development (DSWD)`

### C9. Faculty / Personnel Section (NEW)

**Add a new card** after "Our Community":

- Title: `Meet Our Team`
- Body: `Our dedicated daycare personnel are the heart of the center.`
- Personnel entry:
  - **Name**: Ms. Cherry
  - **Role**: `[role placeholder]`
  - **Description**: `[description placeholder]`
- Design note: Display as a personnel card with a placeholder avatar/image. Structure the
  component so additional personnel can be added easily in the future.

### C10. "Contact Us" Card — REMOVE

**Current**: A contact card with email and phone placeholders.

**Change to**: Remove this card entirely. The Contact page (`/contact`) already serves this
purpose. Duplication is unnecessary.

---

## D. Announcements Page (`src/routes/announcements.tsx`)

### D1. Meta Tags

| Field         | Current                                                                             | New                                                               |
| ------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `title`       | `Announcements — DCCMS`                                                             | `Announcements — Barangay San Antonio de Padua I Day Care Center` |
| `description` | `Latest announcements from the Day Care Center of Barangay San Antonio de Padua I.` | Keep as-is (already center-focused).                              |

### D2. Page Header

**Current**: "Latest Announcements:" with a yellow card saying "Stay tuned for new news!" and an
empty decorative blob shape.

**Change to**:

- Headline: `Announcements`
- Yellow card: Keep as a pinned/featured notice area. Update text to: `Stay updated with the latest news, events, and health reminders from our Day Care Center.`
- Decorative blob: Replace with the announcement kid image (`announcement-kid.jpg`) inside the
  blob shape, or remove the blob and use the image directly.

### D3. Announcement Categories & Sample Data

The announcements system currently uses hardcoded sample data. This is acceptable for Phase 1.
The data structure and component are already designed to support swapping to an API in Phase 2.

**Announcement categories** (based on client requirements):

| Category Tag   | Purpose                                                     | Feasibility (Phase 1) |
| -------------- | ----------------------------------------------------------- | --------------------- |
| `Event`        | School events, parent-teacher meetings, barangay activities | ✅ Hardcoded samples  |
| `Holiday`      | Holiday notices, class suspensions                          | ✅ Hardcoded samples  |
| `Health Alert` | Child weight monitoring schedules, health reminders         | ✅ Hardcoded samples  |
| `Reminder`     | General reminders (enrollment, document submissions)        | ✅ Hardcoded samples  |

**Sample announcements** (replace current `SAMPLE` array):

```
1. Tag: "Health Alert"
   Date: "May 10, 2026"
   Title: "Child Weight Monitoring Schedule"
   Body: "Monthly weight check for all enrolled children will be conducted this week. Please ensure your child attends and bring their health booklet."

2. Tag: "Event"
   Date: "May 3, 2026"
   Title: "Parent-Teacher Meeting"
   Body: "You are invited to our quarterly parent-teacher meeting to discuss your child's progress and upcoming center activities. Light snacks will be provided."

3. Tag: "Holiday"
   Date: "April 28, 2026"
   Title: "No Classes — Labor Day"
   Body: "The Day Care Center will be closed on May 1 in observance of Labor Day. Regular classes resume the following day."

4. Tag: "Reminder"
   Date: "April 20, 2026"
   Title: "Enrollment Reminder for SY 2026–2027"
   Body: "Enrollment for the upcoming school year is now open. Please visit the Day Care Center or contact us for requirements and schedules."
```

> **Phase 2 Note**: Real-time announcement feeds will require a backend API or CMS integration.
> The current component structure (array-driven rendering with loading/error/empty states)
> already supports this transition. No structural changes needed — only the data source will
> change.

---

## E. Contact Page (`src/routes/contact.tsx`)

### E1. Meta Tags

| Field         | Current                              | New                                                            |
| ------------- | ------------------------------------ | -------------------------------------------------------------- |
| `title`       | `Contact Us — DCCMS`                 | `Contact Us — Barangay San Antonio de Padua I Day Care Center` |
| `description` | Keep as-is (already center-focused). | Keep as-is.                                                    |

### E2. Page Header

**Current**: "Contact Us" with subtitle "We'd love to hear from parents, guardians, and the
community."

**Change to**: Keep as-is. This is already appropriate.

### E3. Contact Cards

**Current content is acceptable.** Keep the existing card layout with:

- Address (confirmed): `Day Care Center, Barangay San Antonio de Padua I, Dasmariñas City, Cavite, Philippines`
- Phone: `[contact number placeholder]`
- Email: `[email placeholder]`
- Office Hours: `[office hours placeholder]`
- Messenger: `Open Messenger (placeholder)` button
- Google Maps: `[Google Maps embed placeholder]`

No content changes needed on this page — only the meta title update.

---

## F. Login Page (`src/routes/login.tsx`)

### F1. Meta Tags

| Field         | Current                                                  | New                                                                              |
| ------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `title`       | `Staff Login — DCCMS`                                    | `Staff Login — Barangay San Antonio de Padua I Day Care Center`                  |
| `description` | `Staff login for the Day Care Center Management System.` | `Staff login portal for the Day Care Center of Barangay San Antonio de Padua I.` |

### F2. Login Card Header

**Current**:

- Title: "Staff Login"
- Subtitle: "DCCMS — for authorized day care personnel only"

**Change to**:

- Title: `Staff Login`
- Subtitle: `Barangay San Antonio de Padua I Day Care Center — for authorized personnel only`

### F3. Security Disclaimer

**Current**: "Authorized use only. Do not share your credentials. All activity may be logged."

**Change to**: Keep as-is. This is already appropriate.

### F4. Everything Else

Keep the form fields, password toggle, online/offline toggle, demo validation, error/success
messages, and "Back to Home" link as-is. These are functional elements, not content that needs
revision.

---

## G. Summary of Files to Modify

| File                           | Type of Change                                                       |
| ------------------------------ | -------------------------------------------------------------------- |
| `src/components/Navbar.tsx`    | Update branding text and aria-label                                  |
| `src/components/Footer.tsx`    | Restructure columns, update copyright line                           |
| `src/routes/index.tsx`         | Update meta, hero, about section, features → programs                |
| `src/routes/about.tsx`         | Rewrite all card content, add personnel section, remove contact card |
| `src/routes/announcements.tsx` | Update meta, header text, sample data, add 4th announcement          |
| `src/routes/contact.tsx`       | Update meta title only                                               |
| `src/routes/login.tsx`         | Update meta tags and subtitle text                                   |

---

## H. Website User Flow

The flow ensures a clear separation between public viewing of the Day Care Center's information
and private administrative tasks for authorized personnel.

1. **Entry**: The user arrives at the Home Page.
2. **Information Phase**: The user (likely a parent or guardian) navigates to About Us,
   Announcements, or Contact to learn about the center and check for updates.
3. **Authentication Phase**: A staff member clicks the "Staff Login" button.
4. **Verification**: The system validates the entered credentials.
5. **Success**: The authorized staff member gains access to the private management system.

---

## I. Content Placeholders Inventory

The following items remain as visible placeholders until the client provides verified values:

| Item                     | Location(s)          | Placeholder Text                  |
| ------------------------ | -------------------- | --------------------------------- |
| Phone number             | Contact page, Footer | `[contact number placeholder]`    |
| Email address            | Contact page         | `[email placeholder]`             |
| Office hours             | Contact page         | `[office hours placeholder]`      |
| Messenger URL            | Contact page         | `Open Messenger (placeholder)`    |
| Google Maps embed        | Contact page         | `[Google Maps embed placeholder]` |
| Ms. Cherry's role        | About page           | `[role placeholder]`              |
| Ms. Cherry's description | About page           | `[description placeholder]`       |
| Social media URLs        | Footer               | `#` (non-functional)              |
