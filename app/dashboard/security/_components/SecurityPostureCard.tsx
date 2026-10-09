"use client";

import { motion } from "framer-motion";
import { KeyRound, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { springItemVariants, staggerContainerVariants } from "@/lib/animations";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { scoreBand, type PostureBand } from "./protections";

const BAND_STYLES: Record<PostureBand, { text: string; bar: string }> = {
  strong: {
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  fair: { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" },
  weak: { text: "text-destructive", bar: "bg-destructive" },
};

export function SecurityPostureCard({
  score,
  protectionsOn,
  protectionsTotal,
  activeSessions,
  lastPasswordChange,
}: {
  score: number;
  protectionsOn: number;
  protectionsTotal: number;
  activeSessions: number;
  lastPasswordChange: string;
}) {
  const { t } = useTranslations();
  const band = scoreBand(score);
  const styles = BAND_STYLES[band];

  const tiles = [
    {
      key: "protections",
      label: t("dashboard.security.posture.protections"),
      value: `${protectionsOn}/${protectionsTotal}`,
      hint: t("dashboard.security.posture.protectionsHint"),
      icon: ShieldCheck,
    },
    {
      key: "sessions",
      label: t("dashboard.security.posture.sessions"),
      value: String(activeSessions),
      hint: t("dashboard.security.posture.sessionsHint"),
      icon: MonitorSmartphone,
    },
    {
      key: "password",
      label: t("dashboard.security.posture.password"),
      value: lastPasswordChange,
      hint: t("dashboard.security.posture.passwordHint"),
      icon: KeyRound,
    },
  ];

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-[1.1fr_2fr] gap-4"
    >
      {/* Score */}
      <motion.div variants={springItemVariants}>
        <Card className="h-full p-5 gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {t("dashboard.security.posture.scoreLabel")}
            </span>
            <span
              className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                styles.text,
              )}
            >
              {t(`dashboard.security.posture.band.${band}`)}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className={cn("text-4xl font-bold", styles.text)}>
              {score}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>

          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("dashboard.security.posture.scoreLabel")}
          >
            <motion.div
              className={cn("h-full rounded-full", styles.bar)}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {t(`dashboard.security.posture.bandHint.${band}`)}
          </p>
        </Card>
      </motion.div>

      {/* Supporting stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <motion.div key={tile.key} variants={springItemVariants}>
            <Card className="h-full p-5 gap-1.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <tile.icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-medium">{tile.label}</span>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {tile.value}
              </span>
              <span className="text-xs text-muted-foreground">{tile.hint}</span>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
