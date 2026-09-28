"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  CalendarCheck2,
  CalendarClock,
  Check,
  Clock,
  Factory,
  Flag,
  HandCoins,
  HomeIcon,
  LineChart,
  ListChecks,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { WelcomeSlideId } from "@/lib/constants/welcome-slides";
import { BUSINESS_DAYS_PER_PERIOD } from "@/lib/facility-terms";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * One animated diagram per welcome slide. Every slide has one: a screen of
 * text alone reads as terms and conditions, and the point of the cutscreen is
 * to make the mechanism visible.
 *
 * All of it is decorative — the slide's heading and body carry the meaning —
 * so each visual is `aria-hidden`. Motion is governed by the MotionConfig in
 * the cutscreen, which honours the app's reduce-motion setting.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ hello */

function HelloVisual() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <motion.div
        className="absolute h-40 w-40 rounded-full bg-brand/25 blur-3xl sm:h-56 sm:w-56"
        animate={{ scale: [0.9, 1.12, 0.9], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-32 w-32 translate-x-10 rounded-full bg-brand-blue/25 blur-3xl sm:h-44 sm:w-44"
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img
        src="/logo/logo-dark.webp"
        alt=""
        width={512}
        height={181}
        className="relative w-56 sm:w-72 md:w-80"
        initial={{ opacity: 0, scale: 0.82, filter: "blur(14px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.4, ease: EASE }}
      />
    </div>
  );
}

/* --------------------------------------------------------- SME: intro */

function SmeIntroVisual() {
  const { t } = useTranslations();
  const bars = [0.35, 0.55, 0.75, 1];
  return (
    <div className="flex h-full w-full items-center justify-center gap-3 sm:gap-6">
      <div className="flex w-2/5 max-w-52 flex-col items-center gap-2">
        <svg viewBox="0 0 200 110" className="w-full overflow-visible">
          <motion.path
            d="M4 86 C 30 60, 44 96, 70 70 S 110 34, 132 54 S 170 22, 196 14"
            fill="none"
            stroke="var(--brand-blue)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
          {[
            [70, 70],
            [132, 54],
            [196, 14],
          ].map(([cx, cy], index) => (
            <motion.circle
              key={cx}
              cx={cx}
              cy={cy}
              r="5"
              fill="var(--brand-blue)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.45 }}
            />
          ))}
        </svg>
        <Label>{t("welcome.visuals.verifiedRevenue")}</Label>
      </div>

      <motion.div
        className="text-brand"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: [0, 6, 0] }}
        transition={{
          opacity: { delay: 1.2 },
          x: { delay: 1.2, duration: 1.6, repeat: Infinity },
        }}
      >
        <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
          <path
            d="M2 10h28m0 0-7-7m7 7-7 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <div className="flex w-2/5 max-w-52 flex-col items-center gap-2">
        <div className="flex h-[110px] w-full items-end justify-center gap-2">
          {bars.map((height, index) => (
            <motion.div
              key={height}
              className="w-1/5 rounded-t-md bg-brand"
              style={{ height: `${height * 100}%`, originY: 1 }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 1.4 + index * 0.15, ease: EASE }}
            />
          ))}
        </div>
        <Label>{t("welcome.visuals.growthCapital")}</Label>
      </div>
    </div>
  );
}

/* ---------------------------------------------------- SME: assessment */

