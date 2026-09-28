"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Copy,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { BackgroundBlobs } from "@/components/background-blobs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { NumericInput } from "@/components/ui/numeric-input";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AmountInput, parseAmount } from "./amount-input";
import { InvestorPanel } from "./investor-panel";
import {
  ResultBurst,
  figureVariants,
  resultItemVariants,
  resultVariants,
} from "./result-motion";
import { formatCurrency, formatCompactCurrency } from "@/lib/format-currency";
import { useTranslations } from "@/lib/i18n";
import { useCalculateRate } from "@/hooks/use-rates";
import { useTurnstile } from "@/hooks/use-turnstile";
import { INDUSTRY_OPTIONS } from "@/lib/constants/industries";
import {
  LOAN_DURATIONS_MONTHS,
  LOAN_MAX_DURATION_MONTHS,
  LOAN_MIN_DURATION_MONTHS,
  LOAN_MAX_VND,
  LOAN_MIN_VND,
} from "@/lib/constants/loan-constraints";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/types";

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

/**
 * What the visitor reads when the estimate is refused.
 *
 * The engine declines figures it cannot score — costs at or above revenue, a
 * single year of revenue when growth is a scored factor — and its reason is
 * English prose written for a log. This page defaults to Vietnamese, so the
 * server also sends a stable `X-Error-Code`; the prose is the fallback for a
 * code this build has no copy for, which beats showing nothing.
 */
function errorCopy(
  error: (ApiError & { code?: string }) | null | undefined,
  t: (key: string) => string,
): string {
  if (error?.code) {
    const key = `ratePage.errorCode.${error.code}`;
    const copy = t(key);
    if (copy !== key) return copy;
  }
  return error?.message ?? t("ratePage.errorGeneric");
}

const DURATIONS = LOAN_DURATIONS_MONTHS;

// The engine's own bounds, checked here so the visitor is told before a round
// trip. The server re-checks all of them -- this is convenience, not a
// security boundary.
//
// The loan bounds come from the shared constants rather than being retyped: a
// second copy here is exactly how the form and the application wizard end up
// disagreeing about what the engine accepts.
const VND_MAX = 1_000_000_000_000;
const LOAN_MIN = LOAN_MIN_VND;
const LOAN_MAX = LOAN_MAX_VND;

type Values = Record<string, string>;
type Errors = Record<string, string>;

// Mirrors the backend's validate_contact_phone: 8-15 digits, with the
// separators people actually type. Same rule as the investor form.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\s.-]{8,20}$/;

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

  // Contact, so the team can follow up on the estimate. All required.
  if ((v.fullName ?? "").trim().length < 2) errors.fullName = t(e("fullName"));
  if ((v.companyName ?? "").trim().length < 2)
    errors.companyName = t(e("companyName"));
  const email = (v.email ?? "").trim();
  if (!email) errors.email = t(e("required"));
  else if (!EMAIL_RE.test(email)) errors.email = t(e("email"));
  const phone = (v.phone ?? "").trim();
  const digits = phone.replace(/\D/g, "").length;
  if (!phone) errors.phone = t(e("required"));
  else if (!PHONE_RE.test(phone) || digits < 8 || digits > 15)
    errors.phone = t(e("phone"));

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

function ResultSkeleton() {
  const bar = "bg-muted";
  return (
    <div aria-hidden className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className={cn("h-6 w-40", bar)} />
        <Skeleton className={cn("h-5 w-24", bar)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className={cn("h-3 w-24", bar)} />
            <Skeleton className={cn("h-8 w-32", bar)} />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Skeleton className={cn("h-3 w-full", bar)} />
        <Skeleton className={cn("h-3 w-4/5", bar)} />
      </div>

      <div className="space-y-2 border-t border-border/60 pt-3">
        <Skeleton className={cn("h-3 w-36", bar)} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className={cn("h-3 w-full", bar)} />
        ))}
      </div>
    </div>
  );
}

/** Clearance for the sticky site header, so a scrolled-to panel does not tuck
 *  its own heading underneath it. */
function getClientSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.sessionStorage.getItem("fundlok_rate_session");
    if (!id) {
      id =
        "sess_" +
        Math.random().toString(36).substring(2, 10) +
        "_" +
        Date.now().toString(36);
      window.sessionStorage.setItem("fundlok_rate_session", id);
    }
    return id;
  } catch {
    return "";
  }
}

const HEADER_CLEARANCE_PX = 88;

type Audience = "sme" | "investor";

export default function RateClient({
  initialAudience = "sme",
}: {
  initialAudience?: Audience;
}) {
  const [audience, setAudience] = useState<Audience>(initialAudience);
  // Mounted on first visit, then kept (hidden) so switching back and forth
  // keeps what the visitor typed, the lead, and the live estimate.
  const [investorMounted, setInvestorMounted] = useState(
    initialAudience === "investor",
  );
  const switchAudience = (next: Audience) => {
    setAudience(next);
    if (next === "investor") setInvestorMounted(true);
    // Shareable and back-button friendly without a navigation: the tab is
    // presentation state, so replaceState rather than a router push.
    const url = new URL(window.location.href);
    if (next === "investor") url.searchParams.set("for", "investor");
    else url.searchParams.delete("for");
    window.history.replaceState(null, "", url);
  };

  const { locale, t } = useTranslations();
  const estimate = useCalculateRate();
  const [copiedId, setCopiedId] = useState(false);
  const reduceMotion = useReducedMotion();
  const resultRef = useRef<HTMLDivElement>(null);

  const copyInquiryId = (id: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

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
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // Decree 13/2023: storing an email and phone needs the visitor's consent,
  // and the backend refuses the request without it.
  const [consent, setConsent] = useState(false);

  // Cloudflare Turnstile. /rates/calculate is public, unauthenticated, and
  // inserts a rate_inquiries row per call, so without this the form is an open
  // write endpoint with a UI attached. The token is single-use — Cloudflare
  // rejects a replay with `timeout-or-duplicate` — so the widget is reset after
  // every attempt, not just the successful ones.
  const {
    turnstileToken,
    turnstileContainerRef,
    reset: resetTurnstile,
  } = useTurnstile();

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
    fullName,
    companyName,
    email,
    phone,
  };

  const errors = validate(values, t);
  const consentError =
    (submitAttempted || touched.consent) && !consent
      ? t("ratePage.error.consent")
      : undefined;
  const showError = (key: string) =>
    (submitAttempted || touched[key]) && errors[key] ? errors[key] : undefined;
  const industryError =
    (submitAttempted || touched.industry) && !industry.trim()
      ? t("ratePage.error.required")
      : undefined;

  const canSubmit =
    Object.keys(errors).length === 0 &&
    !!industry.trim() &&
    consent &&
    !!turnstileToken;

  // Brings the result panel into view once a band (or an error) has rendered —
  // the mobile case, where the panel sits a full screen below the button that
  // produced it.
  //
  // An effect, not the mutation's `onSuccess`. onSuccess runs BEFORE React
  // re-renders, so measuring there sizes the panel in its short empty state,
  // which fits on screen and makes the scroll look unnecessary; on mobile that
  // silently did nothing at all. An effect runs after the DOM is committed, so
  // the measurement is of the panel the visitor is about to see. Deferring to
  // requestAnimationFrame would fix the measurement too, but rAF is throttled
  // whenever the tab is not painting and the scroll would then never happen.
  //
  // `settledAt` changes once per calculation, so this fires once per press and
  // not on every keystroke.
  const settledAt = estimate.isPending ? null : estimate.submittedAt || null;

  useEffect(() => {
    if (!settledAt) return;
    const el = resultRef.current;
    if (!el) return;

    // The test is on the panel's TOP, not on whether the whole panel fits: the
    // top is where the heading and the two figures are, and a filled panel is
    // routinely taller than a laptop viewport. Requiring it to fit entirely
    // would scroll on desktop too, where the two columns already sit side by
    // side and any movement is a jolt for no gain.
    const top = el.getBoundingClientRect().top;
    const comfortablyInView =
      top >= HEADER_CLEARANCE_PX && top <= window.innerHeight * 0.5;
    if (comfortablyInView) return;

    window.scrollTo({
      top: top + window.scrollY - HEADER_CLEARANCE_PX,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [settledAt, reduceMotion]);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!canSubmit || estimate.isPending) return;
    estimate.mutate({
      industry,
      operating_months: Number(parseAmount(operatingMonths) ?? 0),
      employee_count: Number(parseAmount(employeeCount) ?? 0),
      revenue_l12m: parseAmount(revenueLast) ?? 0,
      revenue_prev_12m: parseAmount(revenuePrior) ?? 0,
      cogs_l12m: parseAmount(cogs) ?? 0,
      fixed_costs_l12m: parseAmount(fixedCost) ?? 0,
      variable_costs_l12m: parseAmount(variableCost) ?? 0,
      requested_amount: parseAmount(loanAmount) ?? 0,
      tenor_months: duration,
      seasonality: {
        peak_month_revenue: parseAmount(bestMonth),
        lowest_month_revenue: parseAmount(worstMonth),
        top_1_customer_share: parseAmount(top1),
        top_3_customer_share: parseAmount(top3),
      },
      full_name: fullName.trim(),
      company_name: companyName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      consent_contact: true,
      session_id: getClientSessionId(),
      turnstile_token: turnstileToken,
    });
    // A Turnstile token is single-use whatever the server does with it, so the
    // widget is reset on every attempt. Resetting only on success would leave a
    // spent token in state after a 422, and the retry would fail the captcha
    // rather than the validation the visitor was actually trying to fix.
    resetTurnstile();
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
          <NumericInput
            value={value}
            placeholder={opts.placeholder}
            aria-invalid={Boolean(error)}
            onBlur={() => markTouched(name)}
            onValueChange={onChange}
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
    <div className="relative min-h-[100dvh] w-full bg-background text-foreground overflow-x-clip">
      <SiteHeader />
      <BackgroundBlobs variant="compact" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        {/* Entrance motion matches the other public pages (see faq-client):
            the hero drops in, then the two panels rise with a short cascade so
            the eye lands on the form first. The panels animate individually
            rather than under a shared parent — a transformed ancestor would
            become the containing block for the result card's `lg:sticky` and
            silently kill it. */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-10 space-y-3 text-center"
        >
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            {t("ratePage.title")}
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            {audience === "investor"
              ? t("ratePage.investor.subtitle")
              : t("ratePage.subtitle")}
          </p>
        </motion.div>

        {/* Who is this for. Large and first on purpose: the two panels answer
            different questions, and a visitor on the wrong one reads a
            borrowing form as an investment page. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
          className="mx-auto mb-10 max-w-md space-y-2"
        >
          <p
            id="rate-audience-label"
            className="text-center text-xs font-medium text-muted-foreground"
          >
            {t("ratePage.audience.label")}
          </p>
          <div
            role="tablist"
            aria-labelledby="rate-audience-label"
            className="grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-card p-1.5 shadow-xs"
          >
            {(["sme", "investor"] as const).map((option) => {
              const active = audience === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  id={`rate-tab-${option}`}
                  aria-selected={active}
                  aria-controls={`rate-panel-${option}`}
                  onClick={() => switchAudience(option)}
                  className={cn(
                    "rounded-lg px-4 py-3 text-left transition-colors active:scale-[0.98]",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-muted/60",
                  )}
                >
                  <span className="block text-sm font-bold">
                    {t(`ratePage.audience.${option}`)}
                  </span>
                  <span
                    className={cn(
                      "block text-xs",
                      active
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {t(`ratePage.audience.${option}Hint`)}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {investorMounted && (
          <div
            id="rate-panel-investor"
            role="tabpanel"
            aria-labelledby="rate-tab-investor"
            hidden={audience !== "investor"}
          >
            <InvestorPanel getSessionId={getClientSessionId} />
          </div>
        )}

        {/* Hidden rather than unmounted: its Turnstile widget renders once, on
            mount, and the visitor's figures should survive a tab switch. A
            plain wrapper, not a motion one, so `lg:sticky` inside still works. */}
        <div
          id="rate-panel-sme"
          role="tabpanel"
          aria-labelledby="rate-tab-sme"
          hidden={audience !== "sme"}
        >
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            {/* ---------------- Form ---------------- */}
            <motion.form
              onSubmit={onSubmit}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xs"
            >
              <div className="space-y-1">
                <h2 className="text-lg font-bold">{t("ratePage.formTitle")}</h2>
                <p className="text-xs text-muted-foreground">
                  {t("ratePage.formHint")}
                </p>
              </div>

              {/* Contact, so the team can follow up on the estimate. Same
                  fields and rule as the investor form. */}
              <fieldset className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
                <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("ratePage.contactLabel")}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="sme-name" className="text-sm font-medium">
                      {t("ratePage.fullName")}{" "}
                      <span className="text-xs text-destructive">*</span>
                    </label>
                    <Input
                      id="sme-name"
                      autoComplete="name"
                      maxLength={120}
                      value={fullName}
                      placeholder={t("ratePage.fullNamePlaceholder")}
                      aria-invalid={Boolean(showError("fullName"))}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => markTouched("fullName")}
                    />
                    {showError("fullName") && (
                      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{showError("fullName")}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="sme-company"
                      className="text-sm font-medium"
                    >
                      {t("ratePage.companyName")}{" "}
                      <span className="text-xs text-destructive">*</span>
                    </label>
                    <Input
                      id="sme-company"
                      autoComplete="organization"
                      maxLength={200}
                      value={companyName}
                      placeholder={t("ratePage.companyNamePlaceholder")}
                      aria-invalid={Boolean(showError("companyName"))}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onBlur={() => markTouched("companyName")}
                    />
                    {showError("companyName") && (
                      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{showError("companyName")}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="sme-email" className="text-sm font-medium">
                      {t("ratePage.email")}{" "}
                      <span className="text-xs text-destructive">*</span>
                    </label>
                    <Input
                      id="sme-email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      value={email}
                      placeholder={t("ratePage.emailPlaceholder")}
                      aria-invalid={Boolean(showError("email"))}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => markTouched("email")}
                    />
                    {showError("email") && (
                      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{showError("email")}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="sme-phone" className="text-sm font-medium">
                      {t("ratePage.phone")}{" "}
                      <span className="text-xs text-destructive">*</span>
                    </label>
                    <Input
                      id="sme-phone"
                      type="tel"
                      autoComplete="tel"
                      maxLength={20}
                      value={phone}
                      placeholder="09xx xxx xxx"
                      aria-invalid={Boolean(showError("phone"))}
                      onChange={(e) => setPhone(e.target.value)}
                      onBlur={() => markTouched("phone")}
                    />
                    {showError("phone") && (
                      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{showError("phone")}</span>
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>

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
                  {
                    hint: t("ratePage.operatingMonthsHint"),
                    placeholder: "36",
                  },
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
                (val) => {
                  const num = Number(val);
                  if (num > LOAN_MAX) {
                    setLoanAmount(String(LOAN_MAX));
                  } else {
                    setLoanAmount(val);
                  }
                },
                {
                  amount: true,
                  hint: t("ratePage.loanAmountHint"),
                  placeholder: "800000000",
                },
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {t("ratePage.duration")}
                    <span className="ml-2 text-xs text-destructive">*</span>
                  </label>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {duration} {locale === "vi" ? "tháng" : "months"}
                  </span>
                </div>
                <Slider
                  id="rateDurationSlider"
                  aria-label={t("ratePage.duration")}
                  min={LOAN_MIN_DURATION_MONTHS}
                  max={LOAN_MAX_DURATION_MONTHS}
                  step={1}
                  value={[duration]}
                  onValueChange={(val) => setDuration(val[0])}
                  className="py-2 cursor-pointer"
                />
                {/* 1 to 6 months: matches LOAN_DURATIONS_MONTHS. */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DURATIONS.map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setDuration(months)}
                      className={cn(
                        "rounded-md border px-2 py-2 text-sm font-semibold transition-colors cursor-pointer",
                        duration === months
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {months} {locale === "vi" ? "tháng" : "mo"}
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

              <div className="space-y-1.5">
                <label className="flex cursor-pointer items-start gap-2 text-sm leading-relaxed">
                  <Checkbox
                    id="sme-consent"
                    className="mt-0.5"
                    checked={consent}
                    aria-invalid={Boolean(consentError)}
                    onCheckedChange={(value) => {
                      setConsent(value === true);
                      markTouched("consent");
                    }}
                  />
                  <span>{t("ratePage.consent")}</span>
                </label>
                {consentError && (
                  <p className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive">
                    <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>{consentError}</span>
                  </p>
                )}
              </div>

              {process.env.NEXT_PUBLIC_DISABLE_TURNSTILE !== "true" && (
                <div className="flex justify-center">
                  <div ref={turnstileContainerRef} />
                </div>
              )}

              <Button
                type="submit"
                disabled={!canSubmit || estimate.isPending}
                className="w-full"
              >
                {estimate.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {estimate.isPending
                  ? t("ratePage.calculating")
                  : t("ratePage.submit")}
              </Button>
            </motion.form>

            {/* ---------------- Result ---------------- */}
            <motion.div
              ref={resultRef}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: "easeOut" }}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs lg:sticky lg:top-24"
            >
              {estimate.isPending && <ResultSkeleton />}

              {!estimate.isPending && !data && !estimate.isError && (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  {t("ratePage.resultEmpty")}
                </p>
              )}

              {!estimate.isPending && estimate.isError && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs leading-relaxed text-foreground">
                    {errorCopy(estimate.error, t)}
                  </p>
                </div>
              )}

              {/* A SIBLING of the staggered panel below, not a child of it: the
                burst is chrome, and inside that container it would be dealt a
                turn in the content stagger. Keyed separately so it replays per
                calculation. */}
              {data && !reduceMotion && (
                <ResultBurst key={`burst-${estimate.submittedAt}`} />
              )}

              {data && (
                <motion.div
                  // Keyed on the mutation's own timestamp so a recalculation
                  // replays the reveal. Without it React reuses the subtree and
                  // a visitor who tweaks a figure watches a new band appear with
                  // no acknowledgement that anything happened.
                  key={estimate.submittedAt}
                  variants={resultVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative z-10 space-y-5"
                >
                  <motion.div
                    variants={resultItemVariants}
                    className="flex items-start justify-between gap-3"
                  >
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                      <motion.span
                        variants={figureVariants}
                        className="inline-flex"
                        aria-hidden
                      >
                        <Sparkles className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                      </motion.span>
                      {t("ratePage.resultTitle")}
                    </h2>
                    {data.data?.risk_profile?.tier && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                          data.data.risk_profile.tier === "TIER_A"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : data.data.risk_profile.tier === "TIER_B"
                              ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
                        )}
                      >
                        {data.data.risk_profile.tier === "TIER_A"
                          ? `Tier A • ${t("ratePage.tierExcellent")}`
                          : data.data.risk_profile.tier === "TIER_B"
                            ? `Tier B • ${t("ratePage.tierGood")}`
                            : `Tier C • ${t("ratePage.tierReview")}`}
                      </span>
                    )}
                  </motion.div>

                  {/* 2 Primary Figure Cards */}
                  <motion.div
                    variants={resultItemVariants}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    {/* Monthly Rate & APR */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("ratePage.monthlyRateLabel")}
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <motion.span
                          variants={figureVariants}
                          className="origin-left font-mono text-2xl font-bold tracking-tight text-primary"
                        >
                          {data.data.rate_range.min_rate_monthly}% –{" "}
                          {data.data.rate_range.max_rate_monthly}%
                        </motion.span>
                        <span className="text-xs text-muted-foreground">
                          / {t("ratePage.months")}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground pt-1">
                        {t("ratePage.aprLabel")}: {data.data.rate_range.apr_min}
                        % – {data.data.rate_range.apr_max}%
                      </p>
                    </div>

                    {/* Monthly Payment */}
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("ratePage.monthlyPaymentLabel")}
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <motion.span
                          variants={figureVariants}
                          className="origin-left font-mono text-xl font-bold tracking-tight text-foreground"
                        >
                          {formatCompactCurrency(
                            data.data.estimated_monthly_payment.min,
                            locale,
                          )}{" "}
                          –{" "}
                          {formatCompactCurrency(
                            data.data.estimated_monthly_payment.max,
                            locale,
                          )}
                        </motion.span>
                        <span className="text-xs text-muted-foreground">
                          / {t("ratePage.months")}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground pt-1">
                        {formatCurrency(
                          data.data.estimated_monthly_payment.min,
                          locale,
                        )}{" "}
                        –{" "}
                        {formatCurrency(
                          data.data.estimated_monthly_payment.max,
                          locale,
                        )}
                      </p>
                    </div>
                  </motion.div>

                  {/* Risk Profile Details */}
                  <motion.div
                    variants={resultItemVariants}
                    className="space-y-2.5 rounded-xl border border-border/80 bg-muted/10 p-4"
                  >
                    <p className="text-xs font-bold text-foreground">
                      {t("ratePage.riskProfileTitle")}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border bg-background/50 p-2">
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {t("ratePage.growthLabel")}
                        </span>
                        <span
                          className={cn(
                            "font-mono text-xs font-bold",
                            data.data.risk_profile.growth_rate_pct >= 0
                              ? "text-emerald-500"
                              : "text-rose-500",
                          )}
                        >
                          {data.data.risk_profile.growth_rate_pct >= 0
                            ? "+"
                            : ""}
                          {data.data.risk_profile.growth_rate_pct}%
                        </span>
                      </div>

                      <div className="rounded-lg border bg-background/50 p-2">
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {t("ratePage.ebitdaLabel")}
                        </span>
                        <span className="font-mono text-xs font-bold text-foreground">
                          {data.data.risk_profile.ebitda_margin_pct}%
                        </span>
                      </div>

                      <div className="rounded-lg border bg-background/50 p-2">
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {t("ratePage.debtToRevenueLabel")}
                        </span>
                        <span className="font-mono text-xs font-bold text-foreground">
                          {data.data.risk_profile.debt_to_revenue_pct}%
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground pt-1">
                      {data.data.risk_profile.is_operating_loss
                        ? t("ratePage.operatingLossNotice")
                        : t("ratePage.operatingProfitNotice")}
                    </p>
                  </motion.div>

                  {/* Inquiry Reference Code */}
                  {data.inquiry_id && (
                    <motion.div
                      variants={resultItemVariants}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs"
                    >
                      <span className="text-muted-foreground">
                        {t("ratePage.inquiryIdLabel")}:
                      </span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-semibold text-foreground">
                          {data.inquiry_id.slice(0, 8)}...
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInquiryId(data.inquiry_id)}
                          className="h-6 w-6 p-0"
                        >
                          {copiedId ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Read with the number, not below it. */}
                  <motion.p
                    variants={resultItemVariants}
                    className="text-xs font-medium leading-relaxed text-muted-foreground"
                  >
                    {t("ratePage.notAnOffer")}
                  </motion.p>

                  {/* What the engine took on faith. It brackets an unknown
                    credit-bureau score and assumes identity checks pass, so a
                    band shown without these reads as a quote when it is an
                    estimate. Rendered from codes rather than the server's
                    English prose so a Vietnamese visitor gets Vietnamese. */}
                  {data.data.assumption_codes?.length > 0 && (
                    <motion.div
                      variants={resultItemVariants}
                      className="space-y-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("ratePage.assumptionsTitle")}
                      </p>
                      <ul className="space-y-1.5">
                        {data.data.assumption_codes.map((code) => {
                          const key = `ratePage.assumption.${code}`;
                          const copy = t(key);
                          // An unrecognised code would otherwise print its own
                          // lookup key on a public page.
                          if (copy === key) return null;
                          return (
                            <li
                              key={code}
                              className="flex gap-1.5 text-[11px] leading-relaxed text-muted-foreground"
                            >
                              <span
                                aria-hidden
                                className="text-muted-foreground/60"
                              >
                                •
                              </span>
                              <span>{copy}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  )}

                  {/* Call to action */}
                  <motion.div
                    variants={resultItemVariants}
                    className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2"
                  >
                    <p className="text-sm font-bold text-foreground">
                      {t("ratePage.ctaTitle")}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t("ratePage.ctaBody")}
                    </p>
                    <Button asChild size="sm" className="mt-2 w-full sm:w-auto">
                      <Link href="/project-application">
                        {t("ratePage.applyLoanButton")}
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
