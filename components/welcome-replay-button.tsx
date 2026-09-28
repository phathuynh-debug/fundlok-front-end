"use client";

import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWelcomeControls } from "@/components/product-tour";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CONTROL_HOVER } from "@/lib/ui-tokens";

/**
 * Replays the welcome cutscreen: how FundLok works, and above all how daily
 * repayment and relief for slow months work. An SME who later asks "what
 * happens if this month is slow?" can watch it again rather than dig through
 * the FAQ.
 */
export function WelcomeReplayButton() {
  const { t } = useTranslations();
  const { replay } = useWelcomeControls();
  const label = t("welcome.common.replay");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={replay}
          aria-label={label}
          className={cn("h-9 w-9 rounded-full", CONTROL_HOVER)}
        >
          <PlayCircle className="h-[18px] w-[18px]" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
