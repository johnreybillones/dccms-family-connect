/**
 * StaffLayout — protected shell for all `/staff/*` routes.
 *
 * Provides:
 *  - Top app bar with branding, connection status, and sign-out
 *  - Bottom navigation (mobile-primary) + left sidebar (desktop)
 *  - Role-aware nav: administrator sees extra controls; deferred pages labeled
 *    "Not available yet" and rendered as inert anchors
 *  - Framer Motion page transition that respects prefers-reduced-motion
 *
 * Usage:
 *   Wrap the <Outlet /> inside src/routes/staff.tsx with this component.
 */

import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  CalendarCheck2,
  FileBarChart2,
  Home,
  LogOut,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useCallback } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";

import seal from "@/assets/seal-logo.png";
import { logout } from "@/features/staff/client/auth-client";
import { clearSession, useSession } from "@/features/staff/client/session-store";
import { LiveSyncStatus } from "@/components/staff/SyncStatus";

// ---------------------------------------------------------------------------
// Navigation configuration
// ---------------------------------------------------------------------------

type NavEntry =
  | { kind: "link"; label: string; to: string; Icon: React.ElementType; adminOnly?: boolean }
  | { kind: "deferred"; label: string; Icon: React.ElementType };

const NAV_ENTRIES: NavEntry[] = [
  { kind: "link", label: "Home", to: "/staff", Icon: Home },
  { kind: "link", label: "Student Records", to: "/staff/students", Icon: BookOpen },
  { kind: "link", label: "Attendance", to: "/staff/attendance", Icon: CalendarCheck2 },
  { kind: "link", label: "Reports", to: "/staff/reports", Icon: FileBarChart2 },
];

const ADMIN_NAV_ENTRIES: NavEntry[] = [
  { kind: "link", label: "Manage Users", to: "/staff/admin/users", Icon: UserCog, adminOnly: true },
  {
    kind: "link",
    label: "Audit Log",
    to: "/staff/admin/audit",
    Icon: ShieldCheck,
    adminOnly: true,
  },
];

const DEFERRED_ENTRIES: NavEntry[] = [
  { kind: "deferred", label: "Activities", Icon: Settings },
  { kind: "deferred", label: "Notifications", Icon: Settings },
];

// ---------------------------------------------------------------------------
// Page transition variants
// ---------------------------------------------------------------------------

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15, ease: "easeIn" } },
};

// ---------------------------------------------------------------------------
// NavItem — shared by sidebar and bottom bar
// ---------------------------------------------------------------------------

