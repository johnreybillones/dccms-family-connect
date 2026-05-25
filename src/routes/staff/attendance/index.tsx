import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarCheck2, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listAttendanceRecords } from "@/features/staff/client/attendance-repository";
import { loadAllQueuedOperations, isVaultUnlocked } from "@/features/staff/client/offline-vault";
import { listProfiles } from "@/features/staff/client/profile-repository";
import type { AttendanceRecord } from "@/features/staff/contracts/attendance-record";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";

type AttendanceListItem = AttendanceRecord & {
  awaitingSync: boolean;
};

type AttendanceSheet = {
  attendanceDate: string;
  awaitingSync: boolean;
  records: AttendanceListItem[];
};

export const Route = createFileRoute("/staff/attendance/")({
  head: () => ({
    meta: [
      { title: "Attendance Sheets - DCC Staff" },
      {
        name: "description",
        content: "Review saved daily attendance sheets and create new attendance entries.",
      },
    ],
  }),
  component: AttendanceSheetsPage,
});

function getStudentName(profileMap: Map<string, EnrollmentProfile>, profileId: string) {
  const profile = profileMap.get(profileId);
  if (!profile) return "Unknown child";
  return `${profile.childFirstName} ${profile.childLastName}`;
}

function AttendanceSheetsPage() {
  const vaultUnlocked = isVaultUnlocked();
  const [records, setRecords] = useState<AttendanceListItem[]>([]);
  const [profiles, setProfiles] = useState<Map<string, EnrollmentProfile>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vaultUnlocked) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadAttendance = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [attendanceRows, queuedOperations, profileRows] = await Promise.all([
          listAttendanceRecords(),
          loadAllQueuedOperations(),
          listProfiles(),
        ]);

        if (cancelled) return;

        const pendingKeys = new Set(
          queuedOperations
            .filter((operation) => operation.kind === "upsertAttendance")
            .flatMap((operation) => [
              operation.attendance.id,
              `${operation.attendance.profileId}|${operation.attendance.attendanceDate}`,
            ]),
        );

        setRecords(
          attendanceRows.map((record) => ({
            ...record,
            awaitingSync:
              pendingKeys.has(record.id) ||
              pendingKeys.has(`${record.profileId}|${record.attendanceDate}`),
          })),
        );
        setProfiles(new Map(profileRows.map((profile) => [profile.id, profile])));
      } catch (loadError) {
        if (cancelled) return;
        setError("Could not load attendance sheets. The vault may be locked.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [vaultUnlocked]);

  const sheets = useMemo<AttendanceSheet[]>(() => {
    const grouped = new Map<string, AttendanceListItem[]>();

    for (const record of records) {
      const current = grouped.get(record.attendanceDate) ?? [];
      current.push(record);
      grouped.set(record.attendanceDate, current);
    }

    return [...grouped.entries()]
      .sort(([leftDate], [rightDate]) => rightDate.localeCompare(leftDate))
      .map(([attendanceDate, groupedRecords]) => ({
        attendanceDate,
        awaitingSync: groupedRecords.some((record) => record.awaitingSync),
        records: groupedRecords.sort((left, right) =>
          left.profileId.localeCompare(right.profileId),
        ),
      }));
  }, [records]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Attendance Sheets</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Review saved attendance by date and keep track of sheets waiting to sync.
          </p>
        </div>

        <Button asChild className="rounded-full bg-brand px-5 hover:bg-brand/90">
          <Link to="/staff/attendance/new">New Sheet</Link>
        </Button>
      </div>

      {!vaultUnlocked ? (
        <div className="rounded-3xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          Unlock the offline vault to review attendance sheets.
        </div>
      ) : isLoading ? (
        <div className="rounded-3xl border border-border bg-card px-5 py-10 text-sm text-muted-foreground">
          Loading attendance sheets...
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </div>
      ) : sheets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          No attendance sheets saved yet. Create the first daily sheet to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {sheets.map((sheet) => {
            const presentCount = sheet.records.filter(
              (record) => record.status === "present",
            ).length;
            const absentCount = sheet.records.filter((record) => record.status === "absent").length;
            const excusedCount = sheet.records.filter(
              (record) => record.status === "excused",
            ).length;

            return (
              <section
                key={sheet.attendanceDate}
                className="rounded-[1.8rem] border border-border/70 bg-white/85 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full bg-sky/25 px-3 py-1 text-sm font-semibold text-brand-dark">
                        <CalendarCheck2 className="size-4" aria-hidden="true" />
                        {format(parseISO(sheet.attendanceDate), "MMMM d, yyyy")}
                      </div>
                      {sheet.records.some((record) => record.awaitingSync) && (
                        <Badge className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
                          Awaiting Sync
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {presentCount} present, {absentCount} absent, {excusedCount} excused
                    </p>
                  </div>

                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/staff/attendance/new" search={{ date: sheet.attendanceDate }}>
                      Open Sheet
                      <ChevronRight className="ml-2 size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  {sheet.records.map((record) => (
                    <div
                      key={record.id}
                      className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {getStudentName(profiles, record.profileId)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.note || "No note recorded"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="rounded-full border-border/70 bg-white px-3 py-1 capitalize text-foreground">
                          {record.status}
                        </Badge>
                        {record.awaitingSync && (
                          <Badge className="rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
                            Awaiting Sync
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
