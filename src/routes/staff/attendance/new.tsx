import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { format } from "date-fns";

import {
  AttendanceEntryForm,
  type AttendanceFormSubmission,
} from "@/components/staff/AttendanceEntryForm";
import { Button } from "@/components/ui/button";
import { isVaultUnlocked } from "@/features/staff/client/offline-vault";
import { listProfiles } from "@/features/staff/client/profile-repository";
import { useSession } from "@/features/staff/client/session-store";
import {
  listAttendanceRecordsByDate,
  saveAttendanceRecord,
} from "@/features/staff/client/attendance-repository";
import type { AttendanceRecord } from "@/features/staff/contracts/attendance-record";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";

type AttendanceSearch = {
  date?: string;
};

export const Route = createFileRoute("/staff/attendance/new")({
  validateSearch: (search: Record<string, unknown>): AttendanceSearch => {
    return {
      date: typeof search.date === "string" ? search.date : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "New Attendance Sheet - DCC Staff" },
      {
        name: "description",
        content: "Record daily attendance for enrolled children on the protected staff app.",
      },
    ],
  }),
  component: NewAttendancePage,
});

function getTodayIsoDate() {
  return format(new Date(), "yyyy-MM-dd");
}

function VaultLockedNotice({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/60">
        <Lock size={28} className="text-muted-foreground/50" aria-hidden="true" />
      </span>
      <p className="font-display font-bold text-foreground/80">Offline vault is locked</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Enter your offline PIN before recording a new attendance sheet.
      </p>
      <Button variant="outline" onClick={onBack} className="mt-2 rounded-2xl">
        Go back
      </Button>
    </div>
  );
}

function NewAttendancePage() {
  const navigate = useNavigate();
  const session = useSession();
  const search = Route.useSearch();
  const vaultUnlocked = isVaultUnlocked();
  const [attendanceDate, setAttendanceDate] = useState(search.date || getTodayIsoDate());
  const [students, setStudents] = useState<EnrollmentProfile[]>([]);
  const [existingRecords, setExistingRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vaultUnlocked) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadPageData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [profileRows, attendanceRows] = await Promise.all([
          listProfiles(),
          listAttendanceRecordsByDate(attendanceDate),
        ]);

        if (cancelled) return;

        setStudents(
          profileRows.sort((left, right) => {
            const lastNameOrder = left.childLastName.localeCompare(right.childLastName);
            if (lastNameOrder !== 0) return lastNameOrder;
            return left.childFirstName.localeCompare(right.childFirstName);
          }),
        );
        setExistingRecords(attendanceRows);
      } catch (loadError) {
        if (cancelled) return;
        setError("Could not load attendance data. The vault may be locked.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPageData();

    return () => {
      cancelled = true;
    };
  }, [attendanceDate, vaultUnlocked]);

  const handleSubmit = async ({ attendanceDate, entries }: AttendanceFormSubmission) => {
    if (!session) {
      setError("Your session expired. Sign in again before saving attendance.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await Promise.all(
        entries.map((entry) =>
          saveAttendanceRecord({
            id: entry.id,
            profileId: entry.profileId,
            attendanceDate,
            status: entry.status,
            note: entry.note,
            recordedByUserId: session.id,
          }),
        ),
      );

      navigate({ to: "/staff/attendance" });
    } catch (saveError) {
      setError("Could not save attendance. Confirm the vault is unlocked and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/staff/attendance" })}
          className="rounded-2xl"
          aria-label="Back to attendance sheets"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">New Attendance Sheet</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Capture daily attendance and keep the sheet ready for sync later.
          </p>
        </div>
      </div>

      {!vaultUnlocked ? (
        <VaultLockedNotice onBack={() => navigate({ to: "/staff/attendance" })} />
      ) : isLoading ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Loading attendance sheet...
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-sky-200/70 bg-sky/20 px-4 py-3 text-sm text-brand-dark">
            This workflow saves on the device first. If the device is offline, the sheet is queued
            for sync automatically.
          </div>

          <AttendanceEntryForm
            students={students}
            existingRecords={existingRecords}
            defaultDate={attendanceDate}
            onDateChange={setAttendanceDate}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
}
