/**
 * src/components/staff/PossibleDuplicateNotice.tsx
 *
 * A gentle, accessible warning card shown when the name + birth date
 * the user is entering already matches an existing local profile.
 *
 * Design language: soft amber/orange with a rounded, friendly layout —
 * never alarming, just cautiously helpful.
 */

import { AlertTriangle } from "lucide-react";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PossibleDuplicateNoticeProps = {
  /** Matched profiles to display in the warning. */
  matches: EnrollmentProfile[];
  /** Optional extra className on the outer element. */
  className?: string;
};

// ---------------------------------------------------------------------------
// Helper: format a profile's display name
// ---------------------------------------------------------------------------

function displayName(p: EnrollmentProfile): string {
  const parts = [p.childFirstName, p.childMiddleName, p.childLastName, p.childSuffix].filter(
    Boolean,
  );
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PossibleDuplicateNotice({ matches, className = "" }: PossibleDuplicateNoticeProps) {
  if (matches.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-label="Possible duplicate warning"
      className={[
        "flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Icon */}
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100"
        aria-hidden="true"
      >
        <AlertTriangle size={15} className="text-amber-600" />
      </span>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-800 leading-snug">
          {matches.length === 1
            ? "A child with this name and birth date may already be enrolled."
            : `${matches.length} children with similar names and birth dates were found.`}
        </p>

        <ul className="mt-2 space-y-1.5">
          {matches.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-1.5 text-amber-700">
              {/* Record number badge */}
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 font-mono">
                {p.recordNumber ?? "Awaiting sync"}
              </span>
              <span className="text-xs font-medium truncate">{displayName(p)}</span>
              <span className="text-[11px] text-amber-500">· born {p.birthDate}</span>
            </li>
          ))}
        </ul>

        <p className="mt-2 text-[12px] text-amber-600 leading-snug">
          Please verify before saving to avoid duplicate records. You can still save if this is a
          different child.
        </p>
      </div>
    </div>
  );
}
