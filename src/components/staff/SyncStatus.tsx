/**
 * SyncStatus — compact plain-language connection and sync state indicator.
 *
 * Reads the `SyncStatus` union from the contracts. The parent (StaffLayout)
 * passes the current status; this component is purely presentational.
 *
 * Visual language:
 *  - Pill badge with an icon, a short phrase, and an optional subtitle.
 *  - Color encodes severity: green → synced, amber → pending/offline,
 *    blue → syncing, red → failed/reauth.
 *  - Animations are gated behind prefers-reduced-motion.
 */

import { useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  CloudOff,
  HardDrive,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";

import type { SyncStatus as SyncStatusType } from "@/features/staff/contracts/sync";

interface Props {
  status: SyncStatusType;
  /** Optional: ISO timestamp of last successful sync. */
  lastSyncedAt?: string | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Status configuration table
// ---------------------------------------------------------------------------

type StatusConfig = {
  label: string;
  sublabel?: string;
  Icon: React.ElementType;
  /** Tailwind classes for the pill */
  pillClass: string;
  /** Tailwind classes for the icon */
  iconClass: string;
  /** Whether to spin the icon */
  spin?: boolean;
};

const STATUS_CONFIG: Record<SyncStatusType, StatusConfig> = {
  offline: {
    label: "You're offline",
    sublabel: "Changes saved locally",
    Icon: WifiOff,
    pillClass: "bg-amber-50 border border-amber-200 text-amber-800",
    iconClass: "text-amber-500",
  },
  saved_locally: {
    label: "Saved locally",
    sublabel: "Will sync when online",
    Icon: HardDrive,
    pillClass: "bg-sky-50 border border-sky-200 text-sky-800",
    iconClass: "text-sky-500",
  },
  syncing: {
    label: "Syncing…",
    Icon: RefreshCcw,
    pillClass: "bg-brand/10 border border-brand/30 text-brand-dark",
    iconClass: "text-brand",
    spin: true,
  },
  synced: {
    label: "All changes synced",
    Icon: CheckCircle2,
    pillClass: "bg-emerald-50 border border-emerald-200 text-emerald-800",
    iconClass: "text-emerald-500",
  },
  sync_failed: {
    label: "Sync failed",
    sublabel: "Tap to retry",
    Icon: CloudOff,
    pillClass: "bg-red-50 border border-red-200 text-red-800",
    iconClass: "text-red-500",
  },
  reauth_required: {
    label: "Please log in again",
    sublabel: "Session expired",
    Icon: ShieldAlert,
    pillClass: "bg-red-50 border border-red-200 text-red-800",
    iconClass: "text-red-500",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SyncStatus({ status, lastSyncedAt, className }: Props) {
  const shouldReduce = useReducedMotion();
  const config = STATUS_CONFIG[status];
  const Icon = config.Icon;

  // Format lastSyncedAt for synced state
  const syncedLabel = (() => {
    if (status !== "synced" || !lastSyncedAt) return config.sublabel;
    try {
      const d = new Date(lastSyncedAt);
      return `Last synced ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return undefined;
    }
  })();

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold select-none ${config.pillClass} ${className ?? ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Sync status: ${config.label}`}
    >
      {/* Online/offline ambient dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
            status === "synced"
              ? "bg-emerald-400"
              : status === "syncing"
                ? "bg-brand"
                : "bg-amber-400"
          } ${!shouldReduce && status === "syncing" ? "animate-ping" : ""}`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            status === "synced"
              ? "bg-emerald-500"
              : status === "syncing"
                ? "bg-brand"
                : "bg-amber-500"
          }`}
        />
      </span>

      <Icon
        size={13}
        className={`shrink-0 ${config.iconClass} ${config.spin && !shouldReduce ? "animate-spin" : ""}`}
        aria-hidden="true"
      />

      <span className="leading-none">{config.label}</span>

      {syncedLabel && (
        <span className="hidden sm:inline text-[10px] opacity-70 leading-none">{syncedLabel}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live status pill that auto-detects online/offline from the browser
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";

/**
 * A self-contained version that listens to `navigator.onLine` and exposes the
 * derived status. Useful for the StaffLayout header when no real sync client
 * is wired yet.
 */
export function LiveSyncStatus({
  pendingCount = 0,
  isSyncing = false,
  lastSyncedAt,
  syncFailed = false,
  reauthRequired = false,
  className,
}: {
  pendingCount?: number;
  isSyncing?: boolean;
  lastSyncedAt?: string | null;
  syncFailed?: boolean;
  reauthRequired?: boolean;
  className?: string;
}) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const status: SyncStatusType = (() => {
    if (reauthRequired) return "reauth_required";
    if (syncFailed) return "sync_failed";
    if (!isOnline) return "offline";
    if (isSyncing) return "syncing";
    if (pendingCount > 0) return "saved_locally";
    return "synced";
  })();

  return <SyncStatus status={status} lastSyncedAt={lastSyncedAt} className={className} />;
}
