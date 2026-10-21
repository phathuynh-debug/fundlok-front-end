"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-authentication";
import { useVerificationMode } from "@/hooks/use-gverify";
import { isAdminRole } from "@/services/authentication.service";
import { useTranslations } from "@/lib/i18n";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageLoader } from "../_components/AdminDirectory";
import { KycReviewQueue } from "./_components/KycReviewQueue";
import { KybReviewQueue } from "./_components/KybReviewQueue";

type ReviewKind = "kyc" | "kyb";

export default function AdminKycReviewsPage() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const { t } = useTranslations();
  const isAdmin = !isLoading && !!user && isAdminRole(user.role);
  const { data: mode } = useVerificationMode(isAdmin);
  const [kind, setKind] = useState<ReviewKind>("kyc");

  useEffect(() => {
    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !isAdminRole(user.role)) {
    return <AdminPageLoader />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("admin.kycReviews.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.kycReviews.subtitle")}
        </p>
      </div>

      {/* While a system admin has verification in MANUAL mode, nothing is
          checked automatically: every new submission waits here. */}
      {mode?.mode === "MANUAL" && (
        <p
          role="status"
          className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm leading-relaxed text-foreground"
        >
          <UserCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <span>{t("admin.kycReviews.manualBanner")}</span>
        </p>
      )}

      <Tabs
        value={kind}
        onValueChange={(value) => setKind(value as ReviewKind)}
      >
        <TabsList>
          <TabsTrigger value="kyc">{t("admin.kycReviews.kindKyc")}</TabsTrigger>
          <TabsTrigger value="kyb">{t("admin.kycReviews.kindKyb")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {kind === "kyc" ? <KycReviewQueue /> : <KybReviewQueue />}
    </div>
  );
}
