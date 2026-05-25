/**
 * src/components/staff/StudentRecordList.tsx
 *
 * Searchable, filterable list of EnrollmentProfile records.
 *
 * Features:
 *   - One-box search: filters by child full name or record number
 *   - "Awaiting sync" badge (soft amber/orange) for records with null recordNumber
 *   - Stagger entrance animation (prefers-reduced-motion safe)
 *   - Empty state guidance
 *   - "Add student record" primary action
 */

import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, UserPlus, BookOpen, Clock } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { filterProfiles } from "@/features/staff/client/profile-repository";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";

// ---------------------------------------------------------------------------
// Awaiting-sync badge
// ---------------------------------------------------------------------------

function AwaitingSyncBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200"
      aria-label="Record not yet synced to server"
    >
      <Clock size={10} aria-hidden="true" />
      Awaiting sync
    </span>
  );
}

// ---------------------------------------------------------------------------
// Record number badge
// ---------------------------------------------------------------------------

function RecordNumberBadge({ recordNumber }: { recordNumber: string | null }) {
  if (!recordNumber) return <AwaitingSyncBadge />;
  return (
    <span className="inline-flex items-center rounded-full bg-sky/40 px-2.5 py-0.5 text-[11px] font-bold text-brand-dark font-mono">
      {recordNumber}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Single profile row card
// ---------------------------------------------------------------------------

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

function ProfileCard({ profile }: { profile: EnrollmentProfile }) {
  const navigate = useNavigate();

  const fullName = [
    profile.childFirstName,
    profile.childMiddleName,
    profile.childLastName,
    profile.childSuffix,
  ]
    .filter(Boolean)
    .join(" ");

  const ageYears = (() => {
    const birth = new Date(profile.birthDate);
    const now = new Date();
    const diff = now.getFullYear() - birth.getFullYear();
    const hadBirthday =
      now.getMonth() > birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    return hadBirthday ? diff : diff - 1;
  })();

  return (
    <motion.button
      layout
      variants={cardVariants}
      type="button"
      onClick={() =>
        navigate({ to: "/staff/students/$profileId", params: { profileId: profile.id } })
      }
      className={cn(
        "group w-full text-left rounded-3xl border border-border bg-white/80 px-4 py-4",
        "hover:border-brand/40 hover:bg-sky/10 hover:shadow-md",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
        "flex items-center gap-4",
      )}
      aria-label={`View record for ${fullName}`}
    >
      {/* Avatar initials */}
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky/60 to-brand/30 text-brand-dark font-display font-bold text-sm shadow-sm"
        aria-hidden="true"
      >
        {profile.childFirstName.charAt(0).toUpperCase()}
        {profile.childLastName.charAt(0).toUpperCase()}
      </span>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display font-bold text-sm text-foreground leading-snug">
            {fullName}
          </span>
          <RecordNumberBadge recordNumber={profile.recordNumber} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {profile.sex} · {ageYears} yrs · SY {profile.schoolYear}
        </p>
      </div>

      {/* Chevron hint */}
      <span
        className="text-muted-foreground/30 group-hover:text-brand/50 transition-colors"
        aria-hidden="true"
      >
        ›
      </span>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky/30">
        <BookOpen size={28} className="text-brand" aria-hidden="true" />
      </span>

      {hasQuery ? (
        <>
          <p className="font-display font-bold text-foreground/80">No matching records found</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Try a different name or record number.
          </p>
        </>
      ) : (
        <>
          <p className="font-display font-bold text-foreground/80">No students enrolled yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Add the first student record to get started.
          </p>
          <Button
            onClick={() => navigate({ to: "/staff/students/new" })}
            className="mt-2 rounded-2xl bg-brand hover:bg-brand/90 gap-2"
            id="empty-state-add-student"
          >
            <UserPlus size={16} aria-hidden="true" />
            Add Student Record
          </Button>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export type StudentRecordListProps = {
  /** Profiles to display; caller is responsible for loading. */
  profiles: EnrollmentProfile[];
  /** Whether the initial data load is still in progress. */
  isLoading?: boolean;
};

export function StudentRecordList({ profiles, isLoading = false }: StudentRecordListProps) {
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  const [query, setQuery] = useState("");

  const filtered = filterProfiles(profiles, query);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  // Count how many are unsynced
  const unsyncedCount = profiles.filter((p) => p.recordNumber === null).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            aria-hidden="true"
          />
          <Input
            id="student-search"
            type="search"
            placeholder="Search by name or record number…"
            value={query}
            onChange={handleQueryChange}
            className="h-11 rounded-2xl border-2 pl-9 bg-white text-sm font-medium focus-visible:ring-brand/50 focus-visible:border-brand border-input hover:border-brand/30 transition-all"
            aria-label="Search students"
          />
        </div>

        {/* Add button */}
        <Button
          id="add-student-record"
          onClick={() => navigate({ to: "/staff/students/new" })}
          className="h-11 rounded-2xl bg-brand hover:bg-brand/90 gap-2 whitespace-nowrap shrink-0"
        >
          <UserPlus size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Add student</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Pending-sync summary pill */}
      {unsyncedCount > 0 && !query && (
        <div
          className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-700 font-medium"
          aria-live="polite"
        >
          <Clock size={13} className="text-amber-500 shrink-0" aria-hidden="true" />
          {unsyncedCount === 1
            ? "1 record is awaiting sync to the server."
            : `${unsyncedCount} records are awaiting sync to the server.`}
        </div>
      )}

      {/* Count info */}
      {!isLoading && profiles.length > 0 && (
        <p className="text-xs text-muted-foreground px-1" aria-live="polite" aria-atomic="true">
          {query ? (
            <>
              Showing <strong>{filtered.length}</strong> of {profiles.length} students
            </>
          ) : (
            <>
              <strong>{profiles.length}</strong>{" "}
              {profiles.length === 1 ? "student enrolled" : "students enrolled"}
            </>
          )}
        </p>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading student records">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-3xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      )}

      {/* List */}
      {!isLoading && filtered.length === 0 && <EmptyState hasQuery={query.length > 0} />}

      {!isLoading && filtered.length > 0 && (
        <div role="list" aria-label="Student records">
          {shouldReduce ? (
            <div className="space-y-2.5">
              {filtered.map((p) => (
                <div key={p.id} role="listitem">
                  <ProfileCard profile={p} />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="space-y-2.5"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.06 } },
              }}
            >
              <AnimatePresence>
                {filtered.map((p) => (
                  <motion.div key={p.id} role="listitem" layout variants={cardVariants}>
                    <ProfileCard profile={p} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
