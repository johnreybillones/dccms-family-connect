/**
 * src/components/staff/StudentRecordForm.tsx
 *
 * Enrollment-profile create/edit form divided into three visually elegant tabs:
 *   1. Child Info       — name, sex, birth date, address
 *   2. Guardian Info    — full name, relationship, contact
 *   3. Enrollment Details — school year, enrollment date
 *
 * Features:
 *   - React Hook Form + Zod validation (derived from frozen enrollment contract)
 *   - Possible-duplicate detection: checks local store after first/last name or
 *     birth date changes (debounced, 400 ms)
 *   - Tactile rounded inputs, friendly pastel colors, Fredoka/Nunito typography
 *   - Motion tab transitions (respects prefers-reduced-motion)
 *   - Accessible field labels and error messages
 *
 * Usage:
 *   <StudentRecordForm onSubmit={handleSave} isSubmitting={false} />
 *   <StudentRecordForm defaultValues={profile} onSubmit={handleUpdate} isSubmitting={false} />
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Baby, ChevronRight, ChevronLeft, Users, ClipboardList, Save, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PossibleDuplicateNotice } from "@/components/staff/PossibleDuplicateNotice";
import { findPossibleDuplicates } from "@/features/staff/client/profile-repository";
import type { EnrollmentProfile } from "@/features/staff/contracts/enrollment-profile";

// ---------------------------------------------------------------------------
// Form schema (subset of EnrollmentProfile, user-editable fields only)
// ---------------------------------------------------------------------------

const formSchema = z.object({
  // Tab 1 — Child Info
  childFirstName: z.string().trim().min(1, "First name is required"),
  childMiddleName: z.string().trim().optional(),
  childLastName: z.string().trim().min(1, "Last name is required"),
  childSuffix: z.string().trim().optional(),
  birthDate: z
    .string()
    .trim()
    .min(1, "Birth date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  sex: z.enum(["Female", "Male", "Not specified"]),
  address: z.string().trim().min(1, "Address is required"),

  // Tab 2 — Guardian Info
  guardianFullName: z.string().trim().min(1, "Guardian name is required"),
  guardianRelationship: z.string().trim().min(1, "Relationship is required"),
  guardianContactNumber: z.string().trim().min(1, "Contact number is required"),

  // Tab 3 — Enrollment Details
  schoolYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/, "Use YYYY-YYYY format")
    .refine((v) => {
      const [s, e] = v.split("-").map(Number);
      return e === s + 1;
    }, "End year must be start year + 1"),
  enrollmentDate: z
    .string()
    .trim()
    .min(1, "Enrollment date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
});

type FormValues = z.infer<typeof formSchema>;

// Derive initial default values
function makeDefaults(profile?: EnrollmentProfile): FormValues {
  const today = new Date().toISOString().slice(0, 10);
  const thisYear = new Date().getFullYear();
  const startYear = new Date().getMonth() >= 5 ? thisYear : thisYear - 1;

  if (profile) {
    return {
      childFirstName: profile.childFirstName,
      childMiddleName: profile.childMiddleName ?? "",
      childLastName: profile.childLastName,
      childSuffix: profile.childSuffix ?? "",
      birthDate: profile.birthDate,
      sex: profile.sex,
      address: profile.address,
      guardianFullName: profile.guardianFullName,
      guardianRelationship: profile.guardianRelationship,
      guardianContactNumber: profile.guardianContactNumber,
      schoolYear: profile.schoolYear,
      enrollmentDate: profile.enrollmentDate,
    };
  }

  return {
    childFirstName: "",
    childMiddleName: "",
    childLastName: "",
    childSuffix: "",
    birthDate: "",
    sex: "Not specified",
    address: "",
    guardianFullName: "",
    guardianRelationship: "",
    guardianContactNumber: "",
    schoolYear: `${startYear}-${startYear + 1}`,
    enrollmentDate: today,
  };
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type Tab = "child" | "guardian" | "enrollment";

const TABS: { id: Tab; label: string; Icon: React.ElementType; color: string }[] = [
  { id: "child", label: "Child Info", Icon: Baby, color: "text-sky-600" },
  { id: "guardian", label: "Guardian Info", Icon: Users, color: "text-emerald-600" },
  { id: "enrollment", label: "Enrollment Details", Icon: ClipboardList, color: "text-violet-600" },
];

const TAB_FIELDS: Record<Tab, (keyof FormValues)[]> = {
  child: [
    "childFirstName",
    "childMiddleName",
    "childLastName",
    "childSuffix",
    "birthDate",
    "sex",
    "address",
  ],
  guardian: ["guardianFullName", "guardianRelationship", "guardianContactNumber"],
  enrollment: ["schoolYear", "enrollmentDate"],
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">{children}</div>;
}

function FieldWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-destructive font-medium leading-tight">
      {message}
    </p>
  );
}

function StyledInput({ error, ...props }: React.ComponentProps<"input"> & { error?: boolean }) {
  return (
    <Input
      {...props}
      className={cn(
        "h-11 rounded-2xl border-2 bg-white px-4 text-sm font-medium transition-all",
        "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:border-brand",
        "placeholder:text-muted-foreground/50",
        error
          ? "border-destructive/60 focus-visible:ring-destructive/40 focus-visible:border-destructive"
          : "border-input hover:border-brand/40",
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Tab panels
// ---------------------------------------------------------------------------

type FormProps = {
  form: ReturnType<typeof useForm<FormValues>>;
  onDuplicatesChange: (matches: EnrollmentProfile[]) => void;
  duplicates: EnrollmentProfile[];
  excludeId?: string;
};

function ChildInfoPanel({ form, onDuplicatesChange, duplicates, excludeId }: FormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const firstName = watch("childFirstName");
  const lastName = watch("childLastName");
  const birthDate = watch("birthDate");

  // Debounced duplicate check
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!firstName || !lastName || !birthDate) {
      onDuplicatesChange([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await findPossibleDuplicates(firstName, lastName, birthDate, excludeId);
        onDuplicatesChange(found.map((d) => d.profile));
      } catch {
        onDuplicatesChange([]);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [firstName, lastName, birthDate, excludeId, onDuplicatesChange]);

  return (
    <div className="space-y-5">
      <PossibleDuplicateNotice matches={duplicates} />

      <FieldGroup>
        {/* First name */}
        <FieldWrap>
          <Label htmlFor="childFirstName" className="text-sm font-semibold">
            First Name <span className="text-destructive">*</span>
          </Label>
          <StyledInput
            id="childFirstName"
            placeholder="e.g. Maria"
            error={!!errors.childFirstName}
            {...register("childFirstName")}
          />
          <FieldError message={errors.childFirstName?.message} />
        </FieldWrap>

        {/* Middle name */}
        <FieldWrap>
          <Label htmlFor="childMiddleName" className="text-sm font-semibold">
            Middle Name <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <StyledInput
            id="childMiddleName"
            placeholder="e.g. Santos"
            error={!!errors.childMiddleName}
            {...register("childMiddleName")}
          />
          <FieldError message={errors.childMiddleName?.message} />
        </FieldWrap>

        {/* Last name */}
        <FieldWrap>
          <Label htmlFor="childLastName" className="text-sm font-semibold">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <StyledInput
            id="childLastName"
            placeholder="e.g. Reyes"
            error={!!errors.childLastName}
            {...register("childLastName")}
          />
          <FieldError message={errors.childLastName?.message} />
        </FieldWrap>

        {/* Suffix */}
        <FieldWrap>
          <Label htmlFor="childSuffix" className="text-sm font-semibold">
            Suffix <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <StyledInput
            id="childSuffix"
            placeholder="e.g. Jr."
            error={!!errors.childSuffix}
            {...register("childSuffix")}
          />
          <FieldError message={errors.childSuffix?.message} />
        </FieldWrap>

        {/* Birth date */}
        <FieldWrap>
          <Label htmlFor="birthDate" className="text-sm font-semibold">
            Birth Date <span className="text-destructive">*</span>
          </Label>
          <StyledInput
            id="birthDate"
            type="date"
            error={!!errors.birthDate}
            {...register("birthDate")}
          />
          <FieldError message={errors.birthDate?.message} />
        </FieldWrap>

        {/* Sex */}
        <FieldWrap>
          <Label htmlFor="sex" className="text-sm font-semibold">
            Sex <span className="text-destructive">*</span>
          </Label>
          <Select
            defaultValue={form.getValues("sex")}
            onValueChange={(v) =>
              setValue("sex", v as "Female" | "Male" | "Not specified", {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger
              id="sex"
              className={cn(
                "h-11 rounded-2xl border-2 bg-white px-4 text-sm font-medium transition-all",
                "focus:ring-2 focus:ring-brand/50 focus:border-brand",
                errors.sex ? "border-destructive/60" : "border-input hover:border-brand/40",
              )}
            >
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Not specified">Not specified</SelectItem>
            </SelectContent>
          </Select>
          <FieldError message={errors.sex?.message} />
        </FieldWrap>
      </FieldGroup>

      {/* Address — full width */}
      <FieldWrap>
        <Label htmlFor="address" className="text-sm font-semibold">
          Home Address <span className="text-destructive">*</span>
        </Label>
        <StyledInput
          id="address"
          placeholder="Purok / Street, Barangay, City"
          error={!!errors.address}
          {...register("address")}
        />
        <FieldError message={errors.address?.message} />
      </FieldWrap>
    </div>
  );
}

function GuardianInfoPanel({ form }: Pick<FormProps, "form">) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-5">
      <FieldWrap>
        <Label htmlFor="guardianFullName" className="text-sm font-semibold">
          Guardian Full Name <span className="text-destructive">*</span>
        </Label>
        <StyledInput
          id="guardianFullName"
          placeholder="e.g. Maria Santos Reyes"
          error={!!errors.guardianFullName}
          {...register("guardianFullName")}
        />
        <FieldError message={errors.guardianFullName?.message} />
      </FieldWrap>

      <FieldGroup>
        <FieldWrap>
          <Label htmlFor="guardianRelationship" className="text-sm font-semibold">
            Relationship <span className="text-destructive">*</span>
          </Label>
          <StyledInput
            id="guardianRelationship"
            placeholder="e.g. Mother, Father, Lola"
            error={!!errors.guardianRelationship}
            {...register("guardianRelationship")}
          />
          <FieldError message={errors.guardianRelationship?.message} />
        </FieldWrap>

        <FieldWrap>
          <Label htmlFor="guardianContactNumber" className="text-sm font-semibold">
            Contact Number <span className="text-destructive">*</span>
          </Label>
          <StyledInput
            id="guardianContactNumber"
            type="tel"
            placeholder="e.g. 09171234567"
            error={!!errors.guardianContactNumber}
            {...register("guardianContactNumber")}
          />
          <FieldError message={errors.guardianContactNumber?.message} />
        </FieldWrap>
      </FieldGroup>
    </div>
  );
}

