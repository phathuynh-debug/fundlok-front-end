"use client";

import { useTranslations } from "@/lib/i18n";

/** "Score 79.25/100", or "pending" while no score run is locked. Shared by the
 *  header and the risk tab so the two badges on the page read the same. */
export function ScoreLabel({ score }: { score: number | null }) {
  const { t } = useTranslations();
  return score === null
    ? t("dashboard.projectCard.pendingGrading")
    : t("dashboard.projectDetails.score", { score: score.toFixed(2) });
}
