import type { Metadata } from "next";
import AdminAuditLogsClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("admin.sidebar.auditLogs"),
  };
}

export default function AdminAuditLogsPage() {
  return <AdminAuditLogsClient />;
}
