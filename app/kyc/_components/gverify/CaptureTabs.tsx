"use client";

import { useState } from "react";
import { AlertCircle, Camera, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { ImageCaptureField } from "./ImageCaptureField";
import {
  CAPTURE_SLOTS,
  type CaptureSlot,
  type StagedImage,
} from "./useGVerifyKyc";

const TAB_LABEL_KEYS: Record<CaptureSlot, string> = {
  front: "kyc.gv.tabFront",
  back: "kyc.gv.tabBack",
  portrait: "kyc.gv.tabSelfie",
};

interface CaptureTabsProps {
  images: Record<CaptureSlot, StagedImage>;
  disabled: boolean;
  onSelect: (slot: CaptureSlot, file: File | null) => void;
  cameraCapture?: boolean;
}

// One tab per capture (ID front / ID back / selfie) showing per-slot progress,
// with a single active capture field below. Staging a photo auto-advances to
// the next empty tab. Shared by the desktop and phone capture screens.
export function CaptureTabs({
  images,
  disabled,
  onSelect,
  cameraCapture = false,
}: CaptureTabsProps) {
  const { t } = useTranslations();
  const [active, setActive] = useState<CaptureSlot>("front");

  const handleSelect = (slot: CaptureSlot, file: File | null) => {
    onSelect(slot, file);
    if (file) {
      const next = CAPTURE_SLOTS.find((s) => s !== slot && !images[s].file);
      if (next) setActive(next);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2" role="tablist">
        {CAPTURE_SLOTS.map((slot) => {
          const staged = !!images[slot].file;
          const hasError = !!images[slot].error;
          return (
            <button
              key={slot}
              type="button"
              role="tab"
              aria-selected={active === slot}
              disabled={disabled}
              onClick={() => setActive(slot)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors",
                active === slot
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40",
                disabled && "cursor-wait opacity-60",
              )}
            >
              {staged ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              ) : hasError ? (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
              ) : (
                <Camera className="h-3.5 w-3.5 shrink-0" />
              )}
              {t(TAB_LABEL_KEYS[slot])}
            </button>
          );
        })}
      </div>

      <ImageCaptureField
        slot={active}
        image={images[active]}
        disabled={disabled}
        onSelect={handleSelect}
        cameraCapture={cameraCapture}
      />
    </div>
  );
}
