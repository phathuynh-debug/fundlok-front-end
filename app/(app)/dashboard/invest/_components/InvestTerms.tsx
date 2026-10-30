"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import {
  INVESTOR_TERMS_VERSION,
  type FundingWindow,
} from "@/services/funding.service";

const K = "investConfirm.terms";

// In the order the investor reads them: who the parties are, the risk, how the
// money moves, then what happens after. The window's own dates and amounts are
// filled in, never hard-coded (they are provisional, HANDOFF-04).
const RULES = [
  "notParty",
  "direct",
  "noGuarantee",
  "ownAccount",
  "exact",
  "partial",
  "repayments",
  "fees",
  "record",
] as const;

interface InvestTermsProps {
  amount: number;
  businessName: string;
  fundingWindow: FundingWindow;
  isPending: boolean;
  onAgree: () => void;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * FundLok's investing terms, and the agreement to them. Agreeing reserves the
 * amount and signs the acceptance (the backend records the terms version with
 * the signature), so the button stays disabled until the box is ticked.
 */
export function InvestTerms({
  amount,
  businessName,
  fundingWindow,
  isPending,
  onAgree,
  locale,
  t,
}: InvestTermsProps) {
  const [agreed, setAgreed] = useState(false);
  const vars = {
    business: businessName,
    months: fundingWindow.term_months,
    date: formatDate(fundingWindow.window_end, locale),
    minRaise: formatCurrency(fundingWindow.min_raise_vnd, locale),
    target: formatCurrency(fundingWindow.target_vnd, locale),
  };

  return (
    <section className="space-y-5" aria-labelledby="invest-terms-title">
      <div className="space-y-1">
        <h2
          id="invest-terms-title"
          className="flex items-center gap-2 text-lg font-bold text-foreground"
        >
          <FileText className="h-5 w-5 text-muted-foreground" />
          {t(`${K}.title`)}
        </h2>
        <p className="text-sm text-muted-foreground">{t(`${K}.intro`)}</p>
      </div>

      <ol
        className="max-h-80 space-y-3 overflow-y-auto rounded-xl border bg-muted/20 p-4 text-sm leading-relaxed text-foreground"
        data-testid="investing-terms"
      >
        {RULES.map((rule, i) => (
          <li key={rule} className="flex gap-3">
            <span className="w-5 shrink-0 font-semibold tabular-nums text-muted-foreground">
              {i + 1}.
            </span>
            <span>{t(`${K}.rules.${rule}`, vars)}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        {t(`${K}.version`, { version: INVESTOR_TERMS_VERSION })}
      </p>

      <div className="flex items-start gap-3 rounded-xl border p-4">
        <Checkbox
          id="agree-terms"
          checked={agreed}
          onCheckedChange={(value) => setAgreed(value === true)}
          disabled={isPending}
          className="mt-0.5"
        />
        <Label
          htmlFor="agree-terms"
          className="text-sm font-medium leading-relaxed text-foreground"
        >
          {t(`${K}.agree`)}
        </Label>
      </div>

      <Button
        type="button"
        className="h-12 w-full text-base font-semibold"
        disabled={!agreed || isPending}
        onClick={onAgree}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t(`${K}.submitting`)}
          </>
        ) : (
          t(`${K}.submit`, { amount: formatCurrency(amount, locale) })
        )}
      </Button>
    </section>
  );
}
