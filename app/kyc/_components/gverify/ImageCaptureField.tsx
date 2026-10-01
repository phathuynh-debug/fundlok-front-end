"use client";

import { useState } from "react";
import { AlertCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import {
  CameraCaptureDialog,
  cameraSupported,
  type CameraProblem,
} from "./CameraCaptureDialog";
import { type CaptureSlot, type StagedImage } from "./useGVerifyKyc";

interface ImageCaptureFieldProps {
  slot: CaptureSlot;
  image: StagedImage;
  disabled: boolean;
  onSelect: (slot: CaptureSlot, file: File | null) => void;
}

const PROBLEM_KEYS: Record<CameraProblem, string> = {
  unsupported: "kyc.gv.cameraUnsupported",
  denied: "kyc.gv.cameraDenied",
  failed: "kyc.gv.cameraFailed",
};

// One capture tile for one photo of the identity check.
//
// The photo is taken live with the in-app guided camera (framing guide and
// crop-to-frame) and that is the ONLY way to add one. There is no file input
// here and no fallback to one: the point of the check is to see who is
// registering, so a picture chosen from the device's gallery or files is not
// accepted. When the camera cannot open, the tile says why instead of offering
// a way around it; the person retries or continues on their phone.
//
// This keeps the app honest about how photos are taken. It is not a liveness
// check: the API still takes any JPEG or PNG, so catching a replayed or
// recorded image takes liveness detection from the verification provider.
export function ImageCaptureField({
  slot,
  image,
  disabled,
  onSelect,
}: ImageCaptureFieldProps) {
  const { t, locale } = useTranslations();
  const label = t(`kyc.gv.${slot}Label`);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [problem, setProblem] = useState<CameraProblem | null>(null);

  const openCamera = () => {
    if (disabled) return;
    if (!cameraSupported()) {
      setProblem("unsupported");
      return;
    }
    setProblem(null);
    setCameraOpen(true);
  };

  const staged = image.previewUrl !== null && image.file !== null;
  const stateText = staged
    ? `${t("kyc.gv.photoTaken")}. ${t("kyc.gv.retakeHint")}`
    : image.error
      ? t(`kyc.gv.${image.error}`)
      : t("kyc.gv.clickToAdd");

  return (
    <div className="space-y-2 text-left">
      <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
        {label}
        <span className="font-bold text-destructive">*</span>
      </p>
      {cameraOpen && (
        <CameraCaptureDialog
          guide={slot === "portrait" ? "face" : "card"}
          title={label}
          onCapture={(file) => {
            setCameraOpen(false);
            onSelect(slot, file);
          }}
          onClose={() => setCameraOpen(false)}
          onUnavailable={(reason) => {
            setCameraOpen(false);
            setProblem(reason);
          }}
        />
      )}
      <div
        className={cn(
          "flex min-h-24 items-center gap-3 rounded-xl border border-dashed p-3 transition-all duration-200",
          disabled && "cursor-wait opacity-60",
          image.error &&
            !staged &&
            "border-destructive/60 bg-destructive/5 hover:bg-destructive/10",
          staged &&
            "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/10",
          !staged &&
            !image.error &&
            "border-border bg-muted/20 hover:border-primary/50 hover:bg-accent/40",
        )}
      >
        {/* The tile is a real button, so it can be reached and used from the
            keyboard. The Remove button sits beside it, not inside it. */}
        <button
          type="button"
          disabled={disabled}
          onClick={openCamera}
          aria-label={`${label}: ${stateText}`}
          className="flex min-h-18 min-w-0 flex-1 items-center justify-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait"
        >
          {staged && image.file ? (
            <>
              {/* Object-URL preview — next/image can't optimize blob: URLs. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.previewUrl ?? undefined}
                alt=""
                className="h-20 w-28 shrink-0 rounded-lg border border-border object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {t("kyc.gv.photoTaken")}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {t("kyc.gv.retakeHint")} ·{" "}
                  {(image.file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </span>
            </>
          ) : image.error ? (
            <>
              <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
              <span className="text-sm text-destructive">
                {t(`kyc.gv.${image.error}`)}
              </span>
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {t("kyc.gv.clickToAdd")}
              </span>
            </>
          )}
        </button>
        {staged && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 text-xs text-destructive hover:bg-destructive/10"
            disabled={disabled}
            onClick={() => onSelect(slot, null)}
          >
            {locale === "vi" ? "Xoá" : "Remove"}
          </Button>
        )}
      </div>
      {problem && (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-xs leading-relaxed text-destructive"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t(PROBLEM_KEYS[problem])}
        </p>
      )}
    </div>
  );
}
