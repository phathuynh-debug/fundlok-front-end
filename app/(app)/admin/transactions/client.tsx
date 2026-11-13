"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminFundingKeys,
  useAdminOverdueRepayments,
} from "@/hooks/use-admin-funding";
import { useRequireAuth } from "@/hooks/use-authentication";
import { isAdminRole } from "@/services/authentication.service";
import { useTranslations } from "@/lib/i18n";
import { CONTROL_IDLE } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ACTIVITY_GROUPS,
  FEE_INVOICE_FILTERS,
  REPAYMENT_FILTERS,
  TRANSFER_FILTERS,
  type AdminActivityGroup,
  type AdminFeeInvoice,
  type AdminFundingRound,
  type AdminRepaymentFilter,
  type AdminRoundFilter,
  type AdminTransferFilter,
  type FeeInvoiceFilter,
} from "@/services/admin-funding.service";
import { AdminPageLoader } from "../_components/AdminPageLoader";
import { ActivityLog } from "./_components/ActivityLog";
import { FeeInvoiceSheet } from "./_components/FeeInvoiceSheet";
import { FeeInvoicesTable } from "./_components/FeeInvoicesTable";
import { FundingRoundsTable } from "./_components/FundingRoundsTable";
import { LateCount, OverdueRepayments } from "./_components/OverdueRepayments";
import { RepaymentQueue } from "./_components/RepaymentQueue";
import { TransferQueue } from "./_components/TransferQueue";

type Tab = "rounds" | "transfers" | "repayments" | "fees" | "activity";

