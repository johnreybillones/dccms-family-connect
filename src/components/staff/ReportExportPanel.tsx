import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  LineChart,
  LoaderCircle,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  generateOfflineReport,
  getCurrentSchoolYear,
  getHasPendingUnsyncedChanges,
} from "@/features/staff/client/reports-client";
import type { ReportDefinition, ReportType } from "@/features/staff/contracts/reports";
import { cn } from "@/lib/utils";

type ReportOption = {
  type: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
  bgClass: string;
  accentColor: string;
  activeBorderClass: string;
};

const REPORT_OPTIONS: ReportOption[] = [
  {
    type: "student_masterlist",
    label: "Student Masterlist",
    description: "Complete list of children, birthdates, and local sync status by school year.",
    icon: BookOpen,
    bgClass: "bg-sky-50 text-sky-600",
    accentColor: "text-sky-600",
    activeBorderClass: "ring-2 ring-sky-500/80 border-sky-300 bg-sky-50/40 shadow-sky-100",
  },
  {
    type: "attendance_register_summary",
    label: "Attendance Register",
    description: "Day-by-day attendance marks and student summary totals by selected dates.",
    icon: CalendarDays,
    bgClass: "bg-emerald-50 text-emerald-600",
    accentColor: "text-emerald-600",
    activeBorderClass:
      "ring-2 ring-emerald-500/80 border-emerald-300 bg-emerald-50/40 shadow-emerald-100",
  },
  {
    type: "accomplishment_summary",
    label: "Accomplishment Summary",
    description: "Statistical snapshot of total enrollment and daily attendance rate trends.",
    icon: LineChart,
    bgClass: "bg-amber-50 text-amber-600",
    accentColor: "text-amber-600",
    activeBorderClass: "ring-2 ring-amber-500/80 border-amber-300 bg-amber-50/40 shadow-amber-100",
  },
];

