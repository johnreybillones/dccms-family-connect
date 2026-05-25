import { jsPDF } from "jspdf";

import type {
  AttendanceRegisterPayload,
  OfflineReportPayload,
  StudentMasterlistPayload,
} from "./reports-client";
import { formatIsoDateLabel } from "./reports-client";

const PAGE_MARGIN = 40;
const ROW_HEIGHT = 20;

function addSealPlaceholder(doc: jsPDF) {
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(239, 246, 255);
  doc.circle(PAGE_MARGIN + 20, PAGE_MARGIN + 20, 20, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 64, 175);
  doc.text("SEAL", PAGE_MARGIN + 20, PAGE_MARGIN + 23, { align: "center" });
}

function addHeader(doc: jsPDF, payload: OfflineReportPayload) {
  addSealPlaceholder(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(17, 24, 39);
  doc.text("Barangay San Antonio de Padua I Day Care Center", PAGE_MARGIN + 52, PAGE_MARGIN + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text("Offline Reports Generation", PAGE_MARGIN + 52, PAGE_MARGIN + 28);
  doc.text(`Prepared by ${payload.generatedBy}`, PAGE_MARGIN + 52, PAGE_MARGIN + 40);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text(getReportTitle(payload), PAGE_MARGIN, PAGE_MARGIN + 70);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  const subtitleParts = [
    payload.schoolYear ? `School Year ${payload.schoolYear}` : null,
    payload.dateFrom && payload.dateTo
      ? `Coverage ${formatIsoDateLabel(payload.dateFrom)} to ${formatIsoDateLabel(payload.dateTo)}`
      : null,
  ].filter(Boolean);
  doc.text(subtitleParts.join(" • ") || "Locally generated report", PAGE_MARGIN, PAGE_MARGIN + 88);

  if (payload.hasUnsynced) {
    const badgeY = PAGE_MARGIN + 96;
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(PAGE_MARGIN, badgeY, 160, 18, 6, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text("Contains Unsynced Local Data", PAGE_MARGIN + 80, badgeY + 12, {
      align: "center",
    });
  }
}

function addFooter(doc: jsPDF, payload: OfflineReportPayload) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(PAGE_MARGIN, pageHeight - 44, pageWidth - PAGE_MARGIN, pageHeight - 44);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Generated ${new Date(payload.generatedAt).toLocaleString("en-US")}`,
      PAGE_MARGIN,
      pageHeight - 28,
    );
    doc.text(`Page ${page} of ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 28, {
      align: "right",
    });
  }
}

function getReportTitle(payload: OfflineReportPayload) {
  return {
    student_masterlist: "Student Masterlist",
    attendance_register_summary: "Attendance Register",
    accomplishment_summary: "Accomplishment Summary",
  }[payload.type];
}

