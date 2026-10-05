"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Loader2,
  Mail,
  Phone,
  Wallet,
} from "lucide-react";
import { useInvestorLeads, useRateInquiries } from "@/hooks/use-rates";
import { formatCompactCurrency } from "@/lib/format-currency";
import { formatDate } from "@/lib/format-date";
import { CONTROL_HOVER } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

const LATEST = 5;

/** A clickable email and phone, or a dash when the lead predates the fields. */
function Contact({
  email,
  phone,
}: {
  email: string | null | undefined;
  phone: string | null | undefined;
}) {
  if (!email && !phone)
    return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex min-w-0 flex-col gap-0.5 text-xs">
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex min-w-0 items-center gap-1.5 text-foreground hover:underline"
        >
          <Mail
            className="h-3 w-3 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="truncate">{email}</span>
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
          className="flex items-center gap-1.5 font-mono text-muted-foreground hover:underline"
        >
          <Phone className="h-3 w-3 shrink-0" aria-hidden />
          {phone}
        </a>
      )}
    </div>
  );
}

function Panel({
  icon: Icon,
  title,
  total,
  href,
  viewAll,
  loading,
  empty,
  children,
  testId,
}: {
  icon: typeof Building2;
  title: string;
  total: number | undefined;
  href: string;
  viewAll: string;
  loading: boolean;
  empty: string | null;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <section
      data-testid={testId}
      className="flex flex-col rounded-lg border bg-card"
    >
      <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {total !== undefined && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {total}
            </span>
          )}
        </div>
        <Link
          href={href}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground",
            CONTROL_HOVER,
          )}
        >
          {viewAll}
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : empty ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="divide-y">{children}</ul>
      )}
    </section>
  );
}

/**
 * The latest people who asked for a rate on the public /rate page — both
 * tabs — with how to reach them, so the team can follow up from the overview.
 * Every contact here was given with consent (the forms require it). The full,
 * searchable lists live on /admin/rates.
 */
export function RecentLeads({
  enabled,
  locale,
  t,
}: {
  enabled: boolean;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const inquiries = useRateInquiries({ page: 1, page_size: LATEST }, enabled);
  const leads = useInvestorLeads({ page: 1, page_size: LATEST }, enabled);

  const smeItems = inquiries.data?.items ?? [];
  const investorItems = leads.data?.items ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel
        testId="recent-sme-leads"
        icon={Building2}
        title={t("admin.recentLeads.smeTitle")}
        total={inquiries.data?.total}
        href="/admin/rates?tab=sme"
        viewAll={t("admin.recentLeads.viewAll")}
        loading={inquiries.isLoading}
        empty={
          inquiries.isError
            ? t("admin.recentLeads.error")
            : smeItems.length === 0
              ? t("admin.recentLeads.empty")
              : null
        }
      >
        {smeItems.map((item) => (
          <li
            key={item.id}
            className="grid grid-cols-[1fr_auto] items-start gap-3 px-5 py-3"
          >
            <div className="min-w-0 space-y-1">
              {item.full_name && (
                <p className="truncate text-sm font-medium text-foreground">
                  {item.full_name}
                  {item.company_name && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · {item.company_name}
                    </span>
                  )}
                </p>
              )}
              <Contact email={item.email} phone={item.phone} />
              <p className="truncate text-[11px] text-muted-foreground">
                {item.industry_display || item.industry} ·{" "}
                {item.loan_ask_display}
              </p>
            </div>
            <span className="whitespace-nowrap text-[11px] text-muted-foreground">
              {formatDate(item.created_at, locale)}
            </span>
          </li>
        ))}
      </Panel>

      <Panel
        testId="recent-investor-leads"
        icon={Wallet}
        title={t("admin.recentLeads.investorTitle")}
        total={leads.data?.total}
        href="/admin/rates?tab=investor"
        viewAll={t("admin.recentLeads.viewAll")}
        loading={leads.isLoading}
        empty={
          leads.isError
            ? t("admin.recentLeads.error")
            : investorItems.length === 0
              ? t("admin.recentLeads.empty")
              : null
        }
      >
        {investorItems.map((item) => (
          <li
            key={item.id}
            className="grid grid-cols-[1fr_auto] items-start gap-3 px-5 py-3"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium text-foreground">
                {item.full_name}
              </p>
              <Contact email={item.email} phone={item.phone} />
              <p className="truncate text-[11px] text-muted-foreground">
                {formatCompactCurrency(
                  item.signup_amount_vnd ?? item.amount_vnd,
                  locale,
                )}{" "}
                ·{" "}
                {t("admin.recentLeads.months", {
                  count:
                    item.signup_commitment_months ?? item.commitment_months,
                })}{" "}
                · <span className="font-mono">{item.reference}</span>
              </p>
            </div>
            <span className="whitespace-nowrap text-[11px] text-muted-foreground">
              {formatDate(item.created_at, locale)}
            </span>
          </li>
        ))}
      </Panel>
    </div>
  );
}
