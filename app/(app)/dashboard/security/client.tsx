"use client";

import { m } from "framer-motion";
import { pageTransitionProps } from "@/lib/animations";
import { SecuritySettings } from "./_components/SecuritySettings";

// Shared security body (also rendered at /admin/security).
export default function SecurityClient() {
  return (
    <m.div {...pageTransitionProps} className="space-y-6 md:space-y-8">
      <SecuritySettings />
    </m.div>
  );
}