function AssessmentVisual() {
  const { t } = useTranslations();
  const tiles = [
    { icon: TrendingUp, label: t("welcome.visuals.factorRevenue") },
    { icon: Receipt, label: t("welcome.visuals.factorCosts") },
    { icon: ShieldCheck, label: t("welcome.visuals.factorCredit") },
    { icon: Factory, label: t("welcome.visuals.factorSector") },
  ];
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 sm:gap-4">
      <motion.div
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="relative inline-flex">
          <HomeIcon className="h-4 w-4 text-muted-foreground" />
          <motion.span
            className="absolute left-1/2 top-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded bg-brand"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5 }}
          />
        </span>
        <Label className="text-foreground">
          {t("welcome.visuals.noCollateral")}
        </Label>
      </motion.div>

      <div className="grid w-full max-w-md grid-cols-2 gap-2 sm:gap-3">
        {tiles.map(({ icon: Icon, label }, index) => (
          <motion.div
            key={label}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5 sm:p-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.18, ease: EASE }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 text-xs font-medium leading-snug text-foreground sm:text-sm">
              {label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- SME: daily */

function DailyVisual({ daily, monthly }: { daily: string; monthly: string }) {
  const { t } = useTranslations();
  return (
    <div className="flex h-full w-full max-w-lg flex-col justify-center gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label>{t("welcome.visuals.monthlyPayment")}</Label>
          <Label className="text-foreground">{monthly}</Label>
        </div>
        <motion.div
          className="h-9 w-full rounded-lg border border-border bg-muted sm:h-11"
          style={{ originX: 0 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: EASE }}
        />
      </div>

      <motion.div
        className="text-center text-lg font-bold text-brand"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        =
      </motion.div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label>
            {t("welcome.visuals.dailyPayments", {
              days: BUSINESS_DAYS_PER_PERIOD,
            })}
          </Label>
          <Label className="text-foreground">
            {t("welcome.visuals.perDay", { amount: daily })}
          </Label>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {Array.from({ length: BUSINESS_DAYS_PER_PERIOD }, (_, index) => (
            <motion.div
              key={index}
              className="h-5 rounded bg-brand sm:h-6"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + index * 0.05, ease: EASE }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- SME: relief */

function ReliefVisual() {
  const { t } = useTranslations();
  // Share of verified revenue per month, against the dotted "you paid" line
  // at 70%. Month 2 falls short; the gap is the relief.
  const months = [0.86, 0.52, 0.8];
  const LINE = 0.7;
  return (
    <div className="flex h-full w-full max-w-md flex-col justify-center gap-2">
      <div className="relative flex h-36 items-end justify-around border-b border-border sm:h-44">
        <motion.div
          className="absolute inset-x-0 border-t-2 border-dashed border-foreground/60"
          style={{ bottom: `${LINE * 100}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        />

        {months.map((height, index) => {
          const short = height < LINE;
          return (
            <div
              key={index}
              className="relative flex h-full w-1/5 items-end justify-center"
            >
              {short && (
                <motion.div
                  className="absolute inset-x-0 rounded-t-sm border-2 border-dashed border-brand bg-brand/20"
                  style={{
                    bottom: `${height * 100}%`,
                    height: `${(LINE - height) * 100}%`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.6, 1] }}
                  transition={{ delay: 1.5, duration: 1.2 }}
                />
              )}
              <motion.div
                className={cn(
                  "w-full rounded-t-md",
                  short ? "bg-brand-blue/60" : "bg-brand-blue",
                )}
                style={{ height: `${height * 100}%`, originY: 1 }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.4 + index * 0.25, ease: EASE }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-around">
        {months.map((_, index) => (
          <Label key={index} className="w-1/5 text-center">
            {t("welcome.visuals.month", { n: index + 1 })}
          </Label>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 border-t-2 border-dashed border-foreground/60" />
          <Label>{t("welcome.visuals.paidEachMonth")}</Label>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-brand-blue" />
          <Label>{t("welcome.visuals.shareOfRevenue")}</Label>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-brand bg-brand/20" />
          <Label>{t("welcome.visuals.reliefGap")}</Label>
        </span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------- SME: extension */

function ExtensionVisual() {
  const { t } = useTranslations();
  return (
    <div className="flex h-full w-full max-w-lg flex-col justify-center gap-5">
      {/* Timeline: the loan runs a week longer, but never past the final
          settlement date. */}
      <div className="flex flex-col gap-2">
        <div className="relative flex h-8 items-center">
          <div className="flex h-3 w-[78%] overflow-hidden rounded-l-full">
            <div className="h-full w-1/3 bg-brand-blue" />
            <div className="h-full flex-1 bg-brand-blue/40" />
          </div>
          <motion.div
            className="h-3 rounded-r-full bg-brand"
            initial={{ width: "0%" }}
            animate={{ width: "10%" }}
            transition={{ delay: 0.8, duration: 1, ease: EASE }}
          />
          <motion.span
            className="absolute -top-4 whitespace-nowrap text-xs font-semibold text-brand"
            style={{ left: "79%" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            {t("welcome.visuals.plusWeek")}
          </motion.span>
          <div className="absolute right-0 flex h-full flex-col items-center">
            <Flag className="h-4 w-4 text-foreground" />
            <div className="w-px flex-1 bg-foreground/60" />
          </div>
        </div>
        <div className="flex justify-between gap-2">
          <Label>{t("welcome.visuals.today")}</Label>
          <Label className="text-right text-foreground">
            {t("welcome.visuals.finalDate")}
          </Label>
        </div>
      </div>

      {/* The daily amount falls; the total rises a little. */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground">
              {t("welcome.visuals.eachDay")}
            </Label>
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
            >
              <ArrowDown className="h-4 w-4 text-brand" />
            </motion.span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: "100%" }}
              animate={{ width: "72%" }}
              transition={{ delay: 1.2, duration: 1, ease: EASE }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground">
              {t("welcome.visuals.total")}
            </Label>
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
            >
              <ArrowUp className="h-4 w-4 text-muted-foreground" />
            </motion.span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-brand-blue"
              initial={{ width: "90%" }}
              animate={{ width: "94%" }}
              transition={{ delay: 1.2, duration: 1, ease: EASE }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- SME: rules */

function RulesVisual() {
  const { t } = useTranslations();
  // A month of business days paid in full, then the month closes and relief
  // is considered — rule one, drawn.
  return (
    <div className="flex h-full w-full max-w-sm flex-col items-center justify-center gap-3">
      <div className="grid w-full grid-cols-7 gap-1.5">
        {Array.from({ length: BUSINESS_DAYS_PER_PERIOD }, (_, index) => (
          <motion.div
            key={index}
            className="flex aspect-square items-center justify-center rounded-md border border-border"
            initial={{ backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ backgroundColor: "var(--brand)" }}
            transition={{ delay: 0.2 + index * 0.06 }}
          >
            <Check className="h-3 w-3 text-primary-foreground" />
          </motion.div>
        ))}
      </div>
      <motion.div
        className="inline-flex items-center gap-2 rounded-full border border-brand/60 bg-brand/10 px-3 py-1.5"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.7, ease: EASE }}
      >
        <CalendarCheck2 className="h-4 w-4 text-brand" />
        <Label className="text-foreground">
          {t("welcome.visuals.monthClosed")}
        </Label>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------- shared: ready */

function ReadyVisual() {
  return (
    <div className="relative flex h-full items-center justify-center">
      <motion.div
        className="absolute h-28 w-28 rounded-full border-2 border-brand/40 sm:h-36 sm:w-36"
        animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brand sm:h-28 sm:w-28"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
      >
        <svg viewBox="0 0 52 52" className="h-12 w-12 sm:h-14 sm:w-14">
          <motion.path
            d="M14 27l8 8 16-17"
            fill="none"
            stroke="var(--primary-foreground)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------ investor: disclosure */

function DisclosureVisual() {
  const { t } = useTranslations();
  const rows = [
    { icon: BadgeCheck, label: t("welcome.visuals.discloseScore") },
    { icon: LineChart, label: t("welcome.visuals.discloseRevenue") },
    { icon: Clock, label: t("welcome.visuals.discloseFreshness") },
    { icon: Wallet, label: t("welcome.visuals.discloseFees") },
    { icon: ListChecks, label: t("welcome.visuals.discloseRisks") },
    { icon: CalendarClock, label: t("welcome.visuals.discloseFinalDate") },
  ];
  return (
    <motion.div
      className="w-full max-w-sm rounded-2xl border border-border bg-card p-3 text-left shadow-2xl sm:p-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: EASE }}
    >
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/20 text-brand-blue">
          <Store className="h-4 w-4" />
        </span>
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="h-2.5 w-2/3 rounded-full bg-foreground/70" />
          <div className="h-2 w-1/3 rounded-full bg-muted" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map(({ icon: Icon, label }, index) => (
          <motion.div
            key={label}
            className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-2.5 py-1 sm:py-1.5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.22, ease: EASE }}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-brand" />
            <span className="min-w-0 flex-1 text-xs text-foreground">
              {label}
            </span>
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 + index * 0.22 }}
            >
              <Check className="h-3.5 w-3.5 text-brand" />
            </motion.span>
          </motion.div>
        ))}
        <motion.div
          className="mt-0.5 flex items-center gap-2.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1.5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + rows.length * 0.22, ease: EASE }}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <span className="min-w-0 text-xs text-foreground">
            {t("welcome.visuals.discloseLoss")}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------- investor: risk/rate */

function Gauge({
  label,
  low,
  high,
  keyframes,
  color,
}: {
  label: string;
  low: string;
  high: string;
  keyframes: string[];
  color: string;
}) {
  return (
    <div className="flex flex-col gap-2 text-left">
      <Label className="text-foreground">{label}</Label>
      <div className="relative h-3 w-full rounded-full bg-muted">
        <motion.div
          className={cn(
            "absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-lg",
            color,
          )}
          animate={{ left: keyframes }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      </div>
      <div className="flex justify-between">
        <Label>{low}</Label>
        <Label>{high}</Label>
      </div>
    </div>
  );
}

function RiskRateVisual() {
  const { t } = useTranslations();
  return (
    <div className="flex h-full w-full max-w-md flex-col justify-center gap-6">
      <Gauge
        label={t("welcome.visuals.businessScore")}
        low={t("welcome.visuals.weaker")}
        high={t("welcome.visuals.stronger")}
        keyframes={["82%", "82%", "24%", "24%"]}
        color="bg-brand-blue"
      />
      <Gauge
        label={t("welcome.visuals.interestRate")}
        low={t("welcome.visuals.lower")}
        high={t("welcome.visuals.higher")}
        keyframes={["22%", "22%", "76%", "76%"]}
        color="bg-brand"
      />
    </div>
  );
}

/* --------------------------------------------------- investor: journey */

function JourneyVisual() {
  const { t } = useTranslations();
  const steps = [
    { icon: Search, label: t("welcome.visuals.stepBrowse") },
    { icon: HandCoins, label: t("welcome.visuals.stepCommit") },
    { icon: Store, label: t("welcome.visuals.stepDisburse") },
    { icon: RefreshCw, label: t("welcome.visuals.stepRepay") },
  ];
  return (
    <div className="relative flex w-full max-w-lg items-start justify-between">
      <div className="absolute left-[12.5%] right-[12.5%] top-5 h-0.5 bg-border sm:top-6">
        <motion.div
          className="h-full bg-brand"
          style={{ originX: 0 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 1.8, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -top-1 h-2.5 w-2.5 rounded-full bg-brand shadow-[0_0_12px_var(--brand)]"
          animate={{ left: ["0%", "100%"] }}
          transition={{
            delay: 2.2,
            duration: 2.4,
            repeat: Infinity,
            repeatDelay: 0.6,
            ease: "easeInOut",
          }}
        />
      </div>
      {steps.map(({ icon: Icon, label }, index) => (
        <motion.div
          key={label}
          className="relative z-10 flex w-1/4 flex-col items-center gap-2 px-1 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + index * 0.45, ease: EASE }}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brand/60 bg-background text-brand sm:h-12 sm:w-12">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <Label className="text-foreground">{label}</Label>
        </motion.div>
      ))}
    </div>
  );
}

/* --------------------------------------------- investor: daily benefit */

function DailyBenefitVisual() {
  const { t } = useTranslations();
  const loop = {
    duration: 5,
    repeat: Infinity,
    repeatDelay: 1.2,
    ease: "easeInOut" as const,
  };
  return (
    <div className="flex h-full w-full max-w-md flex-col justify-center gap-4 text-left">
      <div className="flex flex-col gap-1.5">
        <Label className="text-foreground">{t("welcome.visuals.atRisk")}</Label>
        <div className="h-3 w-full rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-brand-blue"
            animate={{ width: ["100%", "70%", "45%", "20%"] }}
            transition={loop}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-foreground">
          {t("welcome.visuals.returned")}
        </Label>
        <div className="h-3 w-full rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-brand"
            animate={{ width: ["0%", "30%", "55%", "80%"] }}
            transition={loop}
          />
        </div>
      </div>
      <motion.div
        className="inline-flex items-center gap-2 self-center rounded-full border border-brand/60 bg-brand/10 px-3 py-1.5"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <RefreshCw className="h-3.5 w-3.5 text-brand" />
        <Label className="text-foreground">
          {t("welcome.visuals.reinvest")}
        </Label>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------- switch */

export function WelcomeVisual({
  id,
  daily,
  monthly,
}: {
  id: WelcomeSlideId;
  daily: string;
  monthly: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none flex h-full w-full items-center justify-center"
    >
      {id === "hello" && <HelloVisual />}
      {id === "intro" && <SmeIntroVisual />}
      {id === "assessment" && <AssessmentVisual />}
      {id === "daily" && <DailyVisual daily={daily} monthly={monthly} />}
      {id === "relief" && <ReliefVisual />}
      {id === "extension" && <ExtensionVisual />}
      {id === "rules" && <RulesVisual />}
      {id === "disclosure" && <DisclosureVisual />}
      {id === "riskRate" && <RiskRateVisual />}
      {id === "journey" && <JourneyVisual />}
      {id === "dailyBenefit" && <DailyBenefitVisual />}
      {id === "ready" && <ReadyVisual />}
    </div>
  );
}
