import { utils, write } from "xlsx";

import type { OfflineReportPayload } from "./reports-client";
import { formatIsoDateLabel } from "./reports-client";

function createDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getTitleRows(payload: OfflineReportPayload) {
  return [
    ["Barangay San Antonio de Padua I Day Care Center"],
    [getReportTitle(payload)],
    [`Generated: ${new Date(payload.generatedAt).toLocaleString("en-US")}`],
    [`Prepared by: ${payload.generatedBy}`],
    [`Contains Unsynced Offline Changes: ${payload.hasUnsynced ? "Yes" : "No"}`],
    [payload.schoolYear ? `School Year: ${payload.schoolYear}` : ""],
    [
      payload.dateFrom && payload.dateTo
        ? `Coverage: ${payload.dateFrom} to ${payload.dateTo}`
        : "",
    ],
    [],
  ];
}

function getReportTitle(payload: OfflineReportPayload) {
  return {
    student_masterlist: "Student Masterlist",
    attendance_register_summary: "Attendance Register",
    accomplishment_summary: "Accomplishment Summary",
  }[payload.type];
}

function buildWorksheetData(payload: OfflineReportPayload) {
  if (payload.type === "student_masterlist") {
    return [
      ...getTitleRows(payload),
      ["Name", "Gender", "Birth Date", "Guardian Name", "Contact", "Status"],
      ...payload.studentRows.map((row) => [
        row.name,
        row.gender,
        row.birthDate,
        row.guardianName,
        row.contact,
        row.status,
      ]),
    ];
  }

  if (payload.type === "attendance_register_summary") {
    return [
      ...getTitleRows(payload),
      [
        "Student",
        ...payload.attendanceDates.map((date) => formatIsoDateLabel(date)),
        "Present",
        "Absent",
        "Excused",
      ],
      ...payload.attendanceRows.map((row) => [
        row.studentName,
        ...payload.attendanceDates.map((date) => row.statusesByDate[date] ?? "N/A"),
        row.totals.present,
        row.totals.absent,
        row.totals.excused,
      ]),
    ];
  }

  return [
    ...getTitleRows(payload),
    ["Metric", "Value"],
    ["Total Enrolled", payload.summary.totalEnrolled],
    ["Average Daily Attendance Rate", `${payload.summary.averageDailyAttendanceRate.toFixed(1)}%`],
    ["Active Record Count", payload.summary.activeRecordCount],
    ["Covered Days", payload.summary.coveredDays],
  ];
}

function getColumnWidths(payload: OfflineReportPayload) {
  if (payload.type === "student_masterlist") {
    return [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 18 }, { wch: 18 }];
  }

  if (payload.type === "attendance_register_summary") {
    return [
      { wch: 28 },
      ...payload.attendanceDates.map(() => ({ wch: 12 })),
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];
  }

  return [{ wch: 30 }, { wch: 18 }];
}

export async function exportReportToXlsx(payload: OfflineReportPayload) {
  const workbook = utils.book_new();
  const sheetData = buildWorksheetData(payload);
  const worksheet = utils.aoa_to_sheet(sheetData);
  worksheet["!cols"] = getColumnWidths(payload);
  utils.book_append_sheet(workbook, worksheet, getReportTitle(payload).slice(0, 31));

  const arrayBuffer = write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  createDownload(blob, payload.fileName);
}
