# ARCHITECTURE.md — Folder Structure & System Architecture

**Project:** DCCMS Public Static Website  
**Stack:** React + TypeScript + Tailwind CSS + React Router v6 + Vite  
**Last Updated:** 2026-05-04

---

## 1. System Layers Overview

DCCMS is split into two independent applications. This repo covers **Layer 1 only**.

```
┌─────────────────────────────────────────────┐
│           Layer 1 — Public Static Site      │  ← THIS REPO
│   React + TypeScript + Tailwind + Vite          │
│   Routes: /, /about, /announcements,        │
│            /contact, /login                 │
└──────────────────────┬──────────────────────┘
                       │ Login success
                       │ redirect
┌──────────────────────▼──────────────────────┐
│        Layer 2 — Private Management PWA     │  ← SEPARATE REPO
│   React + Tailwind + Supabase               │
│   Handles: student records, attendance,     │
│            reports, offline sync            │
└─────────────────────────────────────────────┘
```

The public site and the PWA are **fully decoupled**. The only connection is a redirect on successful login.

---

## 2. Folder Structure

```
dccms-public/
│
├── public/                     # Static assets served as-is
│   ├── favicon.ico
│   └── barangay-seal.png       # Official seal (used in Navbar + Login)
│
├── src/
│   │
│   ├── components/             # All reusable UI pieces
│   │   ├── layout/             # Structural wrappers — used on every page
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── PublicLayout.tsx    # Wraps Navbar + children + Footer
│   │   │   └── CloudDivider.tsx   # SVG section transition element
│   │   │
│   │   ├── ui/                 # Atomic, reusable building blocks
│   │   │   ├── Button.tsx
│   │   │   ├── SectionHeading.tsx
│   │   │   ├── FeatureCard.tsx
│   │   │   ├── AnnouncementCard.tsx
│   │   │   ├── InfoBlock.tsx
│   │   │   ├── BulletFeature.tsx
│   │   │   ├── ConnectivityBadge.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── Skeleton.tsx
│   │   │
│   │   └── sections/           # Page-specific sections (not reused across pages)
│   │       ├── HeroBanner.tsx
│   │       ├── ProgramsSection.tsx
│   │       ├── AboutSummarySection.tsx
│   │       └── FacultyCard.tsx
│   │
│   ├── pages/                  # One file per route — thin orchestration only
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── Announcements.tsx
│   │   ├── Contact.tsx
│   │   ├── Login.tsx
│   │   └── NotFound.tsx
│   │
│   ├── hooks/                  # Custom hooks reused across 2+ components
│   │   ├── useOnlineStatus.ts  # Wraps navigator.onLine + event listeners
│   │   └── useAnnouncements.ts # Fetches and caches announcement data
│   │
│   ├── services/               # External API calls — isolated from components
│   │   ├── auth.ts             # Login API call + token handoff
│   │   └── announcements.ts    # Fetch announcements from backend/CMS
│   │
│   ├── constants/              # Static data and config values
│   │   ├── navigation.ts       # Nav link definitions (label, href)
│   │   └── content.ts          # Any hardcoded strings not from API
│   │
│   ├── assets/                 # Imported assets (processed by Vite)
│   │   └── images/
│   │       ├── hero-daycare.jpg
│   │       ├── children-learning.jpg
│   │       └── [other optimized JPGs ≤ 150KB]
│   │
│   ├── styles/
│   │   └── index.css           # Tailwind directives + Google Fonts import only
│   │
│   ├── vite-env.d.ts           # Vite client type declarations
│   ├── App.tsx                 # Route definitions only — no UI logic here
│   └── main.tsx                # React DOM render entry point
│
├── docs/                       # All project documentation
│   ├── design.md
│   ├── PROJECT.md
│   ├── CONTENT.md
│   ├── FLOW.md
│   └── WIREFRAME-SPEC.md
│
├── CLAUDE.md                   # AI instructions (root level — Claude Code reads here)
├── README.md                   # Project overview and getting started
├── CONTRIBUTING.md             # Git workflow
├── ARCHITECTURE.md             # This file
├── STANDARDS.md                # Coding standards
├── ENVIRONMENT.md              # Environment variables guide
├── .env.example                # Safe-to-commit env template
├── .env.local                  # Local secrets — gitignored
├── .gitignore
├── .prettierrc                 # Prettier formatting config
├── .vscode/                    # VS Code workspace settings
│   ├── extensions.json
│   └── settings.json
├── index.html
├── postcss.config.js           # Required by Tailwind CSS v3
├── tsconfig.json               # TypeScript project config
├── tsconfig.node.json          # TypeScript config for Vite/Node
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## 3. Module Boundaries

These rules define what each layer is allowed to do. Violating these creates coupling that is hard to undo.

### `pages/`
- **Allowed:** Import from `components/`, `hooks/`, `services/`, `constants/`
- **Not allowed:** Direct API calls (use `services/`), business logic, local state beyond UI toggles
- **Rule:** Pages are orchestrators. They compose sections and pass data down. They should rarely exceed 60 lines.

### `components/layout/`
- **Allowed:** Import from `components/ui/`, `hooks/`, `constants/`
- **Not allowed:** Page-specific logic, API calls, props specific to one page

### `components/ui/`
- **Allowed:** Props, Tailwind classes, simple derived display logic
- **Not allowed:** API calls, hooks (except `useState`/`useEffect` for internal UI state), imports from `pages/` or `sections/`
- **Rule:** UI components are dumb and reusable. They receive data via props and render it.

### `components/sections/`
- **Allowed:** Import from `components/ui/`, `constants/`
- **Not allowed:** API calls, hooks (except display state), direct `services/` imports
- **Rule:** Sections are medium-grain compositions specific to one page. They can be smart about layout but not about data fetching.

### `hooks/`
- **Allowed:** `useState`, `useEffect`, `useRef`, imports from `services/` and `constants/`
- **Not allowed:** JSX, component rendering, direct DOM manipulation outside refs
- **Rule:** Hooks extracted here must be used in 2+ places. Single-use logic stays in the component.

### `services/`
- **Allowed:** `fetch`, API calls, token handling, response parsing
- **Not allowed:** React imports, JSX, state management, DOM access
- **Rule:** Pure async functions only. No side effects beyond the API call itself.

---

## 4. Routing Architecture

```tsx
// App.tsx — route definitions only
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/Home';
import About from './pages/About';
import Announcements from './pages/Announcements';
import Contact from './pages/Contact';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages — wrapped in shared Navbar + Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/"              element={<Home />} />
          <Route path="/about"         element={<About />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/contact"       element={<Contact />} />
        </Route>

        {/* Login — full screen, no shared layout */}
        <Route path="/login" element={<Login />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

```tsx
// PublicLayout.tsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
```

---

## 5. Data Flow Patterns

### Static Content (copy, nav labels, feature cards)
Defined in `src/constants/` → imported directly into components. No API needed.

```
constants/content.ts → sections/ProgramsSection.tsx → renders cards
```

### Announcements (dynamic content)
Fetched via `services/announcements.ts` → managed by `hooks/useAnnouncements.ts` → consumed by `pages/Announcements.tsx`.

```
services/announcements.ts
        ↓
hooks/useAnnouncements.ts  (handles loading, error, empty states)
        ↓
pages/Announcements.tsx    (passes data to AnnouncementCard components)
```

### Authentication
Handled entirely in `pages/Login.tsx` + `services/auth.ts`. No global auth state needed on the public site — login is a one-way handoff to the PWA.

```
pages/Login.tsx
  → calls services/auth.ts on submit
  → on success: window.location.href = PWA_URL (env variable)
  → on failure: sets local error state → displays error message
```

---

## 6. Key Architectural Decisions

### Why no state management library (Redux/Zustand)?
The public site has minimal shared state. `useState` at the page level and a single `useOnlineStatus` hook covers everything needed. Adding a state library would be over-engineering for this scope.

### Why no CSS Modules or styled-components?
Tailwind CSS with utility classes keeps styles co-located with markup and eliminates context switching. Given the team size and timeline, this is the pragmatic choice.

### Why Vite over CRA?
Vite's dev server is significantly faster and the bundle output is leaner — important for the performance budget (see `WIREFRAME-SPEC.md` §7).

### Why static site + separate PWA?
Keeps the public information layer simple, fast, and independently deployable. The PWA has different uptime, auth, and offline requirements that would complicate a monorepo architecture unnecessarily.
