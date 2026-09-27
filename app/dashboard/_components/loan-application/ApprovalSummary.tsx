"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LoanApproval } from "@/services/projects.service";

/**
 * What an approved request was approved on: the business score, the
 * reference rate, and the repayment they imply.
 *
 * Wording is a compliance control (handbook §9): "business score" and
 * "reference rate", never a credit rating; the rate is all-in and flat; the
 * daily amount is an estimate; and nothing here promises funding — investors
 * fund the listing, and the signed offer is what binds.
 */
export function ApprovalSummary({
  approval,
  requestedAmount,
  locale,
  t,
}: {
  approval: LoanApproval;
  requestedAmount: number;
  locale: string;
  t: (key: string) => string;
}) {
  const vnd = (n: number | null) =>
    n === null
      ? "—"
      : `${n.toLocaleString(locale === "vi" ? "vi-VN" : "en-US")} ₫`;
  const facts: [string, string][] = [
    [t("dashboard.sme.approval.amount"), vnd(requestedAmount)],
    [
      t("dashboard.sme.approval.term"),
      approval.duration_months === null
        ? "—"
        : t("dashboard.sme.approval.months").replace(
            "{n}",
            String(approval.duration_months),
          ),
    ],
    [t("dashboard.sme.approval.total"), vnd(approval.total_repayment_vnd)],
    [
      t("dashboard.sme.approval.daily"),
      vnd(approval.estimated_daily_repayment_vnd),
    ],
  ];

  return (
    <section
      aria-label={t("dashboard.sme.approval.heading")}
      data-testid="approval-summary"
      className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 md:p-5"
    >
      <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
        {t("dashboard.sme.approval.heading")}
      </h4>

      {approval.business_score !== null &&
      approval.reference_rate_pct !== null ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t("dashboard.sme.approval.score")}
            </p>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {approval.business_score.toFixed(2)}
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                / 100
              </span>
            </p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${approval.business_score}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t("dashboard.sme.approval.rate")}
            </p>
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {approval.reference_rate_pct.toFixed(2)}%
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                {t("dashboard.sme.approval.perYear")}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t("dashboard.sme.approval.rateNote")}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("dashboard.sme.approval.scorePending")}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-emerald-500/20 pt-4 sm:grid-cols-4">
        {facts.map(([label, value]) => (
          <div key={label} className="space-y-0.5">
            <dt className="stat-label">{label}</dt>
            <dd className="text-sm font-bold tabular-nums text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {t("dashboard.sme.approval.disclaimer")}
      </p>
    </section>
  );
}

const SEEN_KEY = (id: string) => `fundlok:approval-celebrated:${id}`;

// Per-viewer convenience only: if storage is unavailable the worst case is
// seeing the celebration twice, never missing the approval itself (the
// summary above is always rendered).
function seenBefore(id: string): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY(id)) === "1";
  } catch {
    return false;
  }
}

function markSeen(id: string) {
  try {
    window.localStorage.setItem(SEEN_KEY(id), "1");
  } catch {
    /* storage blocked: nothing to remember */
  }
}

/** A number that counts up once, driven by a motion value (no re-renders). */
function CountUp({ to, decimals }: { to: number; decimals: number }) {
  const reduce = useReducedMotion();
  const value = useMotionValue(reduce ? to : 0);
  const text = useTransform(value, (v) => v.toFixed(decimals));
  useEffect(() => {
    if (reduce) return;
    const controls = animate(value, to, {
      duration: 1.2,
      delay: 0.35,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [reduce, to, value]);
  return <motion.span>{text}</motion.span>;
}

// Deterministic burst: 18 pieces on a ring, so the layout is stable between
// renders and nothing depends on Math.random during hydration.
const PIECES = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const radius = 120 + (i % 3) * 28;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    rotate: (i % 2 ? 1 : -1) * (90 + i * 20),
    tone: ["bg-emerald-400", "bg-emerald-300", "bg-foreground/40"][i % 3],
    round: i % 4 === 0,
  };
});

/**
 * The one-time "your request was approved" moment, shown the first time the
 * SME opens the dashboard after an operator approval. Dismissed for good per
 * application (and browser); the summary card stays as the lasting record.
 */
export function ApprovalCelebration({
  applicationId,
  approval,
  companyName,
  t,
}: {
  applicationId: string;
  approval: LoanApproval;
  companyName: string | null;
  t: (key: string) => string;
}) {
  const reduce = useReducedMotion();
  // Read after mount: localStorage does not exist during server render.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!seenBefore(applicationId)) setOpen(true);
  }, [applicationId]);

  const close = () => {
    markSeen(applicationId);
    setOpen(false);
    document
      .querySelector('[data-testid="approval-summary"]')
      ?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "center",
      });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // close is stable enough for a keydown listener bound per open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const scored =
    approval.business_score !== null && approval.reference_rate_pct !== null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-celebration-title"
            className="relative w-full max-w-md rounded-2xl border border-emerald-500/30 bg-card p-6 text-center shadow-xl sm:p-8"
            initial={reduce ? false : { scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={reduce ? undefined : { scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              aria-label={t("common.close")}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
              {!reduce &&
                PIECES.map((p, i) => (
                  <motion.span
                    key={i}
                    aria-hidden
                    className={`absolute h-2 w-2 ${p.tone} ${p.round ? "rounded-full" : "rounded-[2px]"}`}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                    animate={{
                      x: p.x,
                      y: p.y,
                      opacity: [0, 1, 0],
                      scale: [0.4, 1, 0.8],
                      rotate: p.rotate,
                    }}
                    transition={{ duration: 1.3, delay: 0.15, ease: "easeOut" }}
                  />
                ))}
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"
                initial={reduce ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 16,
                  delay: 0.05,
                }}
              >
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </motion.div>
            </div>

            <h2
              id="approval-celebration-title"
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              {t("dashboard.sme.approval.celebrateTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("dashboard.sme.approval.celebrateBody").replace(
                "{company}",
                companyName ?? "",
              )}
            </p>

            {scored && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground">
                    {t("dashboard.sme.approval.score")}
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    <CountUp to={approval.business_score!} decimals={2} />
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground">
                    {t("dashboard.sme.approval.rate")}
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    <CountUp to={approval.reference_rate_pct!} decimals={2} />%
                  </p>
                </div>
              </div>
            )}

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              {t("dashboard.sme.approval.celebrateNext")}
            </p>

            <Button type="button" className="mt-6 w-full" onClick={close}>
              {t("dashboard.sme.approval.celebrateCta")}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
