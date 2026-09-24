"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { BackgroundBlobs } from "@/components/background-blobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";
import { useRateEstimate } from "@/hooks/use-loans";
import { INDUSTRY_OPTIONS } from "@/lib/constants/industries";
import { cn } from "@/lib/utils";

/**
 * The public rate calculator.
 *
 * WHERE THE NUMBER COMES FROM
 * The browser does no pricing arithmetic. It posts the answers to
 * /loans/rate-estimate and renders what comes back, because the bank reference
 * rate and the internal-rating formula are internal pricing inputs and must
 * never reach a public page. That also means this page and the signup wizard
 * quote the same engine rather than two approximations of it.
 *
 * WHAT IT MAY SAY
 * A range, with its assumptions and a not-an-offer line. Anything here that
 * reads as a quote is a compliance defect, not a copy preference.
 */

/** Digits only. Accepts the separators a Vietnamese keyboard produces. */
function parseAmount(raw: string): number | null {
  const normalized = raw.trim().replace(/[.,\s]/g, "");
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Thousand separators, in the reader's convention: "400.000.000" in Vietnamese,
 * "400,000,000" in English.
 *
 * Grouped with a regex rather than `toLocaleString`, which would route through
 * a double. VND amounts run to 13 digits here and a pasted value could be
 * longer; regex grouping is exact at any length and never rounds a figure the
 * applicant typed.
 */
function groupDigits(digits: string, locale: string): string {
  const separator = locale === "vi" ? "." : ",";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

const digitsOnly = (raw: string) => raw.replace(/\D/g, "");

/**
 * A money field that formats as you type.
 *
 * State holds digits only; the separators exist just for reading. Formatting
 * on every keystroke would otherwise drop the caret to the end mid-edit — fine
 * while appending, maddening when correcting a digit in the middle — so the
 * caret is re-placed after the same NUMBER OF DIGITS it preceded, which is
 * stable across the separators shifting around it.
 */
function AmountInput({
  value,
  onChange,
  locale,
  placeholder,
  invalid,
  onBlur,
}: {
  value: string;
  onChange: (digits: string) => void;
  locale: string;
  placeholder?: string;
  invalid?: boolean;
  onBlur?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const caretDigits = useRef<number | null>(null);

  useEffect(() => {
    const input = ref.current;
    const target = caretDigits.current;
    if (!input || target === null) return;
    caretDigits.current = null;

    const formatted = input.value;
    let seen = 0;
    let position = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
      if (seen === target) {
        position = i;
        break;
      }
      if (/\d/.test(formatted[i])) seen += 1;
    }
    input.setSelectionRange(position, position);
  }, [value]);

  return (
    <Input
      ref={ref}
      inputMode="numeric"
      value={groupDigits(value, locale)}
      placeholder={placeholder}
      aria-invalid={invalid}
      onBlur={onBlur}
      onChange={(event) => {
        const caret = event.target.selectionStart ?? event.target.value.length;
        caretDigits.current = digitsOnly(
          event.target.value.slice(0, caret),
        ).length;
        onChange(digitsOnly(event.target.value));
      }}
    />
  );
}

const DURATIONS = [6, 12] as const;

// The engine's own bounds, restated so the visitor is told before a round
// trip. The server re-checks all of them -- this is convenience, not a
// security boundary.
const VND_MAX = 1_000_000_000_000;
const LOAN_MIN = 200_000_000;
const LOAN_MAX = 5_000_000_000;

type Values = Record<string, string>;
type Errors = Record<string, string>;

/**
 * Per-field validation, keyed by field name so each message renders under the
 * input that caused it.
 *
 * The costs-vs-revenue check is the reason this exists rather than leaving it
 * to the server: it is the most common way a figure set is unscoreable, and
 * the server can only answer "your costs exceed your revenue" about the whole
 * form. Caught here it lands under the cost fields, in the reader's language,
 * before anything is sent.
 */
function validate(v: Values, t: (key: string) => string): Errors {
  const errors: Errors = {};
  const num = (key: string) => parseAmount(v[key] ?? "");
  const e = (key: string) => `ratePage.error.${key}`;

  for (const key of [
    "operatingMonths",
    "employeeCount",
    "revenueLast",
    "revenuePrior",
    "cogs",
    "fixedCost",
    "loanAmount",
  ]) {
    if (!(v[key] ?? "").trim()) errors[key] = t(e("required"));
  }

  const months = num("operatingMonths");
  if (!errors.operatingMonths && (months === null || months < 1)) {
    errors.operatingMonths = t(e("operatingRange"));
  }

  const staff = num("employeeCount");
  if (!errors.employeeCount && (staff === null || staff < 1 || staff > 200)) {
    errors.employeeCount = t(e("employeeRange"));
  }

  for (const key of ["revenueLast", "revenuePrior", "cogs", "fixedCost"]) {
    if (errors[key]) continue;
    const value = num(key);
    if (value === null || value <= 0) errors[key] = t(e("mustBePositive"));
    else if (value > VND_MAX) errors[key] = t(e("tooLarge"));
  }

  const loan = num("loanAmount");
  if (
    !errors.loanAmount &&
    (loan === null || loan < LOAN_MIN || loan > LOAN_MAX)
  ) {
    errors.loanAmount = t(e("loanRange"));
  }

  // Costs against the revenue they were incurred against. Flagged on every
  // cost field, because any one of the three could be the mistyped one and
  // marking only the last would point at the wrong number.
  const revenue = num("revenueLast");
  const costs =
    (num("cogs") ?? 0) + (num("fixedCost") ?? 0) + (num("variableCost") ?? 0);
  if (
    revenue !== null &&
    revenue > 0 &&
    costs >= revenue &&
    !errors.cogs &&
    !errors.fixedCost
  ) {
    const message = t(e("costsExceedRevenue"));
    errors.cogs = message;
    errors.fixedCost = message;
    if ((v.variableCost ?? "").trim()) errors.variableCost = message;
  }

  const best = num("bestMonth");
  const worst = num("worstMonth");
  if (best !== null && revenue !== null && best > revenue) {
    errors.bestMonth = t(e("monthExceedsYear"));
  }
  if (worst !== null && revenue !== null && worst > revenue) {
    errors.worstMonth = t(e("monthExceedsYear"));
  }
  if (best !== null && worst !== null && worst > best && !errors.worstMonth) {
    errors.worstMonth = t(e("worstExceedsBest"));
  }

  for (const key of ["top1", "top3"]) {
    const value = num(key);
    if (value !== null && (value < 0 || value > 100)) {
      errors[key] = t(e("percentRange"));
    }
  }
  const one = num("top1");
  const three = num("top3");
  if (one !== null && three !== null && one > three && !errors.top1) {
    errors.top1 = t(e("top1ExceedsTop3"));
  }

  return errors;
}

export default function RateClient() {
  const { locale, t } = useTranslations();
  const estimate = useRateEstimate();

  const [industry, setIndustry] = useState("");
  const [operatingMonths, setOperatingMonths] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [revenueLast, setRevenueLast] = useState("");
  const [revenuePrior, setRevenuePrior] = useState("");
  const [cogs, setCogs] = useState("");
  const [fixedCost, setFixedCost] = useState("");
  const [variableCost, setVariableCost] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [duration, setDuration] = useState<number>(6);
  const [bestMonth, setBestMonth] = useState("");
  const [worstMonth, setWorstMonth] = useState("");
  const [top1, setTop1] = useState("");
  const [top3, setTop3] = useState("");

  // Which fields the visitor has left, plus whether they have tried to submit.
  // Errors stay hidden until one of those is true: flagging "required" on a
  // field nobody has reached yet is nagging, not help.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const values: Values = {
    industry,
    operatingMonths,
    employeeCount,
    revenueLast,
    revenuePrior,
    cogs,
    fixedCost,
    variableCost,
    loanAmount,
    bestMonth,
    worstMonth,
    top1,
    top3,
  };

  const errors = validate(values, t);
  const showError = (key: string) =>
    (submitAttempted || touched[key]) && errors[key] ? errors[key] : undefined;
  const industryError =
    (submitAttempted || touched.industry) && !industry.trim()
      ? t("ratePage.error.required")
      : undefined;

  const canSubmit = Object.keys(errors).length === 0 && !!industry.trim();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!canSubmit || estimate.isPending) return;
    estimate.mutate({
      industry,
      operating_months: Number(parseAmount(operatingMonths) ?? 0),
      employee_count: Number(parseAmount(employeeCount) ?? 0),
      revenue_last_12m: parseAmount(revenueLast) ?? 0,
      revenue_prior_12m: parseAmount(revenuePrior) ?? 0,
      cogs_y1: parseAmount(cogs) ?? 0,
      fixed_cost_y1: parseAmount(fixedCost) ?? 0,
      variable_cost_excl_cogs_y1: parseAmount(variableCost) ?? 0,
      loan_amount: parseAmount(loanAmount) ?? 0,
      duration_months: duration,
      revenue_best_month: parseAmount(bestMonth),
      revenue_worst_month: parseAmount(worstMonth),
      conc_top1_pct: parseAmount(top1),
      conc_top3_pct: parseAmount(top3),
    });
  };

  const numberFormat = locale === "vi" ? "vi-VN" : "en-US";
  const pct = (value: number) =>
    `${value.toLocaleString(numberFormat, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  // Whole numbers: the engine keeps full precision internally, but a 0-100
  // score shown to two decimals reads far more exact than a bracketed
  // estimate is.
  const score = (value: number) =>
    Math.round(value).toLocaleString(numberFormat);

  const data = estimate.data;

  const markTouched = (name: string) =>
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));

  const field = (
    name: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: {
      hint?: string;
      placeholder?: string;
      optional?: boolean;
      /** Money: group thousands as the visitor types. */
      amount?: boolean;
    } = {},
  ) => {
    const error = showError(name);
    return (
      <div className="space-y-1.5">
        <label className="flex items-baseline gap-2 text-sm font-medium text-foreground">
          {label}
          {!opts.optional && (
            <span className="text-xs text-destructive">*</span>
          )}
        </label>
        {opts.amount ? (
          <AmountInput
            value={value}
            onChange={onChange}
            locale={locale}
            placeholder={opts.placeholder}
            invalid={Boolean(error)}
            onBlur={() => markTouched(name)}
          />
        ) : (
          <Input
            inputMode="numeric"
            value={value}
            placeholder={opts.placeholder}
            aria-invalid={Boolean(error)}
            onBlur={() => markTouched(name)}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {/* The message sits under the field that caused it, not in a summary
          elsewhere on the page — at 3,000,000,000 vs 300,000,000 the whole
          question is WHICH number is wrong. */}
        {error ? (
          <p className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : (
          opts.hint && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {opts.hint}
            </p>
          )
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      <SiteHeader />
      <BackgroundBlobs variant="compact" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-10 space-y-3 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            {t("ratePage.title")}
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            {t("ratePage.subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* ---------------- Form ---------------- */}
          <form
            onSubmit={onSubmit}
            className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xs"
          >
            <div className="space-y-1">
              <h2 className="text-lg font-bold">{t("ratePage.formTitle")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("ratePage.formHint")}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-baseline gap-2 text-sm font-medium">
                {t("ratePage.industry")}
                <span className="text-xs text-destructive">*</span>
              </label>
              {/* The engine's own 15 industries, not a friendlier shortlist:
                  anything else would have to be mapped on the server, and a
                  silent mis-map prices the wrong sector. */}
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                onBlur={() => markTouched("industry")}
                aria-invalid={Boolean(industryError)}
                className={cn(
                  "h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  industryError ? "border-destructive" : "border-input",
                )}
              >
                <option value="">{t("ratePage.industryPlaceholder")}</option>
                {INDUSTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`projectApplication.industries.${option.labelKey}`)}
                  </option>
                ))}
              </select>
              {industryError && (
                <p className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive">
                  <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{industryError}</span>
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {field(
                "operatingMonths",
                t("ratePage.operatingMonths"),
                operatingMonths,
                setOperatingMonths,
                { hint: t("ratePage.operatingMonthsHint"), placeholder: "36" },
              )}
              {field(
                "employeeCount",
                t("ratePage.employeeCount"),
                employeeCount,
                setEmployeeCount,
                { hint: t("ratePage.employeeCountHint"), placeholder: "25" },
              )}
            </div>

            {field(
              "revenueLast",
              t("ratePage.revenueLast"),
              revenueLast,
              setRevenueLast,
              {
                amount: true,
                placeholder: "4000000000",
              },
            )}
            {field(
              "revenuePrior",
              t("ratePage.revenuePrior"),
              revenuePrior,
              setRevenuePrior,
              {
                amount: true,
                hint: t("ratePage.revenuePriorHint"),
                placeholder: "3200000000",
              },
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {field("cogs", t("ratePage.cogs"), cogs, setCogs, {
                amount: true,
                placeholder: "2400000000",
              })}
              {field(
                "fixedCost",
                t("ratePage.fixedCost"),
                fixedCost,
                setFixedCost,
                {
                  amount: true,
                  hint: t("ratePage.fixedCostHint"),
                  placeholder: "600000000",
                },
              )}
            </div>
            {field(
              "variableCost",
              t("ratePage.variableCost"),
              variableCost,
              setVariableCost,
              {
                amount: true,
                optional: true,
                placeholder: "300000000",
              },
            )}

            {field(
              "loanAmount",
              t("ratePage.loanAmount"),
              loanAmount,
              setLoanAmount,
              {
                amount: true,
                hint: t("ratePage.loanAmountHint"),
                placeholder: "800000000",
              },
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("ratePage.duration")}
                <span className="ml-2 text-xs text-destructive">*</span>
              </label>
              {/* 6 or 12 only. Twelve months is the maximum term; the platform
                  does not write longer. */}
              <div className="grid grid-cols-2 gap-2">
                {DURATIONS.map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setDuration(months)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                      duration === months
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {months === 6
                      ? t("ratePage.months6")
                      : t("ratePage.months12")}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold">
                  {t("ratePage.optionalTitle")}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("ratePage.optionalHint")}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {field(
                  "bestMonth",
                  t("ratePage.bestMonth"),
                  bestMonth,
                  setBestMonth,
                  {
                    amount: true,
                    optional: true,
                    placeholder: "480000000",
                  },
                )}
                {field(
                  "worstMonth",
                  t("ratePage.worstMonth"),
                  worstMonth,
                  setWorstMonth,
                  {
                    amount: true,
                    optional: true,
                    placeholder: "210000000",
                  },
                )}
                {field("top1", t("ratePage.top1"), top1, setTop1, {
                  optional: true,
                  placeholder: "18",
                })}
                {field("top3", t("ratePage.top3"), top3, setTop3, {
                  optional: true,
                  placeholder: "41",
                })}
              </div>
            </div>

            <Button type="submit" disabled={!canSubmit} className="w-full">
              {estimate.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {estimate.isPending
                ? t("ratePage.calculating")
                : t("ratePage.submit")}
            </Button>
          </form>

          {/* ---------------- Result ---------------- */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs lg:sticky lg:top-24">
            {!data && !estimate.isError && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t("ratePage.resultEmpty")}
              </p>
            )}

            {estimate.isError && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs leading-relaxed text-foreground">
                  {estimate.error?.message ?? t("ratePage.errorGeneric")}
                </p>
              </div>
            )}

            {data && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold">
                    {t("ratePage.resultTitle")}
                  </h2>
                  {data.provisional && (
                    <span className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      {t("ratePage.provisional")}
                    </span>
                  )}
                </div>

                {/* Both as ranges. The visitor's CIC score is unknown, so a
                    single figure would claim a precision this does not have. */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("ratePage.scoreLabel")}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-2xl font-bold tracking-tight">
                        {score(data.score_low)} – {score(data.score_high)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("ratePage.scoreOutOf")}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("ratePage.rateLabel")}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-2xl font-bold tracking-tight">
                        {pct(data.rate_low_pct)} – {pct(data.rate_high_pct)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("ratePage.perYear")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Read with the number, not below it. */}
                <p className="text-xs font-medium leading-relaxed text-foreground">
                  {t("ratePage.notAnOffer")}
                </p>

                <div className="space-y-1.5 border-t border-border/60 pt-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Info className="h-3 w-3" />
                    {t("ratePage.assumptionsTitle")}
                  </div>
                  <ul className="space-y-1">
                    {/* Translated by code. `assumptions` is the English
                        fallback for a code this build predates. */}
                    {data.assumption_codes.map((code, index) => {
                      const key = `ratePage.assumption.${code}`;
                      const translated = t(key);
                      const line =
                        translated === key
                          ? (data.assumptions[index] ?? code)
                          : translated;
                      return (
                        <li
                          key={code}
                          className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                          <span>{line}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-sm font-bold">{t("ratePage.ctaTitle")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t("ratePage.ctaBody")}
                  </p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/register">{t("ratePage.ctaButton")}</Link>
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
