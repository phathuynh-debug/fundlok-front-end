"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProductTourControls } from "@/components/product-tour";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CONTROL_HOVER } from "@/lib/ui-tokens";

/**
 * Replays the first-run walkthrough on demand.
 *
 * Exists because dismissal is permanent and account-wide: once someone has
 * skipped it, there is otherwise no way back to the explanation of what the
 * score, the backstop date or the fee column actually mean. A tour you can
 * only ever see once is a tour most people never read.
 *
 * Desktop only, by virtue of where it is mounted: every step points at a
 * sidebar item, and the sidebar is `hidden md:flex`.
 */
export function TourReplayButton() {
  const { t } = useTranslations();
  const { restart } = useProductTourControls();
  const label = t("dashboard.tour.replay");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={restart}
          aria-label={label}
          className={cn("h-9 w-9 rounded-full", CONTROL_HOVER)}
        >
          <HelpCircle className="h-[18px] w-[18px]" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
