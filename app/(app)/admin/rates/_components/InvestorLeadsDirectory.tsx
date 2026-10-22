"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "../../_components/DataTable";
import { InvestorLeadDetailSheet } from "./InvestorLeadDetailSheet";
import { useInvestorLeads } from "@/hooks/use-rates";
import { useTranslations } from "@/lib/i18n";
import { formatCompactCurrency } from "@/lib/format-currency";
import type {
  InvestorLeadAdminItem,
  InvestorRiskTier,
} from "@/services/rates.service";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

/**
 * Leads from the investor tab of /rate. Search runs on the SERVER (name,
 * email, reference), unlike the SME table's page-local filter: a sales call
 * starts from "find Nguyễn Văn A", and a filter over one page of fifteen rows
 * would answer "not found" for anyone on page two.
 */
export function InvestorLeadsDirectory() {
  const { t, locale } = useTranslations();
  const [page, setPage] = useState(1);
  const [tier, setTier] = useState<"ALL" | InvestorRiskTier>("ALL");
  const [status, setStatus] = useState<"ALL" | "SIGNED" | "NOT_SIGNED">("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InvestorLeadAdminItem | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const params = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      search: search || undefined,
      risk_tier: tier !== "ALL" ? tier : undefined,
      signed_up:
        status === "SIGNED"
          ? true
          : status === "NOT_SIGNED"
            ? false
            : undefined,
    }),
    [page, search, tier, status],
  );

  const { data, isLoading, isFetching, refetch } = useInvestorLeads(params);
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageStats = useMemo(() => {
    let signed = 0;
    let capital = 0;
    for (const item of items) {
      if (item.signed_up_at) signed += 1;
      capital += item.signup_amount_vnd ?? item.amount_vnd;
    }
    return { signed, capital };
  }, [items]);

  const dateTime = (iso: string) =>
    new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));

  const columns: Column<InvestorLeadAdminItem>[] = [
    {
      key: "created_at",
      header: t("admin.investorLeads.col.date"),
      cellClassName:
        "whitespace-nowrap font-mono text-xs text-muted-foreground",
      render: (item) => dateTime(item.created_at),
    },
    {
      key: "reference",
      header: t("admin.investorLeads.col.reference"),
      cellClassName: "whitespace-nowrap font-mono text-xs",
      render: (item) => item.reference,
    },
    {
      key: "contact",
      header: t("admin.investorLeads.col.contact"),
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.email}
            {item.phone ? ` · ${item.phone}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: t("admin.investorLeads.col.amount"),
      cellClassName: "whitespace-nowrap text-xs font-semibold",
      render: (item) =>
        `${formatCompactCurrency(item.amount_vnd, locale)} / ${item.commitment_months} ${t("admin.investorLeads.months")}`,
    },
    {
      key: "tier",
      header: t("admin.investorLeads.col.tier"),
      cellClassName: "whitespace-nowrap text-xs",
      render: (item) => t(`ratePage.investor.tier.${item.risk_tier}`),
    },
    {
      key: "apy",
      header: t("admin.investorLeads.col.netApy"),
      cellClassName:
        "whitespace-nowrap font-mono text-xs font-medium text-primary",
      render: (item) => `${item.net_apy_pct.toFixed(2)}%`,
    },
    {
      key: "status",
      header: t("admin.investorLeads.col.status"),
      cellClassName: "whitespace-nowrap",
      render: (item) =>
        item.signed_up_at ? (
          <Badge
            variant="outline"
            className="border-emerald-500/20 bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
          >
            {t("admin.investorLeads.signedUp")}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {t("admin.investorLeads.calculatedOnly")}
          </Badge>
        ),
    },
    {
      key: "actions",
      header: t("admin.ratesTable.actions"),
      cellClassName: "text-right whitespace-nowrap",
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelected(item);
          }}
          className="h-8 gap-1 text-xs font-medium text-primary hover:bg-primary/10"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{t("admin.ratesTable.viewDetails")}</span>
        </Button>
      ),
    },
  ];

  const stat = (
    label: string,
    value: string | number,
    hint: string,
    Icon: typeof Users,
  ) => (
    <div className="space-y-1 rounded-xl border bg-card p-4 shadow-2xs">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stat(
          t("admin.investorLeads.stat.total"),
          total,
          t("admin.investorLeads.stat.totalHint"),
          Users,
        )}
        {stat(
          t("admin.investorLeads.stat.signed"),
          pageStats.signed,
          t("admin.investorLeads.stat.pageHint"),
          UserCheck,
        )}
        {stat(
          t("admin.investorLeads.stat.capital"),
          pageStats.capital > 0
            ? formatCompactCurrency(pageStats.capital, locale)
            : "—",
          t("admin.investorLeads.stat.pageHint"),
          Wallet,
        )}
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-2xs">
        <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={120}
              placeholder={t("admin.investorLeads.searchPlaceholder")}
              className="h-9 pl-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={tier}
              onValueChange={(value) => {
                setTier(value as typeof tier);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("admin.investorLeads.allTiers")}
                </SelectItem>
                {(["conservative", "balanced", "growth"] as const).map(
                  (option) => (
                    <SelectItem key={option} value={option}>
                      {t(`ratePage.investor.tier.${option}`)}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as typeof status);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("admin.investorLeads.allStatuses")}
                </SelectItem>
                <SelectItem value="SIGNED">
                  {t("admin.investorLeads.signedUp")}
                </SelectItem>
                <SelectItem value="NOT_SIGNED">
                  {t("admin.investorLeads.calculatedOnly")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 gap-1.5 px-3 text-xs"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
              />
              <span className="hidden sm:inline">
                {t("admin.ratesTable.refresh")}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-2xs">
        <DataTable<InvestorLeadAdminItem>
          columns={columns}
          rows={items}
          getRowKey={(row) => row.id}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyMessage={t("admin.investorLeads.empty")}
          onRowClick={(row) => setSelected(row)}
          getRowLabel={(row) => `${row.reference} ${row.full_name}`}
        />
        {total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
            <div>
              {t("admin.ratesTable.pageInfo", {
                current: page,
                total: totalPages,
                count: total,
              })}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
                className="h-8 px-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <InvestorLeadDetailSheet
        lead={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
