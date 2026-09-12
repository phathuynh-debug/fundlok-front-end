"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Info, Loader2 } from "lucide-react";
import { useIndicativeRate, useSaveLoanFigures } from "@/hooks/use-loans";
import type { LoanApplicationFiguresPayload } from "@/services/loans.service";
import { useLoanApplicationContext } from "./LoanApplicationContext";
import {
  LITE_FIGURE_KEYS,
  REQUIRED_LITE_FIGURE_KEYS,
  parseFigure,
} from "./lite-grading-fields";

/**
 * The grading engine's indicative rate for the figures the applicant just
 * typed, shown on the review step before they send anything.
 *
 * WHY IT SAVES FIRST
 * The band is derived server-side from the STORED figures — the engine is not
 * in the browser and must not be, since its params file is what makes a rate
 * reconstructable later. The wizard otherwise defers saving until Send, so this
 * persists the set once on mount. That write is safe and useful on its own: the
 * figures endpoint is an idempotent full replace, it is allowed while the
 * application is DRAFT, and a saved draft is what lets the wizard repopulate
 * itself if the applicant leaves and comes back.
 *
 * WHAT IT MAY SAY
 * A range, with its assumptions, never a single figure and never an offer. The
 * applicant's CIC score is unknown before KYC, so the engine runs at both ends
 * of its calibrated range. Anything here that reads as a quote is a compliance
 * defect, not a copy preference.
 */
export function IndicativeRateCard() {
  const { loanApplicationId, figures, locale, t } = useLoanApplicationContext();
  const saveFigures = useSaveLoanFigures();
  const [figuresSaved, setFiguresSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  // Every required figure has a value. The wizard's step validation should
  // already guarantee this by the review step, but the band is the one thing
  // here that calls the server on render, so it checks rather than assumes.
  const haveRequiredFigures = REQUIRED_LITE_FIGURE_KEYS.every(
    (key) => parseFigure(figures[key]) !== null,
  );

  // Ref, not state: this must fire exactly once per mount. A second save would
  // be harmless (the PUT is a full replace) but would refetch the band and make
  // the card flicker on every unrelated re-render of the wizard, which
  // re-renders on each upload progress tick.
  const savedOnce = useRef(false);

  useEffect(() => {
    if (savedOnce.current || !haveRequiredFigures) return;
    savedOnce.current = true;

    saveFigures
      .mutateAsync({
        applicationId: loanApplicationId,
        payload: Object.fromEntries(
          LITE_FIGURE_KEYS.map((key) => [key, parseFigure(figures[key])]),
        ) as unknown as LoanApplicationFiguresPayload,
      })
      .then(() => setFiguresSaved(true))
      .catch(() => setSaveFailed(true));
    // Deliberately mount-only: `figures` is the value being saved, not a
    // trigger. Re-running on every keystroke would save on each one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanApplicationId, haveRequiredFigures]);

  const { data, isLoading, error } = useIndicativeRate(
    loanApplicationId,
    figuresSaved,
  );

  if (!haveRequiredFigures) return null;

  // Translate the server's error by code. The backend sends
  // `{ code, message, fields }` precisely so a Vietnamese applicant is not
  // shown an English sentence; `message` is the fallback for a code this build
  // has no string for (a backend deployed ahead of the frontend).
  const reasonText = (): string => {
    const reason = error?.reason;
    if (!reason)
      return error?.message ?? t("dashboard.sme.lite.rateUnavailable");

    const key = `dashboard.sme.lite.rateReason.${reason.code}`;
    const translated = t(key);
    if (translated === key) return reason.message;

    if (!reason.fields?.length) return translated;

    const labels = reason.fields.map((field) => {
      const fieldKey = `dashboard.sme.lite.rateReasonField.${field}`;
      const label = t(fieldKey);
      return label === fieldKey ? field : label;
    });
    return translated.replace("{fields}", labels.join(", "));
  };

  const numberFormat = locale === "vi" ? "vi-VN" : "en-US";
  const pct = (value: number) =>
    `${value.toLocaleString(numberFormat, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h5 className="text-sm font-bold text-foreground">
            {t("dashboard.sme.lite.rateTitle")}
          </h5>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.sme.lite.rateSubtitle")}
          </p>
        </div>
        {data?.provisional && (
          <span className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            {t("dashboard.sme.lite.rateProvisional")}
          </span>
        )}
      </div>

      {(isLoading || (!figuresSaved && !saveFailed)) && (
        <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("dashboard.sme.lite.rateLoading")}
        </div>
      )}

      {/* Every error this endpoint returns names something the applicant can
          change — a missing term, costs above revenue — so the reason is shown
          rather than a generic failure. Translated by code, never echoed from
          the server's English. */}
      {(saveFailed || error) && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-relaxed text-foreground">
            {saveFailed
              ? t("dashboard.sme.lite.rateUnavailable")
              : reasonText()}
          </p>
        </div>
      )}

      {data && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="space-y-3"
        >
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {pct(data.rate_low_pct)} – {pct(data.rate_high_pct)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {t("dashboard.sme.lite.ratePerYear")}
            </span>
          </div>

          {/* Not a quote, stated before the assumptions rather than after —
              the disclaimer has to be read with the number, not below it. */}
          <p className="text-xs font-medium text-foreground">
            {t("dashboard.sme.lite.rateNotAnOffer")}
          </p>

          <div className="space-y-1.5 border-t border-border/60 pt-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Info className="h-3 w-3" />
              {t("dashboard.sme.lite.rateAssumptionsTitle")}
            </div>
            <ul className="space-y-1">
              {data.assumptions.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stamped so a band an applicant acted on can be reconstructed. */}
          <p className="font-mono text-[10px] text-muted-foreground/70">
            {t("dashboard.sme.lite.rateVersions")
              .replace("{engine}", data.engine_version)
              .replace("{params}", data.params_version)}
          </p>
        </motion.div>
      )}
    </div>
  );
}
