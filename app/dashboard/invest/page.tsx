"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Banknote,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const { t, locale } = useTranslations();
  const { isLoading } = useRequireAuth();

  const amount = Number(searchParams.get("amount") || 0);
  const [isPending, setIsPending] = useState(false);
  const [done, setDone] = useState(false);

  const formattedAmount = formatCurrency(amount, locale);

  const handleConfirm = () => {
    setIsPending(true);
    // Mock settlement — no real order is placed yet. Kept as a stand-in until
    // the marketplace order endpoint exists.
    setTimeout(() => {
      setIsPending(false);
      setDone(true);
      toast({
        title: t("investConfirm.successTitle"),
        description: t("investConfirm.successDescription").replace(
          "{amount}",
          formattedAmount,
        ),
      });
    }, 1200);
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
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("investConfirm.amountLabel")}
          </p>
          <p className="mt-1 flex items-center gap-1 text-3xl font-bold text-foreground">
            <Banknote className="h-6 w-6" />
            {formatCurrency(amount, locale)}
          </p>
        </div>

        {done ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-4 text-sm font-semibold text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            {t("investConfirm.doneHint")}
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

        {done && (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={() => router.push("/dashboard")}
          >
            {t("investConfirm.goToDashboard")}
          </Button>
        )}
      </Card>
    </div>
  );
}
