import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { AlertCircle, CalendarDays, Check, Loader2, Save, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  AttendanceRecord,
  AttendanceStatus,
} from "@/features/staff/contracts/attendance-record";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";

type AttendanceDraftState = {
  id?: string;
  status?: AttendanceStatus;
  note: string;
};

export type AttendanceFormSubmission = {
  attendanceDate: string;
  entries: Array<{
    id?: string;
    profileId: string;
    status: AttendanceStatus;
    note: string | null;
  }>;
};

export type AttendanceEntryFormProps = {
  students: EnrollmentProfile[];
  existingRecords?: AttendanceRecord[];
  defaultDate: string;
  onDateChange?: (date: string) => void;
  onSubmit: (payload: AttendanceFormSubmission) => void | Promise<void>;
  isSubmitting?: boolean;
};

const STATUS_OPTIONS: Array<{
  status: AttendanceStatus;
  label: string;
  Icon: React.ElementType;
  baseClassName: string;
  activeClassName: string;
}> = [
  {
    status: "present",
    label: "Present",
    Icon: Check,
    baseClassName:
      "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50",
    activeClassName: "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-600",
  },
  {
    status: "absent",
    label: "Absent",
    Icon: X,
    baseClassName: "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50",
    activeClassName: "bg-rose-600 text-white border-rose-600 hover:bg-rose-600",
  },
  {
    status: "excused",
    label: "Excused",
    Icon: AlertCircle,
    baseClassName: "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50",
    activeClassName: "bg-amber-600 text-white border-amber-600 hover:bg-amber-600",
  },
];

function getTodayIsoDate() {
  return format(new Date(), "yyyy-MM-dd");
}

function buildStudentName(profile: EnrollmentProfile): string {
  return [profile.childFirstName, profile.childLastName].filter(Boolean).join(" ");
}