function NavItem({
  entry,
  currentPath,
  compact = false,
}: {
  entry: NavEntry;
  currentPath: string;
  compact?: boolean;
}) {
  if (entry.kind === "deferred") {
    const Icon = entry.Icon;
    return (
      <span
        className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl opacity-40 cursor-not-allowed select-none ${compact ? "text-xs" : "text-sm"}`}
        aria-disabled="true"
        title="Not available yet"
      >
        <Icon size={compact ? 20 : 18} aria-hidden="true" />
        <span className="leading-tight text-[10px] font-semibold text-center">
          {entry.label}
          <br />
          <span className="text-[9px] italic">Soon</span>
        </span>
      </span>
    );
  }

  const isActive =
    entry.to === "/staff"
      ? currentPath === "/staff" || currentPath === "/staff/"
      : currentPath.startsWith(entry.to);

  const Icon = entry.Icon;

  return (
    <Link
      to={entry.to}
      className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
        compact ? "text-[10px]" : "text-xs"
      } ${
        isActive
          ? "bg-brand text-white shadow-md"
          : "text-foreground/60 hover:bg-sky/60 hover:text-brand"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon size={compact ? 20 : 18} aria-hidden="true" />
      <span className="leading-tight text-center">{entry.label}</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Sidebar (desktop ≥ lg)
// ---------------------------------------------------------------------------

function Sidebar({
  currentPath,
  isAdmin,
  onSignOut,
}: {
  currentPath: string;
  isAdmin: boolean;
  onSignOut: () => void;
}) {
  const user = useSession();

  return (
    <aside
      className="hidden lg:flex flex-col w-60 shrink-0 min-h-screen border-r border-border bg-card"
      aria-label="Staff navigation"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <img src={seal} alt="" className="h-9 w-9 rounded-full" width={36} height={36} />
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-brand-dark leading-tight truncate">
            Day Care Center
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight truncate">
            Brgy. San Antonio de Padua I
          </p>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV_ENTRIES.map((entry) => (
          <SidebarNavItem key={entry.label} entry={entry} currentPath={currentPath} />
        ))}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Administrator
              </p>
            </div>
            {ADMIN_NAV_ENTRIES.map((entry) => (
              <SidebarNavItem key={entry.label} entry={entry} currentPath={currentPath} />
            ))}
          </>
        )}

        <div className="pt-3 pb-1 px-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Coming Soon
          </p>
        </div>
        {DEFERRED_ENTRIES.map((entry) => (
          <SidebarNavItem key={entry.label} entry={entry} currentPath={currentPath} />
        ))}
      </nav>

      {/* Footer: user + sign out */}
      <div className="border-t border-border px-4 py-4 space-y-3">
        {user && (
          <div className="rounded-2xl bg-sky/30 px-3 py-2.5">
            <p className="text-xs font-bold text-foreground truncate">{user.displayName}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{user.role}</p>
          </div>
        )}
        <button
          id="staff-sign-out-sidebar"
          onClick={onSignOut}
          className="w-full flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-accent-red/80 hover:bg-accent-red/10 hover:text-accent-red transition-colors"
        >
          <LogOut size={16} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function SidebarNavItem({ entry, currentPath }: { entry: NavEntry; currentPath: string }) {
  if (entry.kind === "deferred") {
    const Icon = entry.Icon;
    return (
      <span
        className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm opacity-40 cursor-not-allowed select-none"
        aria-disabled="true"
      >
        <Icon size={17} aria-hidden="true" />
        <span className="flex-1 leading-tight">
          {entry.label}
          <span className="ml-1.5 text-[9px] italic bg-muted text-muted-foreground rounded px-1 py-0.5 align-middle">
            Soon
          </span>
        </span>
      </span>
    );
  }

  const isActive =
    entry.to === "/staff"
      ? currentPath === "/staff" || currentPath === "/staff/"
      : currentPath.startsWith(entry.to);
  const Icon = entry.Icon;

  return (
    <Link
      to={entry.to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
        isActive
          ? "bg-brand text-white shadow-sm"
          : "text-foreground/70 hover:bg-sky/40 hover:text-brand"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{entry.label}</span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Top bar (mobile header)
// ---------------------------------------------------------------------------

function TopBar({ onSignOut }: { onSignOut: () => void }) {
  const user = useSession();

  return (
    <header className="lg:hidden sticky top-0 z-40 flex items-center gap-3 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 shadow-sm">
      <img src={seal} alt="" className="h-8 w-8 rounded-full shrink-0" width={32} height={32} />
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm font-bold text-brand-dark leading-tight truncate">
          DCC Staff
        </p>
        {user && (
          <p className="text-[10px] text-muted-foreground truncate">
            {user.displayName} · <span className="capitalize">{user.role}</span>
          </p>
        )}
      </div>

      <LiveSyncStatus />

      <button
        id="staff-sign-out-topbar"
        onClick={onSignOut}
        className="ml-1 rounded-xl p-1.5 text-accent-red/70 hover:bg-accent-red/10 hover:text-accent-red transition-colors"
        aria-label="Sign out"
      >
        <LogOut size={18} aria-hidden="true" />
      </button>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Bottom navigation (mobile)
// ---------------------------------------------------------------------------

function BottomNav({ currentPath }: { currentPath: string }) {
  const primaryEntries = NAV_ENTRIES.slice(0, 4);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-end justify-around bg-card/95 backdrop-blur-sm border-t border-border pb-safe px-2 pt-2"
      aria-label="Bottom navigation"
    >
      {primaryEntries.map((entry) => (
        <NavItem key={entry.label} entry={entry} currentPath={currentPath} compact />
      ))}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function StaffLayout() {
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const user = useSession();
  const isAdmin = user?.role === "administrator";

  const handleSignOut = useCallback(async () => {
    await logout();
    clearSession();
    navigate({ to: "/login" });
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar currentPath={currentPath} isAdmin={isAdmin} onSignOut={handleSignOut} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <TopBar onSignOut={handleSignOut} />

        {/* Page content with entry animation */}
        <main className="flex-1 pb-20 lg:pb-0 overflow-y-auto" id="staff-main-content">
          {shouldReduce ? (
            <Outlet />
          ) : (
            <motion.div
              key={currentPath}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full"
            >
              <Outlet />
            </motion.div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav currentPath={currentPath} />
    </div>
  );
}
