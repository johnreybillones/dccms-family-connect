import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

import { ReportExportPanel } from "@/components/staff/ReportExportPanel";

const generateOfflineReport = vi.fn();
const getHasPendingUnsyncedChanges = vi.fn();

vi.mock("@/features/staff/client/reports-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/staff/client/reports-client")>();
  return {
    ...actual,
    generateOfflineReport: (...args: unknown[]) => generateOfflineReport(...args),
    getHasPendingUnsyncedChanges: (...args: unknown[]) => getHasPendingUnsyncedChanges(...args),
  };
});

describe("ReportExportPanel", () => {
  it("renders all report controls and default actions", async () => {
    getHasPendingUnsyncedChanges.mockResolvedValue(false);
    render(<ReportExportPanel />);

    expect(screen.getByText(/offline reports/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /student masterlist/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /attendance register/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /accomplishment summary/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export pdf/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /export xlsx/i })).toBeInTheDocument();

    await waitFor(() => expect(getHasPendingUnsyncedChanges).toHaveBeenCalled());
  });

  it("updates visible parameters when the selected report changes", async () => {
    getHasPendingUnsyncedChanges.mockResolvedValue(true);
    render(<ReportExportPanel />);

    fireEvent.click(screen.getByRole("radio", { name: /attendance register/i }));

    expect(await screen.findByLabelText(/date from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date to/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/school year/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/your local vault has pending updates\. generated reports will include/i),
    ).toBeInTheDocument();
  });

  it("calls the client export helper with the selected format and parameters", async () => {
    getHasPendingUnsyncedChanges.mockResolvedValue(false);
    generateOfflineReport.mockResolvedValue({ fileName: "attendance-register.xlsx" });

    render(<ReportExportPanel />);

    fireEvent.click(screen.getByRole("radio", { name: /attendance register/i }));
    fireEvent.change(await screen.findByLabelText(/date from/i), {
      target: { value: "2025-05-01" },
    });
    fireEvent.change(screen.getByLabelText(/date to/i), {
      target: { value: "2025-05-31" },
    });
    fireEvent.click(screen.getByRole("button", { name: /export xlsx/i }));

    await waitFor(() =>
      expect(generateOfflineReport).toHaveBeenCalledWith({
        type: "attendance_register_summary",
        format: "xlsx",
        schoolYear: null,
        dateFrom: "2025-05-01",
        dateTo: "2025-05-31",
      }),
    );
  });
});