function getStudentMonogram(profile: EnrollmentProfile): string {
  return [profile.childFirstName, profile.childLastName]
    .filter(Boolean)
    .map((value) => value[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function mapRecordsToDrafts(records: AttendanceRecord[]): Record<string, AttendanceDraftState> {
  return records.reduce<Record<string, AttendanceDraftState>>((accumulator, record) => {
    accumulator[record.profileId] = {
      id: record.id,
      status: record.status,
      note: record.note ?? "",
    };
    return accumulator;
  }, {});
}

const EMPTY_RECORDS: AttendanceRecord[] = [];

export function AttendanceEntryForm({
  students,
  existingRecords = EMPTY_RECORDS,
  defaultDate,
  onDateChange,
  onSubmit,
  isSubmitting = false,
}: AttendanceEntryFormProps) {
  const [attendanceDate, setAttendanceDate] = useState(defaultDate || getTodayIsoDate());
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraftState>>(() =>
    mapRecordsToDrafts(existingRecords),
  );
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    setAttendanceDate(defaultDate || getTodayIsoDate());
  }, [defaultDate]);

  useEffect(() => {
    setDrafts(mapRecordsToDrafts(existingRecords));
  }, [existingRecords]);

  const selectedCount = useMemo(
    () => Object.values(drafts).filter((draft) => draft.status).length,
    [drafts],
  );

  const handleStatusChange = (profileId: string, status: AttendanceStatus) => {
    setDrafts((current) => ({
      ...current,
      [profileId]: {
        id: current[profileId]?.id,
        status,
        note: status === "excused" ? (current[profileId]?.note ?? "") : "",
      },
    }));
  };

  const handleNoteChange = (profileId: string, note: string) => {
    setDrafts((current) => ({
      ...current,
      [profileId]: {
        id: current[profileId]?.id,
        status: "excused",
        note,
      },
    }));
  };

  const submitDisabled = isSubmitting || selectedCount === 0;

  return (
    <Card className="overflow-hidden rounded-[2rem] border-[hsl(38_62%_86%)] bg-[linear-gradient(180deg,hsl(39_100%_98%)_0%,hsl(0_0%_100%)_24%,hsl(42_40%_98%)_100%)] shadow-[0_24px_60px_-32px_hsl(30_45%_45%_/_0.35)]">
      <CardHeader className="space-y-4 border-b border-[hsl(35_55%_90%)] bg-white/75">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="font-display text-2xl text-foreground">
              Attendance Sheet
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Pick a date and mark each child as present, absent, or excused.
            </CardDescription>
          </div>

          <div className="rounded-2xl border border-[hsl(34_52%_88%)] bg-[hsl(41_70%_97%)] p-1.5">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-[1.1rem] px-4 text-left hover:bg-white"
                >
                  <CalendarDays className="mr-3 size-4 text-brand" aria-hidden="true" />
                  <span className="flex flex-col items-start">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Attendance Date
                    </span>
                    <span className="font-semibold text-foreground">
                      {format(parseISO(attendanceDate), "MMMM d, yyyy")}
                    </span>
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-3xl border-[hsl(35_45%_88%)] p-0">
                <Calendar
                  mode="single"
                  selected={parseISO(attendanceDate)}
                  onSelect={(date) => {
                    if (!date) return;
                    const nextDate = format(date, "yyyy-MM-dd");
                    setAttendanceDate(nextDate);
                    onDateChange?.(nextDate);
                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1 text-emerald-800">
            {selectedCount} of {students.length} marked
          </div>
          <div className="rounded-full border border-border/60 bg-white/85 px-3 py-1 text-muted-foreground">
            Saves locally first
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5 md:p-6">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const entries = students
              .map((student) => {
                const draft = drafts[student.id];
                if (!draft?.status) return null;

                return {
                  id: draft.id,
                  profileId: student.id,
                  status: draft.status,
                  note: draft.status === "excused" ? draft.note.trim() || null : null,
                };
              })
              .filter(
                (entry): entry is AttendanceFormSubmission["entries"][number] => entry !== null,
              );

            void onSubmit({ attendanceDate, entries });
          }}
          className="space-y-4"
        >
          {students.map((student) => {
            const studentName = buildStudentName(student);
            const schoolId = student.recordNumber ?? "Pending school ID";
            const activeStatus = drafts[student.id]?.status;

            return (
              <div
                key={student.id}
                className="rounded-[1.6rem] border border-[hsl(35_35%_88%)] bg-white/90 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 border border-brand/10 bg-sky/40">
                      <AvatarFallback className="bg-sky/40 font-display font-bold text-brand-dark">
                        {getStudentMonogram(student)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{studentName}</p>
                      <p className="text-sm text-muted-foreground">{schoolId}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:flex">
                    {STATUS_OPTIONS.map(
                      ({ status, label, Icon, baseClassName, activeClassName }) => {
                        const selected = activeStatus === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            aria-label={`${studentName} ${label}`}
                            aria-pressed={selected}
                            onClick={() => handleStatusChange(student.id, status)}
                            className={cn(
                              "inline-flex min-w-24 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                              selected ? activeClassName : baseClassName,
                            )}
                          >
                            <Icon className="size-4" aria-hidden="true" />
                            {label}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {activeStatus === "excused" && (
                    <motion.div
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="mt-4 rounded-[1.4rem] border border-amber-200/70 bg-amber-50/70 p-3"
                    >
                      <Label
                        htmlFor={`excused-note-${student.id}`}
                        className="text-sm font-semibold"
                      >
                        {studentName} Excused Note
                      </Label>
                      <Textarea
                        id={`excused-note-${student.id}`}
                        aria-label={`${studentName} Excused Note`}
                        value={drafts[student.id]?.note ?? ""}
                        onChange={(event) => handleNoteChange(student.id, event.target.value)}
                        placeholder="Child has a fever"
                        className="mt-2 min-h-24 rounded-2xl border-amber-200/70 bg-white/90"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {students.length === 0 && (
            <div className="rounded-[1.6rem] border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No enrolled children are available yet. Add student records before taking attendance.
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-[hsl(35_42%_90%)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-2xl border border-[hsl(38_45%_88%)] bg-[hsl(45_86%_97%)] px-3 py-2 text-sm text-foreground/75">
              Excused entries can include a short note for later review.
            </div>

            <Button
              type="submit"
              disabled={submitDisabled}
              className="h-11 rounded-full bg-brand px-5 hover:bg-brand/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                  Saving Attendance
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" aria-hidden="true" />
                  Save Attendance
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
