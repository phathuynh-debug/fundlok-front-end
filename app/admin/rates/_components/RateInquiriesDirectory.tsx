"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "../../_components/DataTable";
import { RateInquiryDetailSheet } from "./RateInquiryDetailSheet";
import { useRateInquiries } from "@/hooks/use-rates";
import { useTranslations } from "@/lib/i18n";
import { formatCurrency, formatCompactCurrency } from "@/lib/format-currency";
import { INDUSTRY_OPTIONS } from "@/lib/constants/industries";
import type { RateInquiryAdminItem } from "@/services/rates.service";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

export function RateInquiriesDirectory() {
  const { t } = useTranslations();
  const [page, setPage] = useState(1);
  const [industryFilter, setIndustryFilter] = useState<string>("ALL");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInquiry, setSelectedInquiry] =
    useState<RateInquiryAdminItem | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      industry: industryFilter !== "ALL" ? industryFilter : undefined,
      risk_tier: tierFilter !== "ALL" ? tierFilter : undefined,
    }),
    [page, industryFilter, tierFilter],
  );

  const { data, isLoading, isFetching, refetch } =
    useRateInquiries(queryParams);

  // Client-side search filter for ID, session, industry or revenue
  const items = useMemo(() => {
    const list = data?.items || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.id.toLowerCase().includes(q) ||
        (item.industry_display &&
          item.industry_display.toLowerCase().includes(q)) ||
        (item.industry && item.industry.toLowerCase().includes(q)) ||
        (item.session_id && item.session_id.toLowerCase().includes(q)) ||
        (item.full_name && item.full_name.toLowerCase().includes(q)) ||
        (item.company_name && item.company_name.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.phone &&
          /\d/.test(q) &&
          item.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))) ||
        (item.tier_display && item.tier_display.toLowerCase().includes(q)),
    );
  }, [data?.items, searchQuery]);

  // Aggregate summary stats
  const totalCount = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const stats = useMemo(() => {
    const all = data?.items || [];
    let tierA = 0;
    let tierB = 0;
    let tierC = 0;
    let totalDemand = 0;

    for (const item of all) {
      const tier = (item.risk_tier || "").toUpperCase();
      if (tier.includes("A")) tierA++;
      else if (tier.includes("B")) tierB++;
      else tierC++;

      totalDemand += item.requested_amount || 0;
    }

    return { tierA, tierB, tierC, totalDemand };
  }, [data?.items]);

  const columns: Column<RateInquiryAdminItem>[] = [
    {
      key: "created_at",
      header: t("admin.ratesTable.dateTime"),
      cellClassName:
        "whitespace-nowrap font-mono text-xs text-muted-foreground",
      render: (item) => item.created_at_formatted || item.created_at || "—",
    },
    {
      key: "contact",
      header: t("admin.ratesTable.contact"),
      cellClassName: "text-xs",
      // Who to call back. Inquiries from before the form asked have none.
      render: (item) =>
        item.full_name || item.email || item.phone ? (
          <div className="space-y-0.5">
            {item.full_name && (
              <p className="truncate font-medium text-foreground">
                {item.full_name}
              </p>
            )}
            {item.company_name && (
              <p className="truncate text-muted-foreground">
                {item.company_name}
              </p>
            )}
            {item.email && (
              <a
                href={`mailto:${item.email}`}
                className="block truncate text-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {item.email}
              </a>
            )}
            {item.phone && (
              <a
                href={`tel:${item.phone.replace(/[^0-9+]/g, "")}`}
                className="block whitespace-nowrap font-mono text-muted-foreground hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {item.phone}
              </a>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "industry",
      header: t("admin.ratesTable.industry"),
      render: (item) => (
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
          {item.industry_display || item.industry}
        </span>
      ),
    },
    {
      key: "tenure_staff",
      header: t("admin.ratesTable.tenureStaff"),
      cellClassName: "text-xs text-muted-foreground whitespace-nowrap",
      render: (item) =>
        item.tenure_staff_display ||
        `${item.operating_months} mos / ${item.employee_count} staff`,
    },
    {
      key: "revenue",
      header: t("admin.ratesTable.revenueL12m"),
      cellClassName: "text-xs font-semibold text-foreground whitespace-nowrap",
      render: (item) =>
        item.revenue_l12m_formatted || formatCurrency(item.revenue_l12m),
    },
    {
      key: "yoy_growth",
      header: t("admin.ratesTable.yoyGrowth"),
      cellClassName: "whitespace-nowrap",
      render: (item) => {
        const isPositive = (item.yoy_growth_pct ?? 0) >= 0;
        return (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold",
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
            )}
          >
            {item.yoy_growth_display ||
              `${isPositive ? "+" : ""}${item.yoy_growth_pct ?? 0}%`}
          </span>
        );
      },
    },
    {
      key: "loan_ask",
      header: t("admin.ratesTable.loanAsk"),
      cellClassName: "whitespace-nowrap text-xs font-bold text-foreground",
      render: (item) =>
        item.loan_ask_display ||
        `${formatCompactCurrency(item.requested_amount)} / ${item.tenor_months} mos`,
    },
    {
      key: "rate",
      header: t("admin.ratesTable.calculatedRate"),
      cellClassName: "whitespace-nowrap text-xs font-medium text-primary",
      render: (item) =>
        item.calculated_rate_display ||
        `${item.estimated_rate_min}% - ${item.estimated_rate_max}% / mo`,
    },
    {
      key: "tier",
      header: t("admin.ratesTable.tier"),
      cellClassName: "whitespace-nowrap",
      render: (item) => {
        const tier = (item.risk_tier ?? "").toUpperCase();
        if (tier.includes("A")) {
          return (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold"
            >
              {item.tier_display || "Tier A"}
            </Badge>
          );
        }
        if (tier.includes("B")) {
          return (
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs font-semibold"
            >
              {item.tier_display || "Tier B"}
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 text-xs font-semibold"
          >
            {item.tier_display || "Tier C"}
          </Badge>
        );
      },
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
            setSelectedInquiry(item);
          }}
          className="h-8 gap-1 text-xs font-medium text-primary hover:bg-primary/10"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>{t("admin.ratesTable.viewDetails")}</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">
              {t("admin.ratesSummary.totalInquiries")}
            </span>
            <Calculator className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {totalCount}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("admin.ratesSummary.lifetimeInquiries")}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">
              {t("admin.ratesSummary.tierA")}
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats.tierA}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("admin.ratesSummary.tierADesc")}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">
              {t("admin.ratesSummary.tierB")}
            </span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            {stats.tierB}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("admin.ratesSummary.tierBDesc")}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">
              {t("admin.ratesSummary.sampleDemand")}
            </span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {stats.totalDemand > 0
              ? formatCompactCurrency(stats.totalDemand)
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("admin.ratesSummary.pageDemand")}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border bg-card p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("admin.ratesTable.searchPlaceholder")}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Industry Filter */}
            <Select
              value={industryFilter}
              onValueChange={(val) => {
                setIndustryFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue
                  placeholder={t("admin.ratesTable.allIndustries")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("admin.ratesTable.allIndustries")}
                </SelectItem>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(`projectApplication.industries.${opt.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Risk Tier Filter */}
            <Select
              value={tierFilter}
              onValueChange={(val) => {
                setTierFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-32 text-xs">
                <SelectValue placeholder={t("admin.ratesTable.allTiers")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("admin.ratesTable.allTiers")}
                </SelectItem>
                <SelectItem value="TIER_A">Tier A</SelectItem>
                <SelectItem value="TIER_B">Tier B</SelectItem>
                <SelectItem value="TIER_C">Tier C</SelectItem>
              </SelectContent>
            </Select>

            {/* Refetch Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 px-3 gap-1.5 text-xs"
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

      {/* Main Table */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <DataTable<RateInquiryAdminItem>
          columns={columns}
          rows={items}
          getRowKey={(row) => row.id}
          isLoading={isLoading}
          isFetching={isFetching}
          emptyMessage={t("admin.ratesTable.empty")}
          onRowClick={(row) => setSelectedInquiry(row)}
          getRowLabel={(row) =>
            `${row.industry_display || row.industry} - ${row.created_at_formatted}`
          }
        />

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
            <div>
              {t("admin.ratesTable.pageInfo", {
                current: page,
                total: totalPages,
                count: totalCount,
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

      {/* Detail Slide-over Sheet */}
      <RateInquiryDetailSheet
        inquiry={selectedInquiry}
        open={Boolean(selectedInquiry)}
        onOpenChange={(open) => {
          if (!open) setSelectedInquiry(null);
        }}
      />
    </div>
  );
}
