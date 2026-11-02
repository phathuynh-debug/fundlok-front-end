"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useRequireAuth } from "@/hooks/use-authentication";
import { isAdminRole } from "@/services/authentication.service";
import { useTranslations } from "@/lib/i18n";
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
  TRANSFER_FILTERS,
  type AdminActivityGroup,
  type AdminFundingRound,
  type AdminRoundFilter,
  type AdminTransferFilter,
} from "@/services/admin-funding.service";
import { AdminPageLoader } from "../_components/AdminDirectory";
import { ActivityLog } from "./_components/ActivityLog";
import { FundingRoundsTable } from "./_components/FundingRoundsTable";
import { TransferQueue } from "./_components/TransferQueue";

type Tab = "rounds" | "transfers" | "activity";

// The admin Transactions tab. "Open rounds" is every funding round taking
// investment, with what it has raised and how many of its tickets wait on
// staff. "Transfers" is every investor ticket: a receipt to read and a review
// to decide come first. Clicking a round opens its transfers. "Activity log"
// is the audit trail: who approved or denied which transfer, when and why.
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
  const [activityGroup, setActivityGroup] =
    useState<AdminActivityGroup>("DECISIONS");

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
          <TabsTrigger value="activity">
            {t("admin.transactions.tabActivity")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rounds">
          <div className="rounded-lg border bg-card">
            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
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
            </div>
            <FundingRoundsTable status={roundFilter} onOpen={openRound} />
          </div>
        </TabsContent>

        <TabsContent value="transfers">
          <div className="rounded-lg border bg-card">
            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center">
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
                    className="shrink-0 cursor-pointer rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={t("admin.transactions.clearRound")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
            {/* Keyed by the filters so a change starts again on page 1. */}
            <TransferQueue
              key={`${transferFilter}:${round?.id ?? ""}`}
              status={transferFilter}
              windowId={round?.id}
            />
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="rounded-lg border bg-card">
            <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-center">
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
            </div>
            <ActivityLog key={activityGroup} group={activityGroup} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