// The admin Transactions tab. "Open rounds" is every funding round taking
// investment, with what it has raised and how many of its tickets wait on
// staff. "Transfers" is every investor ticket: a receipt to read and a review
// to decide come first. Clicking a round opens its transfers. "Repayments" is
// every receipt a business uploaded when it repaid an investor, waiting ones
// first, under a red list of every ticket a business has not repaid on time
// (the tab carries their count in red from any tab). "Service fees" is each closed round's 3% (+ VAT) fee to FundLok with
// the investment package it is charged on, unpaid first; staff mark one paid
// once its transfer shows on FundLok's statement. "Activity log" is the audit
// trail: who approved or denied which transfer or repayment, when and why.
export default function AdminTransactionsClient() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const { t } = useTranslations();
  const [tab, setTab] = useState<Tab>("rounds");
  const [roundFilter, setRoundFilter] = useState<AdminRoundFilter>("OPEN");
  const [transferFilter, setTransferFilter] =
    useState<AdminTransferFilter>("ALL");
  // The round the transfer list is narrowed to, picked from the rounds table.
  const [round, setRound] = useState<{ id: string; name: string } | null>(null);
  const [repaymentFilter, setRepaymentFilter] =
    useState<AdminRepaymentFilter>("NEEDS_ACTION");
  const [activityGroup, setActivityGroup] =
    useState<AdminActivityGroup>("DECISIONS");
  const [feeFilter, setFeeFilter] = useState<FeeInvoiceFilter>("UNPAID");
  // The fee open in the side panel, kept as it stands after "mark paid" so the
  // panel shows it paid even once it leaves the Unpaid list.
  const [fee, setFee] = useState<AdminFeeInvoice | null>(null);
  // Opened from a row's "Mark as paid" button: start in the payment form.
  const [feeFocusForm, setFeeFocusForm] = useState(false);
  // Called before the admin check below (hooks cannot follow an early return),
  // so it waits for it.
  const { data: overdue } = useAdminOverdueRepayments(
    Boolean(user && isAdminRole(user.role)),
  );

  useEffect(() => {
    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !isAdminRole(user.role)) {
    return <AdminPageLoader />;
  }

  const openRound = (picked: AdminFundingRound) => {
    setRound({ id: picked.id, name: picked.project_name });
    setTransferFilter("ALL");
    setTab("transfers");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("admin.transactions.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.transactions.subtitle")}
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as Tab)}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="rounds">
            {t("admin.transactions.tabRounds")}
          </TabsTrigger>
          <TabsTrigger value="transfers">
            {t("admin.transactions.tabTransfers")}
          </TabsTrigger>
          <TabsTrigger value="repayments">
            {t("admin.transactions.tabRepayments")}
            <LateCount count={overdue?.tickets ?? 0} />
          </TabsTrigger>
          <TabsTrigger value="fees">
            {t("admin.transactions.tabFees")}
          </TabsTrigger>
          <TabsTrigger value="activity">
            {t("admin.transactions.tabActivity")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rounds">
          <div className="rounded-lg border bg-card">
            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <Select
                value={roundFilter}
                onValueChange={(value) =>
                  setRoundFilter(value as AdminRoundFilter)
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
                  <SelectItem value="OPEN">
                    {t("admin.transactions.rounds.filterOpen")}
                  </SelectItem>
                  <SelectItem value="ALL">
                    {t("admin.transactions.rounds.filterAll")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <RefetchButton queryKey={adminFundingKeys.rounds(roundFilter)} />
            </div>
            <FundingRoundsTable status={roundFilter} onOpen={openRound} />
          </div>
        </TabsContent>

        <TabsContent value="transfers">
          <div className="rounded-lg border bg-card">
            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Select
                  value={transferFilter}
                  onValueChange={(value) =>
                    setTransferFilter(value as AdminTransferFilter)
                  }
                >
                  <SelectTrigger
                    size="sm"
                    className="w-full sm:w-52"
                    aria-label={t("admin.table.status")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFER_FILTERS.map((filter) => (
                      <SelectItem key={filter} value={filter}>
                        {t(`admin.transactions.filters.${filter}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {round && (
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border bg-muted/40 py-1 pl-2.5 pr-1 text-xs text-foreground">
                    <span className="truncate">
                      {t("admin.transactions.roundChip").replace(
                        "{name}",
                        round.name,
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRound(null)}
                      className={cn(
                        "shrink-0 cursor-pointer rounded p-0.5",
                        CONTROL_IDLE,
                      )}
                      aria-label={t("admin.transactions.clearRound")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
              <RefetchButton
                queryKey={[...adminFundingKeys.all, "transfers"]}
              />
            </div>
            {/* Keyed by the filters so a change starts again on page 1. */}
            <TransferQueue
              key={`${transferFilter}:${round?.id ?? ""}`}
              status={transferFilter}
              windowId={round?.id}
            />
          </div>
        </TabsContent>

        <TabsContent value="repayments" className="flex flex-col gap-4">
          <OverdueRepayments />
          <div className="rounded-lg border bg-card">
            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <Select
                value={repaymentFilter}
                onValueChange={(value) =>
                  setRepaymentFilter(value as AdminRepaymentFilter)
                }
              >
                <SelectTrigger
                  size="sm"
                  className="w-full sm:w-52"
                  aria-label={t("admin.table.status")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPAYMENT_FILTERS.map((filter) => (
                    <SelectItem key={filter} value={filter}>
                      {t(`admin.transactions.repayments.filters.${filter}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <RefetchButton
                queryKey={[...adminFundingKeys.all, "repayments"]}
              />
            </div>
            {/* Keyed by the filter so a change starts again on page 1. */}
            <RepaymentQueue key={repaymentFilter} status={repaymentFilter} />
          </div>
        </TabsContent>

        <TabsContent value="fees">
          <div className="rounded-lg border bg-card">
            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <Select
                value={feeFilter}
                onValueChange={(value) =>
                  setFeeFilter(value as FeeInvoiceFilter)
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
                  {FEE_INVOICE_FILTERS.map((filter) => (
                    <SelectItem key={filter} value={filter}>
                      {t(`admin.transactions.fees.filters.${filter}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <RefetchButton
                queryKey={adminFundingKeys.feeInvoices(feeFilter)}
              />
            </div>
            <FeeInvoicesTable
              status={feeFilter}
              onOpen={(picked) => {
                setFeeFocusForm(false);
                setFee(picked);
              }}
              onMarkPaid={(picked) => {
                setFeeFocusForm(true);
                setFee(picked);
              }}
            />
          </div>
          <FeeInvoiceSheet
            invoice={fee}
            onOpenChange={(open) => {
              if (!open) setFee(null);
            }}
            onUpdated={setFee}
            focusForm={feeFocusForm}
          />
        </TabsContent>

        <TabsContent value="activity">
          <div className="rounded-lg border bg-card">
            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <Select
                value={activityGroup}
                onValueChange={(value) =>
                  setActivityGroup(value as AdminActivityGroup)
                }
              >
                <SelectTrigger
                  size="sm"
                  className="w-full sm:w-56"
                  aria-label={t("admin.transactions.activity.groupLabel")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {t(`admin.transactions.activity.groups.${group}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <RefetchButton queryKey={[...adminFundingKeys.all, "activity"]} />
            </div>
            <ActivityLog key={activityGroup} group={activityGroup} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RefetchButton({ queryKey }: { queryKey: readonly unknown[] }) {
  const { t } = useTranslations();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey }) > 0;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void queryClient.refetchQueries({ queryKey })}
      disabled={isFetching}
      className="gap-1.5 px-3 text-xs self-end sm:self-auto"
    >
      <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
      <span>{t("admin.table.refresh")}</span>
    </Button>
  );
}
