"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLoanApplicationContext } from "./LoanApplicationContext";
import { UploadField } from "./UploadField";
import { FigureField } from "./FigureField";
import { figureFieldsInGroup, type FigureGroup } from "./lite-grading-fields";

/**
 * Step 2: revenue and costs, from two files, with nothing typed.
 *
 * These used to be two steps, each with a file of its own, and the first one
 * ended by asking the SME to type the revenue of the year before the invoices.
 * That number is already in the second file: the VAT declarations cover 24
 * months, the invoices only the latest 12. Asked together, both files are in
 * before the figures are, and every figure below is read out of them (see
 * figuresFromFiles): the fields show what the files say and cannot be edited.
 */
export function RevenueCostsStep() {
  const { t } = useLoanApplicationContext();

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-bold text-foreground">
        {t("dashboard.sme.lite.financialsTitle")}
      </h4>
      <p className="text-sm text-muted-foreground">
        {t("dashboard.sme.lite.financialsSubtitle")}
      </p>

      <div className="space-y-3">
        <UploadField
          docKey="eInvoiceData"
          label={t("dashboard.sme.eInvoiceData")}
        />
        <EInvoiceReadout />
      </div>

      <div className="space-y-3">
        <UploadField
          docKey="taxFilings"
          label={t("dashboard.sme.taxFilings")}
        />
        <TaxFilingsReadout />
        <PriorYearNote />
      </div>

      <FigureGroupBlock group="revenue" />
      <FigureGroupBlock group="costs" />
    </div>
  );
}

/** One labelled block of figures, laid out from LITE_FIGURE_FIELDS. */
function FigureGroupBlock({ group }: { group: FigureGroup }) {
  const { t } = useLoanApplicationContext();
  const headingId = `figures-${group}`;

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-5 border-t border-border/60 pt-5"
    >
      <h5
        id={headingId}
        className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
      >
        {t(`dashboard.sme.lite.group.${group}`)}
      </h5>
      {group === "costs" && <CostsBasisNote />}
      {figureFieldsInGroup(group).map((field) => (
        <FigureField key={field.key} field={field} />
      ))}
    </section>
  );
}

/**
 * Why fixed and variable cost are what they are. No filing says which costs move
 * with sales, so these two follow a stated rule and are not a fact from the
 * statements; someone who sees a 0 beside variable costs, or a fixed cost bigger
 * than the management expense, should be able to see why. Shown once the
 * filings are read, when there are numbers to explain.
 */
function CostsBasisNote() {
  const { taxFilingsPreview, isReadingTaxFilings, t } =
    useLoanApplicationContext();

  if (isReadingTaxFilings || !taxFilingsPreview) return null;

  return (
    <p className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
      {t("dashboard.sme.lite.costsBasis")}
    </p>
  );
}

/**
 * What the attached e-invoice zip was read as: the months found, or that it
 * is still being read. Shown between the upload and the figures it fills, so
 * the SME sees where the locked numbers came from.
 */
function EInvoiceReadout() {
  const { eInvoicePreview, isReadingEInvoices, t } =
    useLoanApplicationContext();

  if (isReadingEInvoices) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("dashboard.sme.eInvoiceReading")}
      </p>
    );
  }
  if (!eInvoicePreview) return null;

  const partial = eInvoicePreview.revenue_last_12m === null;
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-xs leading-relaxed",
        partial
          ? "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200"
          : "border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200",
      )}
    >
      <p className="font-semibold">
        {t("dashboard.sme.eInvoiceReadSummary")
          .replace("{count}", String(eInvoicePreview.months_covered))
          .replace("{start}", eInvoicePreview.period_start)
          .replace("{end}", eInvoicePreview.period_end)}
      </p>
      <p>
        {partial
          ? t("dashboard.sme.eInvoicePartialYear")
          : t("dashboard.sme.eInvoiceFilledFigures")}
      </p>
    </div>
  );
}

/**
 * What the attached tax filings were read as: the fiscal year of the
 * statements and, when the monthly VAT declarations were included, how many
 * months. Mirrors EInvoiceReadout.
 */
function TaxFilingsReadout() {
  const { taxFilingsPreview, isReadingTaxFilings, t } =
    useLoanApplicationContext();

  if (isReadingTaxFilings) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("dashboard.sme.taxFilingsReading")}
      </p>
    );
  }
  if (!taxFilingsPreview) return null;

  // A loss year states no owner-withdrawal share, so that field stays blank.
  const noProfit = taxFilingsPreview.owner_withdrawal_pct === null;
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-xs leading-relaxed",
        noProfit
          ? "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200"
          : "border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200",
      )}
    >
      <p className="font-semibold">
        {t("dashboard.sme.taxFilingsReadSummary").replace(
          "{year}",
          String(taxFilingsPreview.fiscal_year),
        )}
        {taxFilingsPreview.vat_months > 0 &&
          ` · ${t("dashboard.sme.taxFilingsVatMonths").replace(
            "{count}",
            String(taxFilingsPreview.vat_months),
          )}`}
      </p>
      <p>
        {noProfit
          ? t("dashboard.sme.taxFilingsNoProfit")
          : t("dashboard.sme.taxFilingsFilledFigures")}
      </p>
    </div>
  );
}

/** "03/2025, 04/2025 +2": enough to find the gap without a wall of months. */
function listMonths(months: string[]): string {
  const shown = months.slice(0, 3).join(", ");
  return months.length > 3 ? `${shown} +${months.length - 3}` : shown;
}

/**
 * Why the year before the invoices was NOT filled in, when there is something
 * to say. Silent when it was filled (the field's own note says where the number
 * came from) and silent before either file is in (an empty upload tile already
 * says what to do). Only speaks once the SME has given us enough that the gap
 * is a surprise, or when the declarations are waiting on the invoices.
 */
function PriorYearNote() {
  const {
    priorYear,
    eInvoicePreview,
    taxFilingsPreview,
    isReadingEInvoices,
    isReadingTaxFilings,
    t,
  } = useLoanApplicationContext();

  if (isReadingEInvoices || isReadingTaxFilings) return null;

  const hasDeclarations =
    (taxFilingsPreview?.vat_monthly_revenue?.length ?? 0) > 0;
  const fill = (template: string, values: Record<string, string>) =>
    Object.entries(values).reduce(
      (text, [key, value]) => text.replace(`{${key}}`, value),
      template,
    );

  let message: string | null = null;
  let tone: "info" | "warn" = "warn";
  switch (priorYear.status) {
    case "needs_invoices":
      if (hasDeclarations) {
        message = t("dashboard.sme.priorYear.needsInvoices");
        tone = "info";
      }
      break;
    case "needs_vat":
      // Filings are in but carry no monthly declarations.
      if (taxFilingsPreview && eInvoicePreview?.revenue_last_12m != null) {
        message = t("dashboard.sme.priorYear.needsVat");
      }
      break;
    case "not_covered":
      message = fill(t("dashboard.sme.priorYear.notCovered"), {
        from: priorYear.from,
        to: priorYear.to,
        missing: listMonths(priorYear.missing),
      });
      break;
    case "no_revenue":
      message = fill(t("dashboard.sme.priorYear.noRevenue"), {
        from: priorYear.from,
        to: priorYear.to,
      });
      break;
    case "filled":
      break;
  }
  if (!message) return null;

  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border px-3 py-2.5 text-xs leading-relaxed",
        tone === "warn"
          ? "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200"
          : "border-border bg-muted/30 text-muted-foreground",
      )}
    >
      {message}
    </div>
  );
}
