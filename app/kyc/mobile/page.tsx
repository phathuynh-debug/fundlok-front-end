import { Suspense } from "react";
import type { Metadata } from "next";
import { MobileKycClient } from "./mobile-kyc-client";

export const metadata: Metadata = {
  title: "Verify your identity",
  description:
    "Take photos of your ID card and a selfie to verify your identity.",
};

// The client reads the handoff token from the query string, which requires a
// Suspense boundary around useSearchParams in the App Router.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <MobileKycClient />
    </Suspense>
  );
}
