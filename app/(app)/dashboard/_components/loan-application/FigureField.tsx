"use client";

import { AlertCircle, FileCheck2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLoanApplicationContext } from "./LoanApplicationContext";
import { figureFilesRead } from "./figures-from-files";
import { parseFigure, type LiteFigureField } from "./lite-grading-fields";

/**
 * One figure on the revenue-and-costs step: shown, never typed.
 *
 * Every value is read out of the two files (see figuresFromFiles), so the input
 * is read-only and the only way to change a number is to change the file it
 * came from. What the field adds to the number is where it came from, and, when
 * the files could not state it, why that matters.
 *
 * Takes only the field descriptor — every piece of state comes from the wizard
 * context, per the repo's no-state-props rule for this feature.
 */
export function FigureField({ field }: { field: LiteFigureField }) {
  const {
    figures,
    figureErrors,
    t,
    locale,
    busy,
    priorYear,
    eInvoicePreview,
    taxFilingsPreview,
  } = useLoanApplicationContext();

  const formatVnd = (n: number) =>
    n.toLocaleString(locale === "vi" ? "vi-VN" : "en-US");

  const raw = figures[field.key];
  const hasValue = raw !== "";
  const parsed = parseFigure(raw, field.unit);
  const error = figureErrors[field.key];
  const errorText = error ? t(`dashboard.sme.lite.error.${error}`) : null;
  // Blank because the files do not state it, as opposed to not read yet.
  const notInFiles =
    !hasValue && figureFilesRead(field, eInvoicePreview, taxFilingsPreview);

  // Where the value came from. A cost of 0 gets its own words: it is an answer
  // (none was booked), and next to a blank-looking field it reads like a gap.
  const noteKey =
    field.zeroNoteKey && parsed === 0 ? field.zeroNoteKey : field.sourceNoteKey;
  // The note can show its working: the year it was worked out over, or the two
  // expenses that make up fixed cost.
  const amount = (n: number | undefined) =>
    typeof n === "number" ? `${formatVnd(n)} ₫` : "";
  const note = t(noteKey)
    .replace("{from}", priorYear.status === "filled" ? priorYear.from : "")
    .replace("{to}", priorYear.status === "filled" ? priorYear.to : "")
    .replace("{admin}", amount(taxFilingsPreview?.admin_expense_vnd))
    .replace("{financial}", amount(taxFilingsPreview?.financial_expense_vnd));

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
        type="text"
        readOnly
        autoComplete="off"
        disabled={busy}
        value={raw}
        placeholder="—"
        aria-invalid={error ? true : undefined}
        aria-describedby={`${field.key}-hint`}
        className={cn(
          "tabular-nums cursor-default",
          hasValue ? "bg-emerald-500/5 border-emerald-500/40" : "bg-muted/30",
          error && "border-destructive focus-visible:ring-destructive/30",
        )}
      />

      {/* The value grouped in thousands: a read-only field is still read, and
          eleven unbroken digits are easy to misread. */}
      {field.unit === "vnd" && parsed !== null && !error && (
        <p className="text-xs tabular-nums text-muted-foreground">
          {formatVnd(parsed)} ₫
        </p>
      )}

      {hasValue && !errorText && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
          {note}
        </p>
      )}

      {notInFiles && !errorText && (
        <p className="text-xs text-muted-foreground">
          {t("dashboard.sme.lite.notInFiles")}
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
