import { createFileRoute } from "@tanstack/react-router";

import { ReportExportPanel } from "@/components/staff/ReportExportPanel";

export const Route = createFileRoute("/staff/reports")({
  head: () => ({
    meta: [
      { title: "Reports - DCC Staff" },
      {
        name: "description",
        content: "Generate offline PDF and XLSX reports for student records and attendance.",
      },
    ],
  }),
  component: StaffReportsPage,
});

export function StaffReportsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Staff Reports
        </p>
        <h1 className="font-display text-3xl font-bold text-foreground">Report Exports</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Generate polished working documents from the unlocked local replica and keep the export
          history queued for sync.
        </p>
      </div>

      <ReportExportPanel />
    </div>
  );
}