function drawTable(
  doc: jsPDF,
  startY: number,
  columns: Array<{ key: string; label: string; width: number }>,
  rows: Array<Record<string, string>>,
) {
  let y = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const drawHeaderRow = () => {
    let x = PAGE_MARGIN;
    doc.setFillColor(224, 242, 254);
    doc.rect(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN * 2, ROW_HEIGHT, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    for (const column of columns) {
      doc.text(column.label, x + 4, y + 13, { maxWidth: column.width - 8 });
      x += column.width;
    }
    y += ROW_HEIGHT;
  };

  drawHeaderRow();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(31, 41, 55);

  for (const row of rows) {
    if (y > pageHeight - 80) {
      doc.addPage();
      const payload = docReportContext.get(doc)!;
      addHeader(doc, payload);
      y = payload.hasUnsynced ? PAGE_MARGIN + 130 : PAGE_MARGIN + 110;
      drawHeaderRow();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(31, 41, 55);
    }

    let x = PAGE_MARGIN;
    doc.setDrawColor(226, 232, 240);
    doc.rect(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN * 2, ROW_HEIGHT);
    for (const column of columns) {
      doc.text(row[column.key] ?? "", x + 4, y + 13, { maxWidth: column.width - 8 });
      x += column.width;
    }
    y += ROW_HEIGHT;
  }

  return y;
}

function renderStudentMasterlist(doc: jsPDF, payload: StudentMasterlistPayload) {
  const startY = payload.hasUnsynced ? PAGE_MARGIN + 130 : PAGE_MARGIN + 110;
  drawTable(
    doc,
    startY,
    [
      { key: "name", label: "Name", width: 140 },
      { key: "gender", label: "Gender", width: 60 },
      { key: "birthDate", label: "Birth Date", width: 70 },
      { key: "guardianName", label: "Guardian Name", width: 120 },
      { key: "contact", label: "Contact", width: 90 },
      { key: "status", label: "Status", width: 75 },
    ],
    payload.studentRows.map((row) => ({
      ...row,
      birthDate: formatIsoDateLabel(row.birthDate),
    })),
  );
}

function renderAttendanceRegister(doc: jsPDF, payload: AttendanceRegisterPayload) {
  const dateColumns = payload.attendanceDates;
  const chunkSize = Math.max(1, Math.min(5, dateColumns.length || 1));
  const startY = payload.hasUnsynced ? PAGE_MARGIN + 130 : PAGE_MARGIN + 110;

  for (let index = 0; index < dateColumns.length || index === 0; index += chunkSize) {
    if (index > 0) {
      doc.addPage();
      addHeader(doc, payload);
    }

    const visibleDates = dateColumns.slice(index, index + chunkSize);
    const columns = [
      { key: "studentName", label: "Student", width: 128 },
      ...visibleDates.map((date) => ({
        key: date,
        label: formatIsoDateLabel(date),
        width: 55,
      })),
      { key: "present", label: "P", width: 36 },
      { key: "absent", label: "A", width: 36 },
      { key: "excused", label: "E", width: 36 },
    ];

    drawTable(
      doc,
      startY,
      columns,
      payload.attendanceRows.map((row) => ({
        studentName: row.studentName,
        present: String(row.totals.present),
        absent: String(row.totals.absent),
        excused: String(row.totals.excused),
        ...Object.fromEntries(
          visibleDates.map((date) => [date, row.statusesByDate[date] ?? "N/A"]),
        ),
      })),
    );
  }
}

function renderAccomplishmentSummary(doc: jsPDF, payload: OfflineReportPayload) {
  if (payload.type !== "accomplishment_summary") return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const cardWidth = (pageWidth - PAGE_MARGIN * 2 - 24) / 3;
  const startY = payload.hasUnsynced ? PAGE_MARGIN + 135 : PAGE_MARGIN + 120;

  const cards = [
    {
      label: "Total Enrolled",
      value: String(payload.summary.totalEnrolled),
      color: [224, 242, 254] as const,
    },
    {
      label: "Daily Attendance Rate",
      value: `${payload.summary.averageDailyAttendanceRate.toFixed(1)}%`,
      color: [220, 252, 231] as const,
    },
    {
      label: "Active Record Count",
      value: String(payload.summary.activeRecordCount),
      color: [254, 249, 195] as const,
    },
  ];

  cards.forEach((card, index) => {
    const x = PAGE_MARGIN + index * (cardWidth + 12);
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(x, startY, cardWidth, 92, 18, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(card.label, x + 16, startY + 28);
    doc.setFontSize(24);
    doc.text(card.value, x + 16, startY + 62);
  });

  const operationalY = startY + 112;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(PAGE_MARGIN, operationalY, pageWidth - PAGE_MARGIN * 2, 110, 22, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("Operational Summary", PAGE_MARGIN + 18, operationalY + 26);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const summaryLines = [
    `${payload.summary.coveredDays} attendance day(s) were included in this export window.`,
    "Attendance rate is based on locally available present, absent, and excused marks.",
    payload.hasUnsynced
      ? "Pending outbox changes are included in these numbers and marked in the export audit."
      : "All values reflect the current unlocked local replica at generation time.",
  ];
  doc.text(summaryLines, PAGE_MARGIN + 18, operationalY + 50, {
    maxWidth: pageWidth - PAGE_MARGIN * 2 - 36,
    lineHeightFactor: 1.45,
  });
}

const docReportContext = new WeakMap<jsPDF, OfflineReportPayload>();

function triggerPdfDownload(doc: jsPDF, fileName: string) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportReportToPdf(payload: OfflineReportPayload) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation: payload.type === "attendance_register_summary" ? "landscape" : "portrait",
  });
  docReportContext.set(doc, payload);

  addHeader(doc, payload);

  if (payload.type === "student_masterlist") {
    renderStudentMasterlist(doc, payload);
  } else if (payload.type === "attendance_register_summary") {
    renderAttendanceRegister(doc, payload);
  } else {
    renderAccomplishmentSummary(doc, payload);
  }

  addFooter(doc, payload);
  triggerPdfDownload(doc, payload.fileName);
}
