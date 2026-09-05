"use client";

import React, { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  CalendarDays,
  Loader2,
  MapPin,
  Banknote,
  Send,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useForm, type Path } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRequireAuth } from "@/hooks/use-authentication";
import { useCreateProject, useMyProjects } from "@/hooks/use-projects";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "@/lib/i18n";
import { digitsOnly, formatAmountInput } from "@/lib/format-currency";
import { cn } from "@/lib/utils";
import {
  VN_PROVINCES,
  SUPPORTED_COUNTRIES,
  DEFAULT_COUNTRY,
} from "@/lib/vn-provinces";
import { INDUSTRY_OPTIONS } from "@/lib/constants/industries";
import {
  LOAN_DURATIONS_MONTHS,
  LOAN_MAX_VND,
  LOAN_MIN_VND,
} from "@/lib/constants/loan-constraints";
import {
  companySizeForHeadcount,
  MAX_EMPLOYEES,
  MIN_EMPLOYEES,
} from "@/lib/constants/company-size";

type ProjectApplicationValues = {
  legal_name: string;
  tax_id: string;
  industry: string;
  // Headcount, entered by the SME. `company_size` (micro/small/medium) is
  // derived from it for the grading engine, which does not take a count.
  employee_count: string;
  incorporation_date: string;
  address: {
    street: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
  loan: {
    requested_amount: string;
    // Loan term in months. Held as a string because it comes from a radio
    // group; coerced to a number in the submit payload.
    duration_months: string;
    purpose?: string;
    repayment_preference: string;
  };
};

const TOTAL_STEPS = 5;

export default function ProjectApplicationClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useTranslations();
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const shouldLoadProjects = !isAuthLoading && user?.role === "SME";
  const { data: projects = [], isLoading } = useMyProjects(shouldLoadProjects);
  const { mutate: createProject, isPending } = useCreateProject();

  const [currentStep, setCurrentStep] = useState(1);

  const projectApplicationSchema = z.object({
    legal_name: z
      .string()
      .trim()
      .min(2, t("projectApplication.validation.legalName")),
    tax_id: z.string().trim().min(3, t("projectApplication.validation.taxId")),
    industry: z
      .string()
      .trim()
      .min(2, t("projectApplication.validation.industry")),
    employee_count: z
      .string()
      .trim()
      .refine((value) => {
        const count = Number(value);
        return (
          Number.isInteger(count) &&
          count >= MIN_EMPLOYEES &&
          count <= MAX_EMPLOYEES
        );
      }, t("projectApplication.validation.employeeCount")),
    incorporation_date: z
      .string()
      .min(1, t("projectApplication.validation.incorporationDate")),
    address: z.object({
      street: z
        .string()
        .trim()
        .min(2, t("projectApplication.validation.street")),
      city: z.string().trim().min(2, t("projectApplication.validation.city")),
      state: z.string().trim().optional(),
      postal_code: z
        .string()
        .trim()
        .min(2, t("projectApplication.validation.postalCode")),
      country: z
        .string()
        .trim()
        .min(2, t("projectApplication.validation.country")),
    }),
    loan: z.object({
      // Engine bounds, not house style: loan_constraints in
      // grading_params_v1.yaml refuses anything outside 200M-5bn before it
      // scores, so catch it here rather than as a 500 at scoring time.
      requested_amount: z
        .string()
        .trim()
        .min(1, t("projectApplication.validation.requestedAmount"))
        .refine((value) => {
          const amount = Number(value);
          return amount >= LOAN_MIN_VND && amount <= LOAN_MAX_VND;
        }, t("projectApplication.validation.requestedAmountRange")),
      // The grading engine accepts only these four terms, so anything else is
      // rejected here rather than at scoring time.
      duration_months: z
        .string()
        .trim()
        .refine(
          (value) =>
            (LOAN_DURATIONS_MONTHS as readonly number[]).includes(
              Number(value),
            ),
          t("projectApplication.validation.durationMonths"),
        ),
      purpose: z.string().trim().optional(),
      repayment_preference: z
        .string()
        .trim()
        .min(1, t("projectApplication.validation.repaymentPreference")),
    }),
  });

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectApplicationValues>({
    resolver: zodResolver(projectApplicationSchema),
    defaultValues: {
      legal_name: "",
      tax_id: "",
      industry: "",
      employee_count: "",
      incorporation_date: "",
      address: {
        street: "",
        city: "",
        state: "",
        postal_code: "",
        country: DEFAULT_COUNTRY, // pre-selected while only one country is supported
      },
      loan: {
        requested_amount: "",
        duration_months: "",
        purpose: "",
        repayment_preference: "",
      },
    },
  });

  useEffect(() => {
    register("industry");
    register("loan.requested_amount");
    register("loan.duration_months");
    register("loan.repayment_preference");
    register("address.city");
    register("address.country");
  }, [register]);

  const selectedIndustry = watch("industry");
  const employeeCount = watch("employee_count");
  const derivedCompanySize = companySizeForHeadcount(Number(employeeCount));
  const requestedAmount = watch("loan.requested_amount");
  const selectedDuration = watch("loan.duration_months");
  const selectedRepayment = watch("loan.repayment_preference");
  const selectedCity = watch("address.city");
  const selectedCountry = watch("address.country");

  const repaymentOptions = [
    {
      value: "MONTHLY",
      label: t("projectApplication.repaymentOptions.monthly"),
    },
    {
      value: "QUARTERLY",
      label: t("projectApplication.repaymentOptions.quarterly"),
    },
    {
      value: "END_OF_TERM",
      label: t("projectApplication.repaymentOptions.endOfTerm"),
    },
  ];

  // `value` is the grading engine's own industry string and is submitted
  // verbatim — see lib/constants/industries.ts. Only the label is translated.
  const industries = INDUSTRY_OPTIONS.map((option) => ({
    value: option.value,
    label: t(`projectApplication.industries.${option.labelKey}`),
  }));

  useEffect(() => {
    if (isAuthLoading || !user) {
      return;
    }

    // This page is for SMEs only. Users who haven't picked a role yet go pick
    // one; investors (and anyone else) belong on the dashboard.
    if (!user.role) {
      router.replace("/select-role");
      return;
    }

    if (user.role !== "SME") {
      router.replace("/dashboard");
      return;
    }

    if (!isLoading && projects.length > 0) {
      router.replace("/dashboard");
    }
  }, [isAuthLoading, isLoading, projects.length, router, user]);

  const handleNextStep = async () => {
    let fieldsToValidate: Path<ProjectApplicationValues>[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ["legal_name", "tax_id", "industry", "employee_count"];
    } else if (currentStep === 2) {
      fieldsToValidate = [
        "address.street",
        "address.city",
        "address.state",
        "address.postal_code",
        "address.country",
      ];
    } else if (currentStep === 3) {
      fieldsToValidate = ["incorporation_date"];
    } else if (currentStep === 4) {
      fieldsToValidate = [
        "loan.requested_amount",
        "loan.duration_months",
        "loan.purpose",
        "loan.repayment_preference",
      ];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const onSubmit = (values: ProjectApplicationValues) => {
    const { loan, employee_count, ...project } = values;
    const headcount = Number(employee_count);
    const payload = {
      ...project,
      employee_count: headcount,
      // Derived rather than asked: the engine takes a band, not a count. The
      // zod refine above guarantees the headcount falls inside one.
      company_size: companySizeForHeadcount(headcount) ?? "micro",
      loan_application: {
        requested_amount: Number(loan.requested_amount),
        duration_months: Number(loan.duration_months),
        purpose: loan.purpose?.trim() || null,
        repayment_preference: loan.repayment_preference,
      },
    };

    createProject(payload, {
      onSuccess: () => {
        toast({
          title: t("projectApplication.toasts.submittedTitle"),
          description: t("projectApplication.toasts.submittedDescription"),
        });
        router.push("/dashboard");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: t("projectApplication.toasts.failedTitle"),
          description:
            error?.message || t("projectApplication.toasts.failedDescription"),
        });
      },
    });
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("projectApplication.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-[96rem] gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
      <div className="flex flex-col justify-center gap-6">
        <div className="flex justify-end lg:justify-start">
          <LocaleSwitcher />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {t("projectApplication.eyebrow")}
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            {t("projectApplication.title")}
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            {t("projectApplication.subtitle")}
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2">
          <InfoCard
            icon={<Building2 className="h-4 w-4" />}
            title={t("projectApplication.info.businessTitle")}
            text={t("projectApplication.info.businessText")}
            isActive={currentStep === 1}
          />
          <InfoCard
            icon={<MapPin className="h-4 w-4" />}
            title={t("projectApplication.info.locationTitle")}
            text={t("projectApplication.info.locationText")}
            isActive={currentStep === 2}
          />
          <InfoCard
            icon={<CalendarDays className="h-4 w-4" />}
            title={t("projectApplication.info.companyAgeTitle")}
            text={t("projectApplication.info.companyAgeText")}
            isActive={currentStep === 3}
          />
          <InfoCard
            icon={<Banknote className="h-4 w-4" />}
            title={t("projectApplication.info.loanTitle")}
            text={t("projectApplication.info.loanText")}
            isActive={currentStep === 4}
          />
        </div>
      </div>

      <div className="flex flex-col justify-between py-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {t("projectApplication.card.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("projectApplication.card.description")}
            </p>
          </div>

          {/* Multi-step progress stepper */}
          <div className="flex items-center justify-between px-1 mb-2">
            {[
              { id: 1, label: t("projectApplication.info.businessTitle") },
              { id: 2, label: t("projectApplication.info.locationTitle") },
              { id: 3, label: t("projectApplication.info.companyAgeTitle") },
              { id: 4, label: t("projectApplication.info.loanTitle") },
              { id: 5, label: t("projectApplication.info.reviewTitle") },
            ].map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                      currentStep === step.id
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-600/20 shadow-sm"
                        : currentStep > step.id
                          ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground border border-transparent",
                    )}
                  >
                    {step.id}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold hidden sm:inline transition-colors",
                      currentStep === step.id
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < 4 && (
                  <div
                    className={cn(
                      "flex-1 h-[2px] mx-2 transition-colors duration-300",
                      currentStep > step.id ? "bg-emerald-600" : "bg-muted",
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (currentStep === TOTAL_STEPS) {
                handleSubmit(onSubmit)(e);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const target = e.target as HTMLElement;
                if (target.tagName === "INPUT") {
                  e.preventDefault();
                  handleNextStep();
                }
              }
            }}
            className="space-y-5"
          >
            {/* Step 1: Business details */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <Field
                  label={t("projectApplication.fields.legalName")}
                  htmlFor="legalName"
                  error={errors.legal_name?.message}
                >
                  <Input
                    id="legalName"
                    placeholder={t("projectApplication.placeholders.legalName")}
                    {...register("legal_name")}
                    disabled={isPending}
                  />
                </Field>

                <Field
                  label={t("projectApplication.fields.taxId")}
                  htmlFor="taxId"
                  error={errors.tax_id?.message}
                >
                  <Input
                    id="taxId"
                    placeholder={t("projectApplication.placeholders.taxId")}
                    {...register("tax_id")}
                    disabled={isPending}
                  />
                </Field>

                <Field
                  label={t("projectApplication.fields.industry")}
                  htmlFor="industry"
                  error={errors.industry?.message}
                >
                  <Select
                    value={selectedIndustry}
                    onValueChange={(value) =>
                      setValue("industry", value, { shouldValidate: true })
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger id="industry" className="w-full">
                      <SelectValue
                        placeholder={t(
                          "projectApplication.placeholders.industry",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind.value} value={ind.value}>
                          {ind.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label={t("projectApplication.fields.employeeCount")}
                  htmlFor="employeeCount"
                  error={errors.employee_count?.message}
                >
                  <Input
                    id="employeeCount"
                    type="number"
                    inputMode="numeric"
                    min={MIN_EMPLOYEES}
                    max={MAX_EMPLOYEES}
                    step="1"
                    placeholder={t(
                      "projectApplication.placeholders.employeeCount",
                    )}
                    {...register("employee_count")}
                    disabled={isPending}
                  />
                  {derivedCompanySize ? (
                    <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {t("projectApplication.hints.companySizeDerived", {
                        size: t(
                          `projectApplication.companySizes.${derivedCompanySize}`,
                        ),
                      })}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("projectApplication.hints.employeeCount")}
                    </p>
                  )}
                </Field>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t("projectApplication.fields.street")}
                    htmlFor="street"
                    error={errors.address?.street?.message}
                  >
                    <Input
                      id="street"
                      placeholder={t("projectApplication.placeholders.street")}
                      {...register("address.street")}
                      disabled={isPending}
                    />
                  </Field>

                  <Field
                    label={t("projectApplication.fields.city")}
                    htmlFor="city"
                    error={errors.address?.city?.message}
                  >
                    <Select
                      value={selectedCity || undefined}
                      onValueChange={(value) =>
                        setValue("address.city", value, {
                          shouldValidate: true,
                        })
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger id="city" className="w-full">
                        <SelectValue
                          placeholder={t(
                            "projectApplication.placeholders.city",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {VN_PROVINCES.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t("projectApplication.fields.stateRegion")}
                    htmlFor="state"
                    error={errors.address?.state?.message}
                  >
                    <Input
                      id="state"
                      placeholder={t("projectApplication.placeholders.state")}
                      {...register("address.state")}
                      disabled={isPending}
                    />
                  </Field>

                  <Field
                    label={t("projectApplication.fields.postalCode")}
                    htmlFor="postalCode"
                    error={errors.address?.postal_code?.message}
                  >
                    <Input
                      id="postalCode"
                      placeholder={t(
                        "projectApplication.placeholders.postalCode",
                      )}
                      {...register("address.postal_code")}
                      disabled={isPending}
                    />
                  </Field>
                </div>

                <Field
                  label={t("projectApplication.fields.country")}
                  htmlFor="country"
                  error={errors.address?.country?.message}
                >
                  {/* Driven by SUPPORTED_COUNTRIES: locked while there's only
                      one option, and selectable once more are added there. */}
                  <Select
                    value={selectedCountry || undefined}
                    onValueChange={(value) =>
                      setValue("address.country", value, {
                        shouldValidate: true,
                      })
                    }
                    disabled={isPending || SUPPORTED_COUNTRIES.length <= 1}
                  >
                    <SelectTrigger id="country" className="w-full">
                      <SelectValue
                        placeholder={t(
                          "projectApplication.placeholders.country",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            {/* Step 3: Company age */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <Field
                  label={t("projectApplication.fields.incorporationDate")}
                  htmlFor="incorporationDate"
                  error={errors.incorporation_date?.message}
                >
                  <Input
                    id="incorporationDate"
                    type="date"
                    {...register("incorporation_date")}
                    disabled={isPending}
                  />
                </Field>
              </div>
            )}

            {/* Step 4: Loan request */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <Field
                  label={t("projectApplication.fields.requestedAmount")}
                  htmlFor="requestedAmount"
                  error={errors.loan?.requested_amount?.message}
                >
                  {/* Text, not number: a number input rejects the grouping
                      separators, so the field would show a bare 100000000.
                      Form state keeps the raw digits; only the display is
                      grouped. */}
                  <Input
                    id="requestedAmount"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={t(
                      "projectApplication.placeholders.requestedAmount",
                    )}
                    value={formatAmountInput(requestedAmount ?? "", locale)}
                    onChange={(event) =>
                      setValue(
                        "loan.requested_amount",
                        digitsOnly(event.target.value),
                        { shouldValidate: true },
                      )
                    }
                    disabled={isPending}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("projectApplication.hints.requestedAmountRange", {
                      min: formatAmountInput(String(LOAN_MIN_VND), locale),
                      max: formatAmountInput(String(LOAN_MAX_VND), locale),
                    })}
                  </p>
                </Field>

                <Field
                  label={t("projectApplication.fields.durationMonths")}
                  htmlFor="durationMonths"
                  error={errors.loan?.duration_months?.message}
                >
                  <div
                    id="durationMonths"
                    role="radiogroup"
                    aria-label={t("projectApplication.fields.durationMonths")}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                  >
                    {LOAN_DURATIONS_MONTHS.map((months) => {
                      const value = String(months);
                      const isSelected = selectedDuration === value;
                      return (
                        <button
                          key={months}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={isPending}
                          onClick={() =>
                            setValue("loan.duration_months", value, {
                              shouldValidate: true,
                            })
                          }
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {t("projectApplication.durationOptions.months", {
                            count: months,
                          })}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("projectApplication.hints.durationMonths")}
                  </p>
                </Field>

                <Field
                  label={t("projectApplication.fields.repaymentPreference")}
                  htmlFor="repaymentPreference"
                  error={errors.loan?.repayment_preference?.message}
                >
                  <Select
                    value={selectedRepayment}
                    onValueChange={(value) =>
                      setValue("loan.repayment_preference", value, {
                        shouldValidate: true,
                      })
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger id="repaymentPreference" className="w-full">
                      <SelectValue
                        placeholder={t(
                          "projectApplication.placeholders.repaymentPreference",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {repaymentOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label={t("projectApplication.fields.loanPurpose")}
                  htmlFor="loanPurpose"
                  error={errors.loan?.purpose?.message}
                >
                  <Textarea
                    id="loanPurpose"
                    rows={3}
                    placeholder={t(
                      "projectApplication.placeholders.loanPurpose",
                    )}
                    {...register("loan.purpose")}
                    disabled={isPending}
                  />
                </Field>
              </div>
            )}

            {/* Step 5: Review Summary */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-in fade-in duration-200 text-sm">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                    <Building2 className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <span>{t("projectApplication.info.businessTitle")}</span>
                  </h3>
                  <div className="grid grid-cols-[120px_1fr] gap-y-2 text-muted-foreground">
                    <span>{t("projectApplication.fields.legalName")}:</span>
                    <span className="text-foreground font-semibold">
                      {getValues("legal_name")}
                    </span>

                    <span>{t("projectApplication.fields.taxId")}:</span>
                    <span className="text-foreground font-semibold">
                      {getValues("tax_id")}
                    </span>

                    <span>{t("projectApplication.fields.industry")}:</span>
                    <span className="text-foreground font-semibold">
                      {getValues("industry")}
                    </span>

                    <span>{t("projectApplication.fields.employeeCount")}:</span>
                    <span className="text-foreground font-semibold">
                      {getValues("employee_count")}
                      {derivedCompanySize
                        ? ` · ${t(
                            `projectApplication.companySizes.${derivedCompanySize}`,
                          )}`
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                    <MapPin className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <span>{t("projectApplication.info.locationTitle")}</span>
                  </h3>
                  <div className="grid grid-cols-[120px_1fr] gap-y-2 text-muted-foreground">
                    <span>Address:</span>
                    <span className="text-foreground font-semibold leading-relaxed">
                      {getValues("address.street")}, {getValues("address.city")}
                      {getValues("address.state")
                        ? `, ${getValues("address.state")}`
                        : ""}
                      {`, ${getValues("address.postal_code")}`},{" "}
                      {getValues("address.country")}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                    <CalendarDays className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <span>{t("projectApplication.info.companyAgeTitle")}</span>
                  </h3>
                  <div className="grid grid-cols-[120px_1fr] gap-y-2 text-muted-foreground">
                    <span>
                      {t("projectApplication.fields.incorporationDate")}:
                    </span>
                    <span className="text-foreground font-semibold">
                      {getValues("incorporation_date")}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/50">
                    <Banknote className="h-4 w-4 text-emerald-600 animate-pulse" />
                    <span>{t("projectApplication.info.loanTitle")}</span>
                  </h3>
                  <div className="grid grid-cols-[120px_1fr] gap-y-2 text-muted-foreground">
                    <span>
                      {t("projectApplication.fields.requestedAmount")}:
                    </span>
                    <span className="text-foreground font-semibold">
                      {Number(
                        getValues("loan.requested_amount"),
                      ).toLocaleString(
                        locale === "vi" ? "vi-VN" : "en-US",
                      )}{" "}
                      VND
                    </span>

                    <span>
                      {t("projectApplication.fields.durationMonths")}:
                    </span>
                    <span className="text-foreground font-semibold">
                      {t("projectApplication.durationOptions.months", {
                        count: getValues("loan.duration_months"),
                      })}
                    </span>

                    <span>
                      {t("projectApplication.fields.repaymentPreference")}:
                    </span>
                    <span className="text-foreground font-semibold">
                      {repaymentOptions.find(
                        (option) =>
                          option.value ===
                          getValues("loan.repayment_preference"),
                      )?.label ?? getValues("loan.repayment_preference")}
                    </span>

                    {getValues("loan.purpose") ? (
                      <>
                        <span>
                          {t("projectApplication.fields.loanPurpose")}:
                        </span>
                        <span className="text-foreground font-semibold leading-relaxed">
                          {getValues("loan.purpose")}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation controls */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/60">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isPending}
                  className="h-11 px-6 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t("projectApplication.card.back")}</span>
                </Button>
              )}

              {currentStep < TOTAL_STEPS ? (
                <Button
                  key="next-btn"
                  type="button"
                  onClick={handleNextStep}
                  className="h-11 px-6 ml-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <span>{t("projectApplication.card.next")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  key="submit-btn"
                  type="submit"
                  className="h-11 px-6 ml-auto flex items-center gap-2"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("projectApplication.card.submitting")}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t("projectApplication.card.submit")}
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
  error?: string;
};

function Field({ label, htmlFor, children, error }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive mt-1">{error}</p> : null}
    </div>
  );
}

type InfoCardProps = {
  icon: ReactNode;
  title: string;
  text: string;
  isActive?: boolean;
};

function InfoCard({ icon, title, text, isActive }: InfoCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-background/80 p-4 shadow-sm backdrop-blur transition-all duration-300",
        isActive
          ? "border-emerald-600 ring-2 ring-emerald-600/10 shadow-emerald-500/5 translate-y-[-2px] scale-[1.01]"
          : "border-border/60",
      )}
    >
      <div
        className={cn(
          "mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300",
          isActive
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-primary/10 text-primary",
        )}
      >
        {icon}
      </div>
      <h2
        className={cn(
          "font-semibold text-sm transition-colors",
          isActive
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-foreground",
        )}
      >
        {title}
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