export function ReportExportPanel() {
  const defaultSchoolYear = getCurrentSchoolYear();
  const [reportType, setReportType] = useState<ReportType>("student_masterlist");
  const [schoolYear, setSchoolYear] = useState(defaultSchoolYear);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hasPendingUnsynced, setHasPendingUnsynced] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const needsSchoolYear = reportType === "student_masterlist";
  const needsDateRange = reportType !== "student_masterlist";

  useEffect(() => {
    let cancelled = false;

    async function loadUnsyncedStatus() {
      try {
        const hasUnsynced = await getHasPendingUnsyncedChanges();
        if (!cancelled) {
          setHasPendingUnsynced(hasUnsynced);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStatus(false);
        }
      }
    }

    void loadUnsyncedStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleExport = async (format: ReportDefinition["format"]) => {
    setIsExporting(true);
    setFeedback(null);

    try {
      const definition: ReportDefinition = {
        type: reportType,
        format,
        schoolYear: needsSchoolYear ? schoolYear : null,
        dateFrom: needsDateRange ? dateFrom || null : null,
        dateTo: needsDateRange ? dateTo || null : null,
      };
      const result = await generateOfflineReport(definition);
      setFeedback(`Successfully generated ${result.fileName} in your downloads.`);
      setHasPendingUnsynced(result.hasUnsynced);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not generate the report.";
      setFeedback(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-brand" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-slate-800">
            <span className="sr-only">Offline Reports</span>
            Step 1: Choose Report Template
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="Report templates">
          {REPORT_OPTIONS.map((card) => {
            const isActive = reportType === card.type;
            const Icon = card.icon;
            return (
              <button
                key={card.type}
                role="radio"
                aria-checked={isActive}
                type="button"
                onClick={() => setReportType(card.type)}
                className={cn(
                  "relative cursor-pointer rounded-[2rem] border-2 bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                  "flex flex-col items-start",
                  isActive
                    ? card.activeBorderClass
                    : "border-slate-100/80 shadow-sm hover:border-brand/30",
                )}
              >
                <div className={cn("mb-4 rounded-2xl p-3", card.bgClass)}>
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg leading-tight font-bold text-slate-900">
                  {card.label}
                </h3>
                <p className="mt-2 flex-grow text-xs leading-5 text-slate-500">
                  {card.description}
                </p>
                {isActive ? (
                  <span className={cn("absolute top-4 right-4", card.accentColor)}>
                    <CheckCircle2
                      className="size-5 animate-scale fill-current text-white"
                      aria-hidden="true"
                    />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-[2.2rem] border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-md">
          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Step 2: Adjust Report Parameters
            </h3>
            <p className="text-xs leading-5 text-slate-500">
              Configure the active data scope. The document will be derived directly from your local
              vault.
            </p>
            <div className="grid gap-4 pt-2">
              {needsSchoolYear ? (
                <>
                  <label className="flex flex-col space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      School Year
                    </span>
                    <Input
                      aria-label="School Year"
                      value={schoolYear}
                      onChange={(event) => setSchoolYear(event.target.value)}
                      className="h-11 rounded-2xl border-2 border-slate-100 bg-white text-sm font-medium transition-all focus-visible:border-brand focus-visible:ring-brand/45"
                    />
                  </label>
                  <div className="rounded-2xl border-2 border-dashed border-sky-100 bg-sky-50/20 p-4 text-xs leading-5 text-slate-600">
                    Students are filtered automatically by the specified school year (for example{" "}
                    {schoolYear}).
                  </div>
                </>
              ) : null}

              {needsDateRange ? (
                <>
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs leading-5 text-slate-600">
                    Attendance and accomplishment exports use the selected date range and local
                    attendance data. School year filters are not applied here.
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Date From
                      </span>
                      <Input
                        aria-label="Date From"
                        type="date"
                        value={dateFrom}
                        onChange={(event) => setDateFrom(event.target.value)}
                        className="h-11 rounded-2xl border-2 border-slate-100 bg-white text-sm font-medium transition-all focus-visible:border-brand focus-visible:ring-brand/45"
                      />
                    </label>
                    <label className="flex flex-col space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Date To
                      </span>
                      <Input
                        aria-label="Date To"
                        type="date"
                        value={dateTo}
                        onChange={(event) => setDateTo(event.target.value)}
                        className="h-11 rounded-2xl border-2 border-slate-100 bg-white text-sm font-medium transition-all focus-visible:border-brand focus-visible:ring-brand/45"
                      />
                    </label>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[2.2rem] border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur-md">
          <div className="space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Step 3: Generate and Save File
            </h3>
            <p className="text-xs leading-5 text-slate-500">
              Export high-fidelity, printable files. Generates instantly on this device.
            </p>
            <div className="grid gap-3 pt-2">
              <Button
                type="button"
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-bold text-white shadow-sm transition-all hover:bg-brand/90"
              >
                {isExporting ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileText className="size-4" aria-hidden="true" />
                )}
                Export PDF Document
              </Button>
              <Button
                type="button"
                onClick={() => handleExport("xlsx")}
                disabled={isExporting}
                variant="outline"
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-bold shadow-sm transition-all hover:bg-emerald-100"
              >
                {isExporting ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FileSpreadsheet className="size-4" aria-hidden="true" />
                )}
                Export XLSX Spreadsheet
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[10px] leading-4 text-slate-500">
            Local-first export: generates instantly and appends a signed local audit trail entry for
            compliance.
          </div>
        </div>
      </div>

      {hasPendingUnsynced || isLoadingStatus ? (
        <Alert className="rounded-[1.6rem] border-amber-200 bg-amber-50 text-amber-950">
          <TriangleAlert className="size-4 text-amber-700" aria-hidden="true" />
          <AlertTitle className="text-sm font-semibold">Offline Outbox Status</AlertTitle>
          <AlertDescription className="text-xs">
            {isLoadingStatus
              ? "Checking the local outbox status before export."
              : "Your local vault has pending updates. Generated reports will include your unsynced local data."}
          </AlertDescription>
        </Alert>
      ) : null}

      {feedback ? (
        <div className="flex items-center gap-2 rounded-[1.4rem] border-2 border-emerald-100 bg-emerald-50/50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
          <span>{feedback}</span>
        </div>
      ) : null}
    </div>
  );
}
