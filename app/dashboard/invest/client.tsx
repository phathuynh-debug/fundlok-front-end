"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TruncatedFigure } from "@/components/truncated-figure";
import { useRequireAuth } from "@/hooks/use-authentication";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency } from "@/lib/format-currency";
import { CONTROL_IDLE } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

// Mock "invest" route. Its real purpose is to be a KYC-gated destination: the
// proxy only lets an approved INVESTOR reach it, bouncing anyone unverified to
// /kyc?next=/dashboard/invest first. Reached from the Invest button on a
// project's detail page, carrying the amount (and projectId) as query params.
export default function InvestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useTranslations();
  const { isLoading } = useRequireAuth();

  const amount = Number(searchParams.get("amount") || 0);
  const [isPending, setIsPending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const formattedAmount = formatCurrency(amount, locale);

  const handleConfirm = () => {
    setIsPending(true);
    // Platform does not have a payment gateway integrated yet.
    // Rather than reporting a successful investment, inform the investor
    // via a modal dialog and an inline notification.
    setTimeout(() => {
      setIsPending(false);
      setAttempted(true);
      setDialogOpen(true);
    }, 600);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-4">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className={cn("-ml-2 gap-2", CONTROL_IDLE)}
      >
        <Link href="/dashboard/projects">
          <ArrowLeft className="h-4 w-4" />
          {t("investConfirm.back")}
        </Link>
      </Button>

      <Card className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
          <ShieldCheck className="h-4 w-4" />
          {t("investConfirm.verifiedBadge")}
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("investConfirm.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("investConfirm.subtitle")}
          </p>
        </div>

        <div className="rounded-xl border bg-muted/30 p-5">
          <p className="stat-label">{t("investConfirm.amountLabel")}</p>
          {/* `vi-VN` puts a non-breaking space before the ₫, so the whole
              figure is one unbreakable token — at 3xl a ten-digit amount is
              wider than this card and pushes the page into horizontal scroll.
              The responsive scale keeps the largest allowed loan (5bn VND)
              inside the card at every breakpoint; TruncatedFigure is the
              last-resort guard, and it keeps the full number reachable on
              hover/focus rather than hiding it behind an ellipsis — which
              matters here more than anywhere, since this is the figure the
              investor is confirming. */}
          <div className="mt-1 flex items-center gap-1 text-foreground">
            <Banknote className="h-6 w-6 shrink-0" />
            <TruncatedFigure
              value={formattedAmount}
              className="text-2xl font-bold sm:text-3xl"
            />
          </div>
        </div>

        {attempted ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {t("investConfirm.unavailableTitle")}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("investConfirm.unavailableDescription")}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="h-11 flex-1"
                onClick={() => router.push("/dashboard/projects")}
              >
                {t("investConfirm.unavailableAction")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                onClick={() => setDialogOpen(true)}
              >
                {t("investConfirm.viewDetailsNotice")}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            className="h-12 w-full text-base font-semibold"
            disabled={isPending || amount <= 0}
            onClick={handleConfirm}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("investConfirm.processing")}
              </>
            ) : (
              t("investConfirm.confirmBtn")
            )}
          </Button>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold">
              {t("investConfirm.unavailableTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {t("investConfirm.unavailableDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex-col gap-2 sm:flex-col">
            <Button
              className="w-full"
              onClick={() => router.push("/dashboard/projects")}
            >
              {t("investConfirm.unavailableAction")}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setDialogOpen(false)}
            >
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
