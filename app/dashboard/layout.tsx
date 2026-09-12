import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { ProductTour, ProductTourProvider } from "@/components/product-tour";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Manage your capital requirements, review matching projects, and track on-chain investments.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The provider wraps the sidebar AND the page, because the walkthrough is
    // driven from two places: it opens itself on a first visit, and the help
    // button in each page's header replays it.
    <ProductTourProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Persistent Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto bg-background focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>

        {/* First-run walkthrough. Renders nothing once dismissed, and nothing at
          all on a viewport where the sidebar is hidden. */}
        <ProductTour />
      </div>
    </ProductTourProvider>
  );
}
