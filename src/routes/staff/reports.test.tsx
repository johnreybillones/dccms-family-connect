import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

import { Route, StaffReportsPage } from "@/routes/staff/reports";

vi.mock("@/components/staff/ReportExportPanel", () => ({
  ReportExportPanel: () => <div data-testid="report-export-panel">Mock export panel</div>,
}));

describe("/staff/reports route", () => {
  it("renders the reports page wrapper and export panel", () => {
    render(<StaffReportsPage />);

    expect(screen.getByRole("heading", { name: /report exports/i })).toBeInTheDocument();
    expect(screen.getByTestId("report-export-panel")).toBeInTheDocument();
  });

  it("registers the expected staff reports path", () => {
    expect(Route.options.component).toBe(StaffReportsPage);
  });
});
