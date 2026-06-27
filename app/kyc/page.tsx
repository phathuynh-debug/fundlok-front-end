import type { Metadata } from "next";
import { KycClient } from "./kyc-client";

export const metadata: Metadata = {
  title: "Verify your identity",
  description:
    "Confirm your identity with FundLok's verification partner before continuing.",
};

export default function Page() {
  return <KycClient />;
}
