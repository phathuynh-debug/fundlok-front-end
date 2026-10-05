"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format-currency";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  rateKeys,
  useCreateInvestorLead,
  useInvestorEstimate,
  useInvestorSignup,
  useInvestorTiers,
} from "@/hooks/use-rates";
import { useTurnstile } from "@/hooks/use-turnstile";
import type {
  InvestorCadence,
  InvestorChoices,
  InvestorCommitment,
  InvestorEstimate,
  InvestorRiskTier,
} from "@/services/rates.service";
import { AmountInput, parseAmount } from "./amount-input";
import {
  ResultBurst,
  figureVariants,
  resultItemVariants,
  resultVariants,
} from "./result-motion";

/**
 * The investor tab of /rate. Ported from FundLok_LaiSuat_Page_Prototype.html
 * (rev 6), with one structural change: the prototype priced the yield in the
 * browser from the bank reference rate and the tier ratings. Both are internal
 * and must never ship to a public page, so every number here comes from
 * /api/v1/rates/investor/* and this file does no pricing arithmetic.
 *
 * FLOW
 *   gate -> details + choices -> Calculate (stores the lead, shows the yield)
 *   -> yield stays live as choices change -> optional Sign up.
 * The yield is gated on the SERVER too: the live estimate endpoint needs a lead
 * id, so skipping the form in devtools does not reveal it.
 *
 * COMPLIANCE
 * Investor solicitation stays low-key (Điều 3.3 posture): illustration-only
 * gate, no "guaranteed" language, the disclaimer read with the number, and
 * one-to-one follow-up rather than a self-serve signup.
 */

const TIERS: InvestorRiskTier[] = ["conservative", "balanced", "growth"];
const CADENCES: InvestorCadence[] = [
  "none",
  "quarterly",
  "monthly",
  "weekly",
  "daily",
];
const COMMITMENTS: InvestorCommitment[] = [6, 12];

// Mirrors INVESTOR_AMOUNT_MIN_VND / _MAX_VND in the backend's schemas.
const AMOUNT_MIN = 1_000_000;
const AMOUNT_MAX = 1_000_000_000_000;

const GATE_KEY = "fundlok_investor_gate_ack";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\s.-]{8,20}$/;

function readGateAck(): boolean {
  try {
    return window.sessionStorage.getItem(GATE_KEY) === "1";
  } catch {
    return false;
  }
}

// sessionStorage fires no event within the tab that wrote it, and the value
// only changes through this component's own button, so nothing to subscribe to.
function noopSubscribe() {
  return () => {};
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

type Errors = Partial<
  Record<"name" | "email" | "phone" | "amount" | "consent", string>
>;

export function InvestorPanel({
  getSessionId,
}: {
  /** Read at submit time, not render, since it may write sessionStorage. */
  getSessionId: () => string;
}) {
  const { t } = useTranslations();
  // An earlier acknowledgement this session, read as an external store: the
  // server snapshot is `false` (no sessionStorage during SSR), so hydration
  // matches the server HTML and the stored value applies right after.
  const acknowledgedEarlier = useSyncExternalStore(
    noopSubscribe,
    readGateAck,
    () => false,
  );
  const [acceptedNow, setAcceptedNow] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);

  if (acknowledgedEarlier || acceptedNow)
    return <InvestorCalculator getSessionId={getSessionId} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto max-w-xl space-y-5 rounded-2xl border border-border bg-card p-8 text-center shadow-xs"
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted/40">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-bold">{t("ratePage.investor.gateTitle")}</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t("ratePage.investor.gateBody")}
      </p>
      <label className="flex cursor-pointer items-center justify-center gap-2 text-sm">
        <Checkbox
          checked={gateChecked}
          onCheckedChange={(value) => setGateChecked(value === true)}
        />
        <span>{t("ratePage.investor.gateCheckbox")}</span>
      </label>
      <Button
        type="button"
        className="w-full"
        disabled={!gateChecked}
        onClick={() => {
          try {
            window.sessionStorage.setItem(GATE_KEY, "1");
          } catch {
            // Storage blocked: the gate simply shows again next visit.
          }
          setAcceptedNow(true);
        }}
      >
        {t("ratePage.investor.gateContinue")}
      </Button>
    </motion.div>
  );
}

/**
 * Its own component, mounted only once the gate is passed, because
 * `useTurnstile` renders its widget into the container ONCE, on mount. Mounted
 * behind the gate, the container would not exist yet, the widget would never
 * draw, and Calculate would stay disabled for good in any environment with a
 * captcha configured.
 */
