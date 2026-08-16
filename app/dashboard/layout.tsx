import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";

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
    </div>
  );
}
