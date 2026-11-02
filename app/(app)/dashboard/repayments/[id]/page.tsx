import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";
import RepaymentClient from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("seo.repaymentTitle"),
    description: t("seo.repaymentDescription"),
  };
}

// One investment in the business's round, at /dashboard/repayments/<ticket
// id>: what it repays that investor, ticket by ticket, and paying today's.
export default async function RepaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RepaymentClient trancheId={id} />;
}
