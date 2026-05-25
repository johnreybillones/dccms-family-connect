/**
 * src/routes/staff/students/$profileId.tsx — Student detail view (/staff/students/:profileId)
 *
 * Read-only view of a single EnrollmentProfile.
 * "Edit" is shown as an explicit action — tapping it navigates to the edit route.
 * No delete or archive actions are exposed in v1.
 *
 * Shows "Awaiting sync" badge when recordNumber is null.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProfile } from "@/features/staff/client/profile-repository";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/staff/students/$profileId")({
  head: () => ({
    meta: [
      { title: "Student Detail — DCC Staff" },
      { name: "description", content: "View enrollment profile for a student." },
    ],
  }),
  component: StudentDetailPage,
});

// ---------------------------------------------------------------------------
// Field row
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground leading-snug">
        {value?.trim() || <span className="text-muted-foreground italic">—</span>}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section card
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  children,
  accent = "sky",
}: {
  title: string;
  children: React.ReactNode;
  accent?: "sky" | "emerald" | "violet";
}) {
  const accentClasses = {
    sky: "from-sky/20 to-sky/5 border-sky/30",
    emerald: "from-emerald-50 to-emerald-50/30 border-emerald-200/60",
    violet: "from-violet-50 to-violet-50/30 border-violet-200/60",
  };

  return (
    <div className={`rounded-3xl border bg-gradient-to-br ${accentClasses[accent]} p-5 space-y-4`}>
      <h2 className="font-display text-sm font-bold text-foreground/80">{title}</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</dl>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function StudentDetailPage() {
  const { profileId } = Route.useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EnrollmentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfile(profileId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this record.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const fullName = profile
    ? [profile.childFirstName, profile.childMiddleName, profile.childLastName, profile.childSuffix]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          id="back-from-detail"
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/staff/students" })}
          className="rounded-2xl shrink-0"
          aria-label="Back to student records"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Button>

        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold text-foreground leading-tight truncate">
            {isLoading ? "Loading…" : fullName || "Student Record"}
          </h1>
          {profile && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {profile.recordNumber ? (
                <span className="inline-flex items-center rounded-full bg-sky/40 px-2.5 py-0.5 text-[11px] font-bold text-brand-dark font-mono">
                  {profile.recordNumber}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                  <Clock size={10} aria-hidden="true" />
                  Awaiting sync
                </span>
              )}
            </div>
          )}
        </div>

        {profile && (
          <Button
            id="edit-student-record"
            onClick={() =>
              navigate({
                to: "/staff/students/$profileId/edit",
                params: { profileId },
              })
            }
            size="sm"
            className="rounded-2xl bg-brand hover:bg-brand/90 gap-1.5 shrink-0"
          >
            <Pencil size={14} aria-hidden="true" />
            Edit
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Profile not found */}
      {!isLoading && !error && !profile && (
        <div className="rounded-3xl border border-border bg-muted/30 p-8 text-center">
          <p className="text-muted-foreground text-sm">This student record could not be found.</p>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/staff/students" })}
            className="mt-4 rounded-2xl"
          >
            Back to list
          </Button>
        </div>
      )}

      {/* Detail sections */}
      {profile && (
        <div className="space-y-4">
          {/* Child info */}
          <SectionCard title="Child Information" accent="sky">
            <DetailRow label="First Name" value={profile.childFirstName} />
            <DetailRow label="Last Name" value={profile.childLastName} />
            <DetailRow label="Middle Name" value={profile.childMiddleName} />
            <DetailRow label="Suffix" value={profile.childSuffix} />
            <DetailRow label="Birth Date" value={profile.birthDate} />
            <DetailRow label="Sex" value={profile.sex} />
            <DetailRow label="Address" value={profile.address} />
          </SectionCard>

          {/* Guardian info */}
          <SectionCard title="Guardian Information" accent="emerald">
            <DetailRow label="Full Name" value={profile.guardianFullName} />
            <DetailRow label="Relationship" value={profile.guardianRelationship} />
            <DetailRow label="Contact Number" value={profile.guardianContactNumber} />
          </SectionCard>

          {/* Enrollment details */}
          <SectionCard title="Enrollment Details" accent="violet">
            <DetailRow label="School Year" value={profile.schoolYear} />
            <DetailRow label="Enrollment Date" value={profile.enrollmentDate} />
            <DetailRow label="Record Number" value={profile.recordNumber ?? "Awaiting sync"} />
            <DetailRow label="Revision" value={String(profile.revision)} />
          </SectionCard>

          {/* Metadata footer */}
          <p className="text-[11px] text-muted-foreground/60 text-right px-1">
            Created {new Date(profile.createdAt).toLocaleString()} · Updated{" "}
            {new Date(profile.updatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