function InvestorCalculator({ getSessionId }: { getSessionId: () => string }) {
  const { t, locale } = useTranslations();
  const reduceMotion = useReducedMotion();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("1000000000");
  const [commitment, setCommitment] = useState<InvestorCommitment>(12);
  const [tier, setTier] = useState<InvestorRiskTier>("balanced");
  const [cadence, setCadence] = useState<InvestorCadence>("monthly");
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const queryClient = useQueryClient();
  const tiers = useInvestorTiers();
  const createLead = useCreateInvestorLead();
  const signup = useInvestorSignup();
  const {
    turnstileToken,
    turnstileContainerRef,
    reset: resetTurnstile,
  } = useTurnstile();

  const lead = createLead.data ?? null;

  const amountValue = parseAmount(amount);
  const errors: Errors = {};
  if (name.trim().length < 2) errors.name = t("ratePage.investor.error.name");
  if (!EMAIL_RE.test(email.trim()))
    errors.email = t("ratePage.investor.error.email");
  // Required: the team follows up by phone, on both rate-page forms.
  {
    const digits = phone.replace(/\D/g, "").length;
    if (!PHONE_RE.test(phone.trim()) || digits < 8 || digits > 15)
      errors.phone = t("ratePage.investor.error.phone");
  }
  if (amountValue === null || amountValue < AMOUNT_MIN)
    errors.amount = t("ratePage.investor.error.amountMin");
  else if (amountValue > AMOUNT_MAX)
    errors.amount = t("ratePage.investor.error.amountMax");
  if (!consent) errors.consent = t("ratePage.investor.error.consent");

  const show = (key: keyof Errors) =>
    (submitAttempted || touched[key]) && errors[key] ? errors[key] : undefined;
  const markTouched = (key: string) =>
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  const choices: InvestorChoices | null = useMemo(
    () =>
      amountValue !== null &&
      amountValue >= AMOUNT_MIN &&
      amountValue <= AMOUNT_MAX
        ? {
            amount_vnd: amountValue,
            commitment_months: commitment,
            risk_tier: tier,
            reinvestment_cadence: cadence,
          }
        : null,
    [amountValue, commitment, tier, cadence],
  );
  // Typing an amount would otherwise fire a request per keystroke.
  const debouncedChoices = useDebounced(choices, 300);
  const live = useInvestorEstimate(lead?.lead_id ?? null, debouncedChoices);

  // The number shown: the latest live one once it exists, the calculate-time
  // one before that.
  const estimate: InvestorEstimate | null = lead
    ? (live.data ?? lead.estimate)
    : null;
  const choicesPending =
    !!lead &&
    (live.isFetching ||
      JSON.stringify(choices) !== JSON.stringify(debouncedChoices));

  const canCalculate =
    Object.keys(errors).length === 0 &&
    !!turnstileToken &&
    !createLead.isPending;

  const onCalculate = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!canCalculate || !choices) return;
    const submitted = choices;
    createLead.mutate(
      {
        ...choices,
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        locale: locale === "vi" ? "vi" : "en",
        acknowledged_illustrative: true,
        consent_contact: true,
        session_id: getSessionId() || null,
        turnstile_token: turnstileToken,
      },
      {
        // The live estimate is keyed on (lead, choices). Seeding it with the
        // number Calculate just returned stops it re-fetching that same number
        // the moment the lead id appears.
        onSuccess: (created) =>
          queryClient.setQueryData(
            rateKeys.investorEstimate(created.lead_id, submitted),
            created.estimate,
          ),
      },
    );
    // Single-use token: reset on every attempt, success or not.
    resetTurnstile();
  };

  const numberFormat = locale === "vi" ? "vi-VN" : "en-US";
  const pct = (value: number) =>
    `${value.toLocaleString(numberFormat, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  const rateOne = (value: number) =>
    value.toLocaleString(numberFormat, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const tierRate = tiers.data?.tiers.find(
    (x) => x.risk_tier === tier,
  )?.loan_rate_pct;

  // ------------------------------------------------------------------ calculator
  const fieldError = (message?: string) =>
    message ? (
      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive">
        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{message}</span>
      </p>
    ) : null;

  const segment = (active: boolean) =>
    cn(
      "rounded-md border px-3 py-2 text-sm font-medium transition-colors active:scale-[0.98]",
      active
        ? "border-primary bg-primary/10 text-foreground"
        : "border-input text-muted-foreground hover:text-foreground",
    );

  const contactLocked = !!lead;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
      <motion.form
        onSubmit={onCalculate}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-xs"
        noValidate
      >
        <div className="space-y-1">
          <h2 className="text-lg font-bold">
            {t("ratePage.investor.formTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("ratePage.investor.formHint")}
          </p>
        </div>

        {/* Contact. Locked once the lead exists: the stored row is what
            sales will call, and a name edited after the fact would not reach
            it. */}
        <fieldset
          disabled={contactLocked}
          className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4"
        >
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("ratePage.investor.detailsLabel")}
          </legend>
          <div className="space-y-1.5">
            <label htmlFor="inv-name" className="text-sm font-medium">
              {t("ratePage.investor.name")}{" "}
              <span className="text-xs text-destructive">*</span>
            </label>
            <Input
              id="inv-name"
              autoComplete="name"
              maxLength={120}
              value={name}
              placeholder={t("ratePage.investor.namePlaceholder")}
              aria-invalid={Boolean(show("name"))}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => markTouched("name")}
            />
            {fieldError(show("name"))}
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="inv-email" className="text-sm font-medium">
                {t("ratePage.investor.email")}{" "}
                <span className="text-xs text-destructive">*</span>
              </label>
              <Input
                id="inv-email"
                type="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                placeholder={t("ratePage.investor.emailPlaceholder")}
                aria-invalid={Boolean(show("email"))}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => markTouched("email")}
              />
              {fieldError(show("email"))}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="inv-phone" className="text-sm font-medium">
                {t("ratePage.investor.phone")}{" "}
                <span className="text-xs text-destructive">*</span>
              </label>
              <Input
                id="inv-phone"
                type="tel"
                autoComplete="tel"
                maxLength={20}
                value={phone}
                placeholder="09xx xxx xxx"
                aria-invalid={Boolean(show("phone"))}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => markTouched("phone")}
              />
              {fieldError(show("phone"))}
            </div>
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {t("ratePage.investor.amount")}{" "}
            <span className="text-xs text-destructive">*</span>
          </label>
          <AmountInput
            value={amount}
            onChange={setAmount}
            locale={locale}
            invalid={Boolean(show("amount"))}
            onBlur={() => markTouched("amount")}
          />
          {fieldError(show("amount"))}
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">
            {t("ratePage.investor.commitment")}
          </span>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {COMMITMENTS.map((months) => (
              <button
                key={months}
                type="button"
                role="radio"
                aria-checked={commitment === months}
                onClick={() => setCommitment(months)}
                className={segment(commitment === months)}
              >
                {t("ratePage.investor.monthsShort", { count: months })}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">
            {t("ratePage.investor.risk")}
          </span>
          <div className="grid grid-cols-3 gap-2" role="radiogroup">
            {TIERS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={tier === option}
                onClick={() => setTier(option)}
                className={segment(tier === option)}
              >
                {t(`ratePage.investor.tier.${option}`)}
              </button>
            ))}
          </div>
          {/* The label on a choice, so it shows before calculating. A LOAN
              rate, never the yield. */}
          <p className="min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
            {tierRate !== undefined
              ? t(`ratePage.investor.tierHint.${tier}`, {
                  rate: rateOne(tierRate),
                })
              : null}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="inv-cadence" className="text-sm font-medium">
            {t("ratePage.investor.cadence")}
          </label>
          <select
            id="inv-cadence"
            value={cadence}
            onChange={(e) => setCadence(e.target.value as InvestorCadence)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {CADENCES.map((option) => (
              <option key={option} value={option}>
                {t(`ratePage.investor.cadenceOption.${option}`)}
              </option>
            ))}
          </select>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("ratePage.investor.cadenceHint")}
          </p>
        </div>

        {!lead && (
          <>
            <div className="space-y-1.5">
              <label className="flex cursor-pointer items-start gap-2 text-sm leading-relaxed">
                <Checkbox
                  className="mt-0.5"
                  checked={consent}
                  aria-invalid={Boolean(show("consent"))}
                  onCheckedChange={(value) => {
                    setConsent(value === true);
                    markTouched("consent");
                  }}
                />
                <span>{t("ratePage.investor.consent")}</span>
              </label>
              {fieldError(show("consent"))}
            </div>

            {process.env.NEXT_PUBLIC_DISABLE_TURNSTILE !== "true" && (
              <div className="flex justify-center">
                <div ref={turnstileContainerRef} />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                createLead.isPending ||
                !turnstileToken ||
                (submitAttempted && !canCalculate)
              }
            >
              {createLead.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {createLead.isPending
                ? t("ratePage.investor.calculating")
                : t("ratePage.investor.calculate")}
            </Button>
          </>
        )}
      </motion.form>

      {/* ---------------- Result ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.13, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs lg:sticky lg:top-24"
        aria-live="polite"
      >
        <div className="mb-5 space-y-1">
          <h2 className="text-lg font-bold">
            {t("ratePage.investor.resultTitle")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("ratePage.investor.resultHint")}
          </p>
        </div>

        {createLead.isPending && (
          <div className="space-y-3">
            <Skeleton className="mx-auto h-10 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {!createLead.isPending && !estimate && !createLead.isError && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("ratePage.investor.resultEmpty")}
          </p>
        )}

        {!createLead.isPending && createLead.isError && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs leading-relaxed text-foreground">
              {createLead.error?.message ?? t("ratePage.errorGeneric")}
            </p>
          </div>
        )}

        {lead && !reduceMotion && <ResultBurst key={`burst-${lead.lead_id}`} />}

        {estimate && (
          <motion.div
            key={lead?.lead_id}
            variants={resultVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 space-y-4"
          >
            <motion.div
              variants={resultItemVariants}
              className="border-b border-border/70 pb-4 text-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("ratePage.investor.netApy")}
              </p>
              <motion.p
                variants={figureVariants}
                className={cn(
                  "font-mono text-4xl font-extrabold tracking-tight text-primary transition-opacity",
                  choicesPending && "opacity-60",
                )}
              >
                {pct(estimate.net_apy_pct)}
              </motion.p>
              {/* Fixed height so the panel does not jump; the text itself is
                  only rendered while an update is in flight, because text
                  hidden with opacity is still announced by screen readers. */}
              <p className="h-4 text-[11px] text-muted-foreground">
                {choicesPending ? t("ratePage.investor.updating") : null}
              </p>
            </motion.div>

            {/* The walk-down. Loss and fee carry a leading minus so the
                arithmetic reads as arithmetic, which is the point of showing
                it (prototype rev 5: FundLok's fee is public). */}
            <motion.dl
              variants={resultItemVariants}
              className="space-y-2 text-sm"
            >
              {[
                [
                  "walkLoanRate",
                  pct(estimate.loan_rate_pct),
                  "text-foreground",
                ],
                [
                  "walkExpectedLoss",
                  `−${pct(estimate.expected_loss_pct)}`,
                  "text-muted-foreground",
                ],
                [
                  "walkFee",
                  `−${pct(estimate.fee_pct)}`,
                  "text-muted-foreground",
                ],
              ].map(([key, value, tone]) => (
                <div key={key} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    {t(`ratePage.investor.${key}`)}
                  </dt>
                  <dd className={cn("font-mono", tone)}>{value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-border/70 pt-2">
                <dt className="font-semibold">
                  {t("ratePage.investor.walkNetPerLoan")}
                </dt>
                <dd className="font-mono font-semibold">
                  {pct(estimate.net_per_loan_pct)}
                </dd>
              </div>
            </motion.dl>

            {/* Why 10.50% per loan becomes 17.27% a year. Without this line a
                page showing both numbers reads as a scam (prototype rev 5). */}
            <motion.p
              variants={resultItemVariants}
              className="text-xs leading-relaxed text-muted-foreground"
            >
              {t(
                cadence === "none"
                  ? "ratePage.investor.bridgeNone"
                  : "ratePage.investor.bridge",
                {
                  avg: estimate.avg_loan_months,
                  months: commitment,
                  turns: estimate.capital_turns.toLocaleString(numberFormat, {
                    maximumFractionDigits: 1,
                  }),
                  net: pct(estimate.net_per_loan_pct),
                  apy: pct(estimate.net_apy_pct),
                },
              )}
            </motion.p>

            <motion.div
              variants={resultItemVariants}
              className="flex items-baseline justify-between gap-4 border-t border-border/70 pt-4"
            >
              <span className="text-sm text-muted-foreground">
                {t("ratePage.investor.estReturn")}
              </span>
              <span className="font-mono text-base font-bold text-primary">
                {formatCurrency(estimate.estimated_return_vnd, locale)}
              </span>
            </motion.div>

            <motion.div variants={resultItemVariants}>
              {signup.isSuccess ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Check className="h-4 w-4 text-primary" />
                    {t("ratePage.investor.successTitle")}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t("ratePage.investor.successBody", {
                      reference: signup.data.reference,
                    })}
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!lead || !choices || signup.isPending}
                    onClick={() =>
                      lead &&
                      choices &&
                      signup.mutate({ leadId: lead.lead_id, choices })
                    }
                  >
                    {signup.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {signup.isPending
                      ? t("ratePage.investor.signingUp")
                      : t("ratePage.investor.signup")}
                  </Button>
                  {signup.isError && (
                    <p className="mt-2 text-xs text-destructive">
                      {signup.error?.message ?? t("ratePage.errorGeneric")}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Read with the number, not below the fold: Lok's wording, verbatim
            in Vietnamese. */}
        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
          {t("ratePage.investor.disclaimer")}
        </p>
      </motion.div>
    </div>
  );
}