function EnrollmentDetailsPanel({ form }: Pick<FormProps, "form">) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <FieldGroup>
      <FieldWrap>
        <Label htmlFor="schoolYear" className="text-sm font-semibold">
          School Year <span className="text-destructive">*</span>
        </Label>
        <StyledInput
          id="schoolYear"
          placeholder="e.g. 2025-2026"
          error={!!errors.schoolYear}
          {...register("schoolYear")}
        />
        <FieldError message={errors.schoolYear?.message} />
      </FieldWrap>

      <FieldWrap>
        <Label htmlFor="enrollmentDate" className="text-sm font-semibold">
          Enrollment Date <span className="text-destructive">*</span>
        </Label>
        <StyledInput
          id="enrollmentDate"
          type="date"
          error={!!errors.enrollmentDate}
          {...register("enrollmentDate")}
        />
        <FieldError message={errors.enrollmentDate?.message} />
      </FieldWrap>
    </FieldGroup>
  );
}

// ---------------------------------------------------------------------------
// Tab navigation bar
// ---------------------------------------------------------------------------

function TabBar({
  activeTab,
  onTabChange,
  tabErrors,
}: {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  tabErrors: Record<Tab, boolean>;
}) {
  return (
    <div
      role="tablist"
      aria-label="Form sections"
      className="flex gap-1 rounded-3xl bg-muted/60 p-1.5"
    >
      {TABS.map(({ id, label, Icon, color }) => {
        const isActive = id === activeTab;
        const hasError = tabErrors[id];

        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${id}`}
            id={`tab-${id}`}
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
              "relative flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-bold transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
              isActive
                ? "bg-white shadow-md text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-white/50",
            )}
          >
            <Icon
              size={15}
              aria-hidden="true"
              className={isActive ? color : "text-muted-foreground"}
            />
            <span className="leading-tight text-center hidden sm:block">{label}</span>
            <span className="leading-tight text-center sm:hidden text-[10px]">
              {label.split(" ")[0]}
            </span>
            {hasError && (
              <span
                className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive"
                aria-label="Has validation errors"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export type StudentRecordFormProps = {
  /** Pre-populated values when editing an existing profile. */
  defaultValues?: EnrollmentProfile;
  /** Called with the raw form data; caller is responsible for save/update. */
  onSubmit: (data: FormValues) => void | Promise<void>;
  /** Disables inputs and submit while a save operation is in flight. */
  isSubmitting?: boolean;
  /** ID to exclude from duplicate detection (own ID when editing). */
  excludeId?: string;
};

// Re-export form values type for callers
export type { FormValues as StudentRecordFormValues };

export function StudentRecordForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  excludeId,
}: StudentRecordFormProps) {
  const shouldReduce = useReducedMotion();
  const [activeTab, setActiveTab] = useState<Tab>("child");
  const [duplicates, setDuplicates] = useState<EnrollmentProfile[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: makeDefaults(defaultValues),
    mode: "onTouched",
  });

  const {
    handleSubmit,
    formState: { errors },
  } = form;

  // Compute per-tab error indicators
  const tabErrors: Record<Tab, boolean> = {
    child: TAB_FIELDS.child.some((f) => !!errors[f]),
    guardian: TAB_FIELDS.guardian.some((f) => !!errors[f]),
    enrollment: TAB_FIELDS.enrollment.some((f) => !!errors[f]),
  };

  const handleDuplicatesChange = useCallback((matches: EnrollmentProfile[]) => {
    setDuplicates(matches);
  }, []);

  // Tab navigation helpers
  const tabIndex = TABS.findIndex((t) => t.id === activeTab);
  const canGoBack = tabIndex > 0;
  const canGoNext = tabIndex < TABS.length - 1;

  const handleNext = () => {
    if (canGoNext) setActiveTab(TABS[tabIndex + 1].id);
  };
  const handleBack = () => {
    if (canGoBack) setActiveTab(TABS[tabIndex - 1].id);
  };

  // Panel slide variants
  const panelVariants = {
    enter: (dir: number) => ({
      x: shouldReduce ? 0 : dir * 40,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: shouldReduce ? 0 : dir * -40,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(1);

  const goToTab = (next: Tab) => {
    const currIdx = TABS.findIndex((t) => t.id === activeTab);
    const nextIdx = TABS.findIndex((t) => t.id === next);
    setDirection(nextIdx > currIdx ? 1 : -1);
    setActiveTab(next);
  };

  const handleFormSubmit: SubmitHandler<FormValues> = async (data) => {
    await onSubmit(data);
  };

  return (
    <form
      id="student-record-form"
      onSubmit={handleSubmit(handleFormSubmit)}
      noValidate
      className="flex flex-col gap-6"
      aria-label="Student registration form"
    >
      {/* Tab navigation */}
      <TabBar activeTab={activeTab} onTabChange={goToTab} tabErrors={tabErrors} />

      {/* Animated tab panels */}
      <div className="relative min-h-[320px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeTab}
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            custom={direction}
            variants={panelVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="w-full"
          >
            {activeTab === "child" && (
              <ChildInfoPanel
                form={form}
                onDuplicatesChange={handleDuplicatesChange}
                duplicates={duplicates}
                excludeId={excludeId}
              />
            )}
            {activeTab === "guardian" && <GuardianInfoPanel form={form} />}
            {activeTab === "enrollment" && <EnrollmentDetailsPanel form={form} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer: prev / next / submit */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={!canGoBack || isSubmitting}
          className="rounded-2xl gap-1.5"
          id="form-prev-tab"
        >
          <ChevronLeft size={15} aria-hidden="true" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {/* Step dots */}
          {TABS.map((t, i) => (
            <span
              key={t.id}
              className={cn(
                "h-2 rounded-full transition-all duration-200",
                i === tabIndex ? "w-6 bg-brand" : "w-2 bg-muted-foreground/30",
              )}
              aria-hidden="true"
            />
          ))}
        </div>

        {canGoNext ? (
          <Button
            type="button"
            size="sm"
            onClick={handleNext}
            disabled={isSubmitting}
            className="rounded-2xl bg-brand hover:bg-brand/90 gap-1.5"
            id="form-next-tab"
          >
            Next
            <ChevronRight size={15} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="rounded-2xl bg-brand hover:bg-brand/90 gap-1.5 min-w-[110px]"
            id="form-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Save size={14} aria-hidden="true" />
                Save Record
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
