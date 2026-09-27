"use client";

import { AlertCircle, FileCheck2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLoanApplicationContext } from "./LoanApplicationContext";
import { parseFigure, type LiteFigureField } from "./lite-grading-fields";

/**
 * One typed figure on the VAT or annual-financials step.
 *
 * Takes only the field descriptor — every piece of state comes from the wizard
 * context, per the repo's no-state-props rule for this feature.
 */
export function FigureField({ field }: { field: LiteFigureField }) {
  const {
    figures,
    figureErrors,
    setFigure,
    blurFigure,
    t,
    locale,
    busy,
    figureLockSource,
    taxFilingsPreview,
  } = useLoanApplicationContext();
  // Read from an attached file (the step-2 e-invoices or the step-3 tax
  // filings): shown, not editable. Removing that file unlocks it.
  const lockSource = figureLockSource(field.key);
  const locked = lockSource !== null;
  // For figures no filing states (fixed/variable cost), the closest statement
  // line, shown as a reference while the SME types their own split.
  const statementValue =
    field.statementHint && taxFilingsPreview
      ? taxFilingsPreview[field.statementHint]
      : null;
  const formatVnd = (n: number) =>
    n.toLocaleString(locale === "vi" ? "vi-VN" : "en-US");

  const raw = figures[field.key];
  const error = figureErrors[field.key];
  const parsed = parseFigure(raw, field.unit);

  const errorText = error ? t(`dashboard.sme.lite.error.${error}`) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label
          htmlFor={field.key}
          className="text-sm font-semibold text-foreground"
        >
          {t(field.labelKey)}
          {field.required ? (
            <span className="ml-1 text-destructive">*</span>
          ) : (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              {t("dashboard.sme.lite.optional")}
            </span>
          )}
        </Label>
        <span className="shrink-0 text-xs text-muted-foreground">
          {field.unit === "vnd" ? "₫" : "%"}
        </span>
      </div>

      <Input
        id={field.key}
        // `text` with a numeric keypad rather than `number`: a number input
        // swallows the thousands separators a Vietnamese keyboard produces and
        // silently changes the value on scroll.
        type="text"
        // "decimal" on a percentage so the phone keypad actually offers the
        // separator the field now accepts.
        inputMode={field.unit === "pct" ? "decimal" : "numeric"}
        autoComplete="off"
        disabled={busy}
        readOnly={locked}
        value={raw}
        onChange={(e) => setFigure(field.key, e.target.value)}
        onBlur={() => blurFigure(field.key)}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${field.key}-hint`}
        placeholder={field.unit === "vnd" ? "0" : "0-100"}
        className={cn(
          "tabular-nums",
          locked && "bg-emerald-500/5 border-emerald-500/40 cursor-default",
          error && "border-destructive focus-visible:ring-destructive/30",
        )}
      />

      {/* Echo the parsed value back, grouped — the cheapest way for someone
          typing 4 800 000 000 to catch a missing or extra zero. */}
      {field.unit === "vnd" && parsed !== null && !error && (
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatVnd(parsed)} ₫
        </p>
      )}

      {locked && !errorText && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
          {t(
            lockSource === "filings"
              ? "dashboard.sme.figureFromFilings"
              : "dashboard.sme.figureFromInvoices",
          )}
        </p>
      )}

      {typeof statementValue === "number" && field.statementHint && (
        <p className="text-xs text-muted-foreground">
          {t(`dashboard.sme.statementHint.${field.statementHint}`).replace(
            "{amount}",
            `${formatVnd(statementValue)} ₫`,
          )}
        </p>
      )}

      {errorText ? (
        <p className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {errorText}
        </p>
      ) : (
        <p id={`${field.key}-hint`} className="text-xs text-muted-foreground">
          {t(field.hintKey)}
        </p>
      )}
    </div>
  );
}
