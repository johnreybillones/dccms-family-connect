/**
 * src/routes/staff/students/new.tsx — Add new student record (/staff/students/new)
 *
 * Renders the three-tab StudentRecordForm.  On submit:
 *   1. Saves the profile to the encrypted local IndexedDB vault
 *   2. Enqueues a createProfile sync operation
 *   3. Navigates to the new record's detail view
 *
 * If the vault is locked, shows a friendly prompt instead of the form.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  StudentRecordForm,
  type StudentRecordFormValues,
} from "@/components/staff/StudentRecordForm";
import { createProfile } from "@/features/staff/client/profile-repository";
import { isVaultUnlocked } from "@/features/staff/client/offline-vault";

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/staff/students/new")({
  head: () => ({
    meta: [
      { title: "Add Student — DCC Staff" },
      { name: "description", content: "Register a new child's enrollment profile." },
    ],
  }),
  component: NewStudentPage,
});

// ---------------------------------------------------------------------------
// Vault-locked fallback
// ---------------------------------------------------------------------------

function VaultLockedNotice({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/60">
        <Lock size={28} className="text-muted-foreground/50" aria-hidden="true" />
      </span>
      <p className="font-display font-bold text-foreground/80">Offline vault is locked</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Enter your offline PIN to unlock the vault before adding a student record.
      </p>
      <Button variant="outline" onClick={onBack} className="rounded-2xl mt-2">
        Go back
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function NewStudentPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const vaultUnlocked = isVaultUnlocked();

  const handleSubmit = async (data: StudentRecordFormValues) => {
    setIsSubmitting(true);
    setSaveError(null);
    try {
      const profile = await createProfile({
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
      setSaveError("Could not save the record. Please check that the vault is unlocked.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Button
          id="back-to-students"
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/staff/students" })}
          className="rounded-2xl shrink-0"
          aria-label="Back to student records"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
            Add Student Record
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Register a new child's enrollment profile
          </p>
        </div>
      </div>

      {/* Content */}
      {!vaultUnlocked ? (
        <VaultLockedNotice onBack={() => navigate({ to: "/staff/students" })} />
      ) : (
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
            💾 Records are saved locally first and will sync to the server when you're online.
          </div>

          <StudentRecordForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>
      )}
    </div>
  );
}
