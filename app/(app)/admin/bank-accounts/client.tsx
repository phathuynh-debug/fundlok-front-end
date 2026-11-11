"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-authentication";
import { useAdminPaymentAccounts } from "@/hooks/use-admin";
import { isAdminRole } from "@/services/authentication.service";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminPaymentAccountFilter } from "@/services/admin.service";
import { AdminPageLoader } from "../_components/AdminPageLoader";
import { BankAccountReviewItem } from "../_components/BankAccountReviewItem";

const K = "admin.bankAccounts";
const FILTERS: AdminPaymentAccountFilter[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ALL",
];

// The bank-account review queue: the accounts SMEs and investors saved, oldest
// first, waiting for an admin by default. Only an approved account lists an
// SME's project or lets an investor invest.
export default function AdminBankAccountsClient() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const { t, locale } = useTranslations();
  const [status, setStatus] = useState<AdminPaymentAccountFilter>("PENDING");
  const isAdmin = !isLoading && !!user && isAdminRole(user.role);
  const accounts = useAdminPaymentAccounts(status);

  useEffect(() => {
    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (!isAdmin) {
    return <AdminPageLoader />;
  }

  const list = accounts.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t(`${K}.title`)}
        </h1>
        <p className="text-sm text-muted-foreground">{t(`${K}.subtitle`)}</p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as AdminPaymentAccountFilter)
            }
          >
            <SelectTrigger
              size="sm"
              className="w-full sm:w-48"
              aria-label={t("admin.table.status")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTERS.map((filter) => (
                <SelectItem key={filter} value={filter}>
                  {t(`${K}.filters.${filter}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void accounts.refetch()}
            disabled={accounts.isFetching}
            className="gap-1.5 px-3 text-xs self-end sm:self-auto"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                accounts.isFetching && "animate-spin",
              )}
            />
            <span>{t("admin.table.refresh")}</span>
          </Button>
        </div>

        <div className="p-4">
          {accounts.isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {accounts.isError && (
            <p role="alert" className="text-sm text-destructive">
              {t(`${K}.loadFailed`)}
            </p>
          )}
          {accounts.isSuccess && list.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t(`${K}.empty.${status}`)}
            </p>
          )}
          {list.length > 0 && (
            <ul className="space-y-3">
              {list.map((account) => (
                <BankAccountReviewItem
                  key={account.id}
                  account={account}
                  showOwner
                  locale={locale}
                  t={t}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
