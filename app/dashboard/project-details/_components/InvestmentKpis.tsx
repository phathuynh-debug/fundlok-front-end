"use client";

import { Card } from "@/components/ui/card";
import { DollarSign, Percent, Calendar, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";
import { staggerContainerVariants, springItemVariants } from "@/lib/animations";

interface InvestmentKpisProps {
  loanAmount?: string;
  expectedRoi?: string;
  paybackPeriod?: string;
  revenueShareRate?: string;
}

export function InvestmentKpis({
  loanAmount = "$50,000",
  expectedRoi = "10.2%",
  paybackPeriod = "10 mo",
  revenueShareRate = "8.5%",
}: InvestmentKpisProps) {
  const { t } = useTranslations();

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-4 grid-cols-2 md:grid-cols-4"
    >
      {/* Loan Amount */}
      <motion.div variants={springItemVariants}>
        <Card className="p-6 bg-card border flex flex-col justify-between h-32 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("investment.kpis.loanAmount")}
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground mt-2">
            {loanAmount}
          </div>
        </Card>
      </motion.div>

      {/* Expected ROI */}
      <motion.div variants={springItemVariants}>
        <Card className="p-6 bg-card border flex flex-col justify-between h-32 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Percent className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("investment.kpis.expectedRoi")}
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-emerald-600 mt-2">
            {expectedRoi}
          </div>
        </Card>
      </motion.div>

      {/* Est. Payback Period */}
      <motion.div variants={springItemVariants}>
        <Card className="p-6 bg-card border flex flex-col justify-between h-32 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("investment.kpis.estPaybackPeriod")}
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-foreground mt-2">
            {paybackPeriod}
          </div>
        </Card>
      </motion.div>

      {/* Revenue Share Rate */}
      <motion.div variants={springItemVariants}>
        <Card className="p-6 bg-card border flex flex-col justify-between h-32 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t("investment.kpis.revenueShareRate")}
            </span>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-foreground mt-1">
              {revenueShareRate}
            </div>
            <span className="text-xs text-muted-foreground block mt-1">
              {t("investment.kpis.ofDailyRevenue")}
            </span>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
