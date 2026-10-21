import type { Metadata } from "next";
import AdminKycReviewsClient from "./client";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("admin.sidebar.kycReviews"),
  };
}

export default function AdminKycReviewsPage() {
  return <AdminKycReviewsClient />;
}
