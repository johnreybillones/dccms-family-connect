/**
 * src/routes/staff/students/index.tsx — Student Records list (/staff/students)
 *
 * Loads all locally-stored profiles from the encrypted IndexedDB vault and
 * renders them in the searchable StudentRecordList.
 *
 * If the vault is locked (user has not yet entered their offline PIN) the
 * page shows a friendly locked-vault notice rather than trying to decrypt.
 *
 * This page is read-only; the primary action is "Add student record".
 */

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StudentRecordList } from "@/components/staff/StudentRecordList";
import { listProfiles } from "@/features/staff/client/profile-repository";
import { isVaultUnlocked } from "@/features/staff/client/offline-vault";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/staff/students/")({
  head: () => ({
    meta: [
      { title: "Student Records — DCC Staff" },
      {
        name: "description",
        content: "Browse, search, and manage enrolled children in the Day Care Center.",
      },
    ],
  }),
  component: StudentRecordsIndex,
});

// ---------------------------------------------------------------------------
// Vault-locked notice
// ---------------------------------------------------------------------------

function VaultLockedNotice() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/60">
        <Lock size={28} className="text-muted-foreground/50" aria-hidden="true" />
      </span>
      <p className="font-display font-bold text-foreground/80">Offline vault is locked</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Enter your offline PIN to unlock the vault and view student records.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function StudentRecordsIndex() {
  const [profiles, setProfiles] = useState<EnrollmentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const vaultUnlocked = isVaultUnlocked();

  const loadProfiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listProfiles();
      // Sort by last name then first name
      data.sort((a, b) => {
        const last = a.childLastName.localeCompare(b.childLastName);
        if (last !== 0) return last;
        return a.childFirstName.localeCompare(b.childFirstName);
      });
      setProfiles(data);
    } catch (err) {
      setError("Could not load records. The vault may be locked.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (vaultUnlocked) {
      loadProfiles();
    } else {
      setIsLoading(false);
    }
  }, [vaultUnlocked]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
            Student Records
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Find, add, or update enrolled children
          </p>
        </div>

        {vaultUnlocked && !isLoading && (
          <Button
            id="refresh-student-records"
            variant="ghost"
            size="icon"
            onClick={loadProfiles}
            className="rounded-2xl"
            aria-label="Refresh records"
          >
            <RefreshCw size={16} aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Content */}
      {!vaultUnlocked ? (
        <VaultLockedNotice />
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      ) : (
        <StudentRecordList profiles={profiles} isLoading={isLoading} />
      )}
    </div>
  );
}
