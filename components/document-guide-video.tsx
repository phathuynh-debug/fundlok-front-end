"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CONTROL_HOVER } from "@/lib/ui-tokens";

const GUIDE_VIDEO_SRC = "/videos/document-guide.mp4";

/**
 * "Watch the guide video" — the walkthrough of preparing each upload document,
 * beside the text guide (`DocumentGuide`).
 *
 * The <video> is mounted only while the dialog is open. A 35 MB file costs
 * nothing for the applicants who never press the button, and closing the
 * dialog unmounts the element, which stops playback and releases the download.
 */
export function DocumentGuideVideo() {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const label = t("dashboard.documentGuide.videoOpen");

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={label}
        className={cn("gap-1.5 text-xs font-medium", CONTROL_HOVER)}
      >
        <PlayCircle className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("dashboard.documentGuide.videoTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.documentGuide.videoDescription")}
            </DialogDescription>
          </DialogHeader>
          <video
            src={GUIDE_VIDEO_SRC}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="aspect-video w-full rounded-lg bg-black"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
