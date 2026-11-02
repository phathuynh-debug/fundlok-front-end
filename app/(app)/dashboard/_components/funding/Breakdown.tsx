"use client";

import { formatCurrency } from "@/lib/format-currency";
import { useTranslations } from "@/lib/i18n";

// What one repayment is made of: the investor's money coming back, the
// interest, and the personal income tax withheld, which is 5% of the interest
// only (never of the money coming back). Shared by the business's and the
// investor's views, so both read the same way.
export function Breakdown({
  row,
}: {
  row: {
    principal_vnd: number;
    interest_vnd: number;
    tax_withheld_vnd: number;
  };
}) {
  const { t, locale } = useTranslations();
  const money = (vnd: number) => formatCurrency(vnd, locale);
  return (
    <span
      className="block text-[11px] leading-snug text-muted-foreground"
      data-testid="repayment-breakdown"
    >
      {row.tax_withheld_vnd > 0
        ? t("dashboard.repaymentBreakdown.withTax", {
            principal: money(row.principal_vnd),
            interest: money(row.interest_vnd),
            tax: money(row.tax_withheld_vnd),
          })
        : t("dashboard.repaymentBreakdown.noTax", {
            principal: money(row.principal_vnd),
            interest: money(row.interest_vnd),
          })}
    </span>
  );
}
