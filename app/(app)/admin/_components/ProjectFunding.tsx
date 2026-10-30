"use client";

import { Landmark, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOpenProjectForFunding } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { enumLabel } from "@/lib/enum-labels";
import { formatCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import type { FundingWindow } from "@/services/funding.service";

const K = "admin.projectFunding";

// Why a project cannot open, by the X-Error-Code the backend sends.
const KNOWN_ERRORS = new Set([
  "ACCOUNT_NOT_APPROVED",
  "BORROWER_CAP_EXCEEDED",
  "LISTING_NOT_OPENABLE",
  "PROJECT_NOT_LIVE",
  "RATE_ABOVE_CAP",
  "SME_INVOICE_UNPAID",
  "TARGET_ABOVE_CAP",
  "TERMS_NOT_LOCKED",
]);

const LIVE = new Set(["OPEN", "FULL", "CLOSING", "REPAYING"]);

interface ProjectFundingProps {
  projectId: string;
  projectStatus: string;
  fundingWindow: FundingWindow | null;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * The project's funding window in the admin panel: its status and totals, or,
 * for a live project that has none, the button that opens it. A project opens
 * on its own when its business's bank account is approved; the button is for
 * one that went live before that rule, or could not open then (the toast says
 * why it still cannot).
 */
export function ProjectFunding({
  projectId,
  projectStatus,
  fundingWindow,
  locale,
  t,
}: ProjectFundingProps) {
  const { toast } = useToast();
  const open = useOpenProjectForFunding(projectId);
  const live = fundingWindow !== null && LIVE.has(fundingWindow.status);

  const handleOpen = () =>
    open.mutate(undefined, {
      onSuccess: () => toast({ title: t(`${K}.opened`) }),
      onError: (error) => {
        const code = error.code ?? "";
        toast({
          variant: "destructive",
          title: t(`${K}.openFailed`),
          description: t(
            KNOWN_ERRORS.has(code)
              ? `${K}.errors.${code}`
              : `${K}.errors.generic`,
          ),
        });
      },
    });

  return (
    <section className="space-y-3" data-testid="admin-project-funding">
      <h3 className="text-sm font-semibold">{t(`${K}.heading`)}</h3>
      {fundingWindow ? (
        <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {enumLabel(t, "fundingWindowStatus", fundingWindow.status)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t(`${K}.closes`, {
                date: formatDate(fundingWindow.window_end, locale),
              })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(`${K}.progress`, {
              confirmed: formatCurrency(fundingWindow.confirmed_vnd, locale),
              reserved: formatCurrency(fundingWindow.reserved_vnd, locale),
              target: formatCurrency(fundingWindow.target_vnd, locale),
            })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t(`${K}.none`)}</p>
      )}
      {!live && projectStatus === "ACTIVE" && (
        <div className="space-y-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpen}
            disabled={open.isPending}
          >
            {open.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Landmark className="h-4 w-4" aria-hidden />
            )}
            {open.isPending ? t(`${K}.opening`) : t(`${K}.open`)}
          </Button>
          <p className="text-xs text-muted-foreground">{t(`${K}.hint`)}</p>
        </div>
      )}
    </section>
  );
}
