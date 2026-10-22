import type {
  EInvoicePreview,
  TaxFilingsPreview,
} from "@/services/uploads.service";
import {
  LITE_FIGURE_FIELDS,
  type LiteFigureField,
  type LiteFigureKey,
} from "./lite-grading-fields";
import { priorYearRevenue } from "./prior-year-revenue";

/**
 * Every figure on step 2, read out of the two files.
 *
 * A pure function of the two previews, evaluated at read time and never stored:
 * a figure appears when the file that states it is read, and goes when that
 * file is removed or replaced, with no bookkeeping to forget. It is also why
 * nothing on the step can be typed. There is no state here to type into.
 *
 * `""` is a figure the files do not state. That is not the same as `"0"`: a
 * company that books no selling expense has a variable cost of 0, and its
 * statements say so.
 */
export function figuresFromFiles(
  invoices: EInvoicePreview | null,
  filings: TaxFilingsPreview | null,
): Record<LiteFigureKey, string> {
  const priorYear = priorYearRevenue(invoices, filings);

  return Object.fromEntries(
    LITE_FIGURE_FIELDS.map((field) => {
      const { source } = field;
      const value =
        source.from === "invoices"
          ? invoices?.[source.read]
          : source.from === "statements"
            ? filings?.[source.read]
            : priorYear.status === "filled"
              ? priorYear.total
              : null;
      return [
        field.key,
        typeof value === "number" && Number.isFinite(value)
          ? String(value)
          : "",
      ];
    }),
  ) as Record<LiteFigureKey, string>;
}

/**
 * Whether every file this figure is read from has been read. Before that, the
 * upload tile is the thing to act on: a blank figure is not yet a problem with
 * the files, so nothing is reported about it.
 */
export function figureFilesRead(
  field: LiteFigureField,
  invoices: EInvoicePreview | null,
  filings: TaxFilingsPreview | null,
): boolean {
  switch (field.source.from) {
    case "invoices":
      return invoices !== null;
    case "statements":
      return filings !== null;
    case "vat":
      return invoices !== null && filings !== null;
  }
}
