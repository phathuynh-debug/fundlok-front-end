import type { Metadata } from "next";
import { KycClient } from "../kyc-client";

export const metadata: Metadata = {
  title: "Verifying your identity",
};

// Didit's configured callback. It shares the same status-driven component as
// /kyc — both poll, sync, and redirect on approval — so it doesn't matter which
// route Didit returns the user to.
export default function Page() {
  return <KycClient />;
}
