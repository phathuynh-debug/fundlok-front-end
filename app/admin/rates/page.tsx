"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-authentication";
import { isAdminRole } from "@/services/authentication.service";
import { useTranslations } from "@/lib/i18n";
import { AdminPageLoader } from "../_components/AdminDirectory";
import { RateInquiriesDirectory } from "./_components/RateInquiriesDirectory";
import { InvestorLeadsDirectory } from "./_components/InvestorLeadsDirectory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminRatesPage() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const { t } = useTranslations();

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
          {t("admin.ratesPage.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.ratesPage.subtitle")}
        </p>
      </div>

      <Tabs defaultValue="sme" className="gap-6">
        <TabsList>
          <TabsTrigger value="sme">{t("admin.ratesPage.tabSme")}</TabsTrigger>
          <TabsTrigger value="investor">
            {t("admin.ratesPage.tabInvestor")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sme">
          <RateInquiriesDirectory />
        </TabsContent>
        <TabsContent value="investor">
          <InvestorLeadsDirectory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
