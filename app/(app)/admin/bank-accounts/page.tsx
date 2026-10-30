import type { Metadata } from "next";
import AdminBankAccountsClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("admin.sidebar.bankAccounts"),
  };
}

export default function AdminBankAccountsPage() {
  return <AdminBankAccountsClient />;
}
