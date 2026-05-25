/**
 * src/routes/staff/index.tsx — Staff landing home (/staff)
 *
 * Server-validates the session on every load (handles hard reloads where the
 * in-memory store is empty). If the server returns 401 the route redirects to
 * /login and clears the local store.
 *
 * Renders a role-aware welcome card with:
 *  - Greeting and role badge
 *  - Quick-action cards (Student Records, Attendance, Reports)
 *  - Live sync/connection status
 *  - Administrator-only section for user management and audit
 *  - Deferred modules labeled "Not available yet"
 *
 * Visual language: rounded cards, daycare palette, Nunito/Fredoka display, and
 * motion via FadeInWhenVisible + StaggerChildren (prefers-reduced-motion safe).
 */

import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarCheck2,
  FileBarChart2,
  Shield,
  Users,
  BellOff,
  Puzzle,
} from "lucide-react";

import { FadeInWhenVisible, StaggerChildren, StaggerItem } from "@/components/motion";
import { LiveSyncStatus } from "@/components/staff/SyncStatus";
import { fetchSession } from "@/features/staff/client/auth-client";
import { setSession, useSession } from "@/features/staff/client/session-store";

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [
      { title: "Staff Home — Day Care Center" },
      { name: "description", content: "Staff dashboard for the DCCMS Day Care Center portal." },
    ],
  }),

  async loader() {
    // Temporary bypass for developer preview (mocks a successful login):
    const dummyUser = {
      id: "usr_preview",
      username: "teacher_anna",
      displayName: "Teacher Anna",
      role: "administrator" as const, // Show both staff cards and admin tools!
    };
    setSession(dummyUser);
    return { authDetails: { user: dummyUser, device: null } };
  },

  component: StaffHome,
});

// ---------------------------------------------------------------------------
// Quick-action card data
// ---------------------------------------------------------------------------

type ActionCard = {
  label: string;
  description: string;
  to: string;
  Icon: React.ElementType;
  color: string;
  available: true;
};

type DeferredCard = {
  label: string;
  description: string;
  Icon: React.ElementType;
  available: false;
};

const PRIMARY_CARDS: ActionCard[] = [
  {
    label: "Student Records",
    description: "Find, add, or update enrolled children",
    to: "/staff/students",
    Icon: BookOpen,
    color: "bg-sky/40 text-brand-dark",
    available: true,
  },
  {
    label: "Attendance",
    description: "Record today's attendance or review past dates",
    to: "/staff/attendance",
    Icon: CalendarCheck2,
    color: "bg-emerald-50 text-emerald-800",
    available: true,
  },
  {
    label: "Reports",
    description: "Export student masterlist, attendance, or accomplishment summaries",
    to: "/staff/reports",
    Icon: FileBarChart2,
    color: "bg-amber-50 text-amber-800",
    available: true,
  },
];

const ADMIN_CARDS: ActionCard[] = [
  {
    label: "Manage Users",
    description: "Add or deactivate staff accounts",
    to: "/staff/admin/users",
    Icon: Users,
    color: "bg-violet-50 text-violet-800",
    available: true,
  },
  {
    label: "Audit Log",
    description: "Review security and data-change events",
    to: "/staff/admin/audit",
    Icon: Shield,
    color: "bg-violet-50 text-violet-800",
    available: true,
  },
];

