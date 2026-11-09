import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ANNEX_COLUMNS,
  ANNEX_HEADING,
  ANNEX_ROWS,
  contractNumber,
} from "@/lib/legal/investor-agreement";
import { formatDate } from "@/lib/format-date";
import type { InvestmentConfirmation } from "@/services/funding.service";

const K = "investConfirm.confirmation";

interface InvestmentConfirmationTableProps {
  confirmation: InvestmentConfirmation | undefined;
  isLoading: boolean;
  onRetry: () => void;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * The Investment Confirmation (the Annex of the Investor Service Agreement)
 * this commitment signs, filled in by the backend exactly as it will sign it.
 * Row labels are the contract's own, in both languages.
 */
export function InvestmentConfirmationTable({
  confirmation,
  isLoading,
  onRetry,
  locale,
  t,
}: InvestmentConfirmationTableProps) {
  let rows: [string, string][] | null = null;
  if (confirmation) {
    rows = [
      [ANNEX_ROWS.listing, confirmation.listing_ref],
      [ANNEX_ROWS.sme, confirmation.sme_name],
      [
        ANNEX_ROWS.amount,
        t(`${K}.amountValue`, {
          amount: contractNumber(confirmation.amount_vnd),
        }),
      ],
      [
        ANNEX_ROWS.rateTerm,
        t(`${K}.rateTermValue`, {
          rate: contractNumber(confirmation.annual_rate_pct),
          months: confirmation.term_months,
        }),
      ],
      [
        ANNEX_ROWS.fee,
        t(`${K}.feeValue`, {
          fee: contractNumber(confirmation.service_fee_vnd),
        }),
      ],
      [
        ANNEX_ROWS.disbursement,
        // A calendar date: read as local midnight, so it never shifts a day.
        formatDate(
          `${confirmation.expected_disbursement_date}T00:00:00`,
          locale,
        ),
      ],
    ];
  }

  return (
    <section className="space-y-3" aria-labelledby="investment-confirmation">
      <div className="space-y-1">
        <h3
          id="investment-confirmation"
          className="text-base font-bold text-foreground"
        >
          {t(`${K}.title`)}
        </h3>
        <p className="text-sm text-muted-foreground">{t(`${K}.intro`)}</p>
      </div>
      {rows ? (
        <div className="overflow-x-auto rounded-xl border">
          <table
            className="w-full text-sm"
            data-testid="investment-confirmation-table"
          >
            <caption className="sr-only">{ANNEX_HEADING}</caption>
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {ANNEX_COLUMNS.item}
                </th>
                <th scope="col" className="px-4 py-2 font-semibold">
                  {ANNEX_COLUMNS.value}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th
                    scope="row"
                    className="px-4 py-2.5 text-left font-normal text-muted-foreground"
                  >
                    {label}
                  </th>
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center rounded-xl border p-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">
            {t(`${K}.loadFailed`)}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            {t("investConfirm.agreement.retry")}
          </Button>
        </div>
      )}
    </section>
  );
}
