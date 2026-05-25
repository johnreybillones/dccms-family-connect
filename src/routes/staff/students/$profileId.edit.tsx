/**
 * src/routes/staff/students/$profileId.edit.tsx — Edit student record
 *   Route: /staff/students/:profileId/edit
 *
 * Loads the existing profile, pre-populates the StudentRecordForm,
 * and on submit calls updateProfile() to save changes locally and
 * enqueue an updateProfile sync operation.
 *
 * The form excludes the profile's own ID from duplicate detection.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  StudentRecordForm,
  type StudentRecordFormValues,
} from "@/components/staff/StudentRecordForm";
import { getProfile, updateProfile } from "@/features/staff/client/profile-repository";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/staff/students/$profileId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Student — DCC Staff" },
      { name: "description", content: "Update enrollment profile for a student." },
    ],
  }),
  component: EditStudentPage,
});

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function EditStudentPage() {
  const { profileId } = Route.useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<EnrollmentProfile | null>(null);
  const [isLoadError, setIsLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfile(profileId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        if (!cancelled) setIsLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const handleSubmit = async (data: StudentRecordFormValues) => {
    if (!profile) return;
    setIsSubmitting(true);
    setSaveError(null);
    try {
      await updateProfile(profile.id, {
        childFirstName: data.childFirstName,
        childMiddleName: data.childMiddleName?.trim() || null,
        childLastName: data.childLastName,
        childSuffix: data.childSuffix?.trim() || null,
        birthDate: data.birthDate,
        sex: data.sex,
        address: data.address,
        guardianFullName: data.guardianFullName,
        guardianRelationship: data.guardianRelationship,
        guardianContactNumber: data.guardianContactNumber,
        schoolYear: data.schoolYear,
        enrollmentDate: data.enrollmentDate,
      });
      navigate({
        to: "/staff/students/$profileId",
        params: { profileId: profile.id },
        replace: true,
      });
    } catch (err) {
      setSaveError("Could not save changes. Please try again.");
      setIsSubmitting(false);
    }
  };

  const fullName = profile
    ? [profile.childFirstName, profile.childLastName].filter(Boolean).join(" ")
    : "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          id="back-from-edit"
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/staff/students/$profileId", params: { profileId } })}
          className="rounded-2xl shrink-0"
          aria-label="Back to student detail"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
            Edit Record
          </h1>
          {fullName && <p className="text-sm text-muted-foreground mt-0.5 truncate">{fullName}</p>}
        </div>
      </div>

      {/* Error loading */}
      {isLoadError && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          Could not load this record for editing.
        </div>
      )}

      {/* Loading skeleton */}
      {!profile && !isLoadError && <div className="h-96 rounded-3xl bg-muted/40 animate-pulse" />}

      {/* Edit form */}
      {profile && (
        <div className="rounded-3xl border border-border bg-white/80 p-6 shadow-sm space-y-4">
          {saveError && (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {saveError}
            </div>
          )}

          {/* Offline-save info pill */}
          <div className="rounded-2xl bg-sky/20 border border-sky/40 px-3.5 py-2.5 text-xs text-brand-dark font-medium">
            💾 Changes are saved locally first and will sync to the server when you're online.
          </div>

          <StudentRecordForm
            defaultValues={profile}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            excludeId={profile.id}
          />
        </div>
      )}
    </div>
  );
}
