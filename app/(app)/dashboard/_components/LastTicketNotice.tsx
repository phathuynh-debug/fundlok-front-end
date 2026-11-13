import { Info } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

const K = "investment.lastTicket";

/**
 * What is left on a round is below its minimum ticket: the backend then takes
 * one last ticket of exactly that amount, and no other (funding-window.md
 * I-6). On the project page it tells the investor so; in the invest flow,
 * `completes` says their ticket is that last one, and why it may be below the
 * minimum.
 */
export function LastTicketNotice({
  amountVnd,
  minTicketVnd,
  completes = false,
  locale,
  t,
}: {
  amountVnd: number;
  minTicketVnd: number;
  completes?: boolean;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const vars = {
    amount: formatCurrency(amountVnd, locale),
    min: formatCurrency(minTicketVnd, locale),
  };
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm"
      data-testid="last-ticket-notice"
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div className="space-y-1">
        <p className="font-semibold text-foreground">
          {t(completes ? `${K}.completesTitle` : `${K}.title`, vars)}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(completes ? `${K}.completesBody` : `${K}.body`, vars)}
        </p>
      </div>
    </div>
  );
}
