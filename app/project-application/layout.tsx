import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply for Funding",
  description:
    "Submit a new funding application for your business. FundLok connects SMEs with private credit line investors.",
};

export default function ProjectApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10">
        {children}
      </div>
    </div>
  );
}
