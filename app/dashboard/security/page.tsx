import type { Metadata } from "next";
import SecurityClient from "./client";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Review the protections on your account, the devices signed in, and recent security activity.",
};

export default function SecurityPage() {
  return <SecurityClient />;
}
