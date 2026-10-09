"use client";

import { motion } from "framer-motion";
import { pageTransitionProps } from "@/lib/animations";
import { DashboardHeader } from "../_components/DashboardHeader";
import { SecuritySettings } from "./_components/SecuritySettings";

// Dashboard chrome around the shared security body (also rendered at
// /admin/security with its own header — see app/admin/security/client.tsx).
export default function SecurityClient() {
  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />

      <motion.div
        {...pageTransitionProps}
        className="flex-1 space-y-6 md:space-y-8 p-4 md:p-8 pt-6"
      >
        <SecuritySettings />
      </motion.div>
    </div>
  );
}
