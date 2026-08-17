import type { Metadata } from "next";
import AnalyticsClient from "./client";

export const metadata: Metadata = {
  title: "Analytics",
  description:
    "Track capital deployed, returns received, and how your portfolio is allocated across industries.",
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
