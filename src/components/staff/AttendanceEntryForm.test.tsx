import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

import { AttendanceEntryForm } from "@/components/staff/AttendanceEntryForm";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";

// Mock react-day-picker at package level to completely bypass JSDOM hang
vi.mock("react-day-picker", () => ({
  DayPicker: () => <div data-testid="mock-day-picker">Mocked DayPicker</div>,
  getDefaultClassNames: () => ({}),
  DayButton: () => <button>Day</button>,
}));

// Mock framer-motion layout loops
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: () => <div data-testid="mock-calendar" />,
}));

const studentFixture: EnrollmentProfile = {
  id: "profile-001",
  recordNumber: "DCC-000001",
  childFirstName: "Ana",
  childMiddleName: null,
  childLastName: "Dela Cruz",
  childSuffix: null,
  birthDate: "2020-01-15",
  sex: "Female",
  address: "Purok 1, San Antonio, Dasmarinas City, Cavite",
  guardianFullName: "Maria Dela Cruz",
  guardianRelationship: "Mother",
  guardianContactNumber: "09171234567",
  schoolYear: "2025-2026",
  enrollmentDate: "2025-05-01",
  revision: 3,
  createdAt: "2025-05-01T08:00:00.000Z",
  updatedAt: "2025-05-20T09:30:00.000Z",
};

describe("AttendanceEntryForm", () => {
  it("toggles a student's attendance status between present and absent", () => {
    render(
      <AttendanceEntryForm
        students={[studentFixture]}
        defaultDate="2026-05-25"
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    );

    const presentButton = screen.getByRole("button", { name: /ana dela cruz present/i });
    const absentButton = screen.getByRole("button", { name: /ana dela cruz absent/i });

    expect(presentButton).toHaveAttribute("aria-pressed", "false");
    expect(absentButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(presentButton);
    expect(presentButton).toHaveAttribute("aria-pressed", "true");
    expect(absentButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(absentButton);
    expect(absentButton).toHaveAttribute("aria-pressed", "true");
    expect(presentButton).toHaveAttribute("aria-pressed", "false");
  });

  it("reveals the excused note field when excused is selected", () => {
    render(
      <AttendanceEntryForm
        students={[studentFixture]}
        defaultDate="2026-05-25"
        onSubmit={vi.fn()}
        isSubmitting={false}
      />,
    );

    expect(screen.queryByLabelText(/ana dela cruz excused note/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ana dela cruz excused/i }));

    expect(screen.getByLabelText(/ana dela cruz excused note/i)).toBeInTheDocument();
  });
});
