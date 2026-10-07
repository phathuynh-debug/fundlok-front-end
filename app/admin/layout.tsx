import type { Metadata } from "next";
import { AdminSidebar } from "./_components/AdminSidebar";
import { AdminHeader } from "./_components/AdminHeader";
import { getServerTranslations } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    // A plain string here would stop the root "%s | FundLok" template from
    // reaching the pages below, so re-declare it for this section.
    title: { default: t("seo.adminTitle"), template: "%s | FundLok" },
    description: t("seo.adminDescription"),
  };
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Persistent Admin Sidebar (desktop) */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto bg-background focus:outline-none">
        {/* Top bar: mobile navigation drawer + language and theme switchers */}
        <AdminHeader />

        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