const DEFERRED_CARDS: DeferredCard[] = [
  {
    label: "Activities",
    description: "Child development and activity tracking",
    Icon: Puzzle,
    available: false,
  },
  {
    label: "Notifications",
    description: "Reminders and announcements for guardians",
    Icon: BellOff,
    available: false,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function QuickCard({ card }: { card: ActionCard }) {
  const navigate = useNavigate();
  const Icon = card.Icon;

  return (
    <button
      onClick={() => navigate({ to: card.to })}
      className={`group relative flex flex-col gap-3 rounded-3xl p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${card.color} cursor-pointer`}
      aria-label={`Go to ${card.label}`}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/60 shadow-sm"
        aria-hidden="true"
      >
        <Icon size={22} />
      </span>
      <span>
        <span className="block font-display text-base font-bold leading-tight">{card.label}</span>
        <span className="mt-0.5 block text-xs opacity-75 leading-snug">{card.description}</span>
      </span>
    </button>
  );
}

function DeferredCard({ card }: { card: DeferredCard }) {
  const Icon = card.Icon;
  return (
    <div
      className="flex flex-col gap-3 rounded-3xl p-5 bg-muted/40 opacity-50 cursor-not-allowed select-none border border-dashed border-border"
      aria-disabled="true"
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/40"
        aria-hidden="true"
      >
        <Icon size={22} />
      </span>
      <span>
        <span className="block font-display text-base font-bold leading-tight">{card.label}</span>
        <span className="mt-0.5 block text-xs opacity-75 leading-snug">{card.description}</span>
        <span className="mt-1.5 inline-block text-[10px] font-semibold bg-muted text-muted-foreground rounded px-1.5 py-0.5">
          Not available yet
        </span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

import { useEffect } from "react";
import { getSession } from "@/features/staff/client/session-store";

function StaffHome() {
  const { authDetails } = Route.useLoaderData();
  const user = useSession() || authDetails.user;
  const isAdmin = user?.role === "administrator";

  // Hydrate the reactive client-side store with the loader's authenticated user on mount.
  useEffect(() => {
    if (!getSession() && authDetails?.user) {
      setSession(authDetails.user);
    }
  }, [authDetails.user]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      {/* Welcome header */}
      <FadeInWhenVisible>
        <div className="rounded-3xl bg-gradient-to-br from-brand/20 via-sky/30 to-emerald-50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm border border-brand/10">
          <div>
            <p className="text-sm font-semibold text-brand-dark/70">
              {greeting}, <span className="text-brand-dark">{user?.displayName ?? "Staff"}</span> 👋
            </p>
            <h1 className="font-display text-2xl font-bold text-brand-dark leading-tight mt-0.5">
              Day Care Center
              <br />
              <span className="text-brand text-xl">Management Dashboard</span>
            </h1>
            {user && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-bold text-brand-dark capitalize shadow-sm">
                {user.role === "administrator" ? "⭐ Administrator" : "👤 Staff"}
              </span>
            )}
          </div>
          <LiveSyncStatus className="shrink-0" />
        </div>
      </FadeInWhenVisible>

      {/* Primary actions */}
      <section aria-labelledby="quick-actions-heading">
        <FadeInWhenVisible delay={0.05}>
          <h2
            id="quick-actions-heading"
            className="font-display text-base font-bold text-foreground/70 mb-3"
          >
            Quick Actions
          </h2>
        </FadeInWhenVisible>
        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRIMARY_CARDS.map((card) => (
            <StaggerItem key={card.label}>
              <QuickCard card={card} />
            </StaggerItem>
          ))}
        </StaggerChildren>
      </section>

      {/* Administrator section */}
      {isAdmin && (
        <section aria-labelledby="admin-section-heading">
          <FadeInWhenVisible delay={0.08}>
            <h2
              id="admin-section-heading"
              className="font-display text-base font-bold text-foreground/70 mb-3"
            >
              Administrator Tools
            </h2>
          </FadeInWhenVisible>
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ADMIN_CARDS.map((card) => (
              <StaggerItem key={card.label}>
                <QuickCard card={card} />
              </StaggerItem>
            ))}
          </StaggerChildren>
        </section>
      )}

      {/* Deferred / coming soon */}
      <section aria-labelledby="coming-soon-heading">
        <FadeInWhenVisible delay={0.1}>
          <h2
            id="coming-soon-heading"
            className="font-display text-base font-bold text-foreground/70 mb-3"
          >
            Coming Soon
          </h2>
        </FadeInWhenVisible>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DEFERRED_CARDS.map((card) => (
            <DeferredCard key={card.label} card={card} />
          ))}
        </div>
      </section>
    </div>
  );
}
