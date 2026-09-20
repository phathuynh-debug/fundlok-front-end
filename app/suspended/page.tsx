import type { Metadata } from "next";
import { SuspendedClient } from "./suspended-client";

export const metadata: Metadata = {
  title: "Account suspended",
  // No reason to let this be indexed — it is a dead end reachable only by an
  // account the platform has shut out.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SuspendedClient />;
}
