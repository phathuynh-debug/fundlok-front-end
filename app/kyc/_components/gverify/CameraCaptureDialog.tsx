"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

// CCCD/CMND cards are ISO/IEC 7810 ID-1: 85.6 × 53.98 mm.
const CARD_ASPECT = 85.6 / 53.98;

export type CaptureGuide = "card" | "face";

// Why the camera could not be opened, for the message the parent shows.
//   unsupported  no camera API here, or the page is not on a secure origin
//   denied       the user (or a policy) blocked camera access
//   failed       no camera found, or it is in use by another app
export type CameraProblem = "unsupported" | "denied" | "failed";

interface CameraCaptureDialogProps {
  guide: CaptureGuide;
  title: string;
  onCapture: (file: File) => void;
  onClose: () => void;
  // The camera could not be opened. There is deliberately no file-picker
  // fallback and no "choose from library": these photos exist to show who is
  // registering, so they are taken live or not at all. The parent says why and
  // the person retries, or continues on their phone.
  onUnavailable: (problem: CameraProblem) => void;
}

function problemFrom(error: unknown): CameraProblem {
  const name = error instanceof DOMException ? error.name : "";
  if (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    name === "SecurityError"
  ) {
    return "denied";
  }
  return "failed";
}

export function cameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    (typeof window === "undefined" || window.isSecureContext)
  );
}

// Full-screen in-app camera with a framing guide: a card-shaped rectangle for
// ID sides, an oval for the selfie. The capture is CROPPED to the guide box,
// so whatever the user fits inside the frame is exactly what gets submitted —
// no more "card too far away" rejections from the face-match provider. It is
// the only way a photo gets into the verification: nothing here, or in the
// field that opens it, accepts a file from the device.
export function CameraCaptureDialog({
  guide,
  title,
  onCapture,
  onClose,
  onUnavailable,
}: CameraCaptureDialogProps) {
  const { t } = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: guide === "face" ? "user" : "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        if (!cancelled) onUnavailable(problemFrom(error));
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
    // onUnavailable is stable enough for our usage; re-running on guide only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide]);

  // Map the on-screen guide box back to source-video pixels (the video is
  // rendered with object-cover, so it's scaled and center-cropped) and cut
  // exactly that region out of the current frame.
  const capture = useCallback(async () => {
    const video = videoRef.current;
    const container = containerRef.current;
    const guideEl = guideRef.current;
    if (!video || !container || !guideEl || !video.videoWidth) return;
    setCapturing(true);
    try {
      const containerRect = container.getBoundingClientRect();
      const guideRect = guideEl.getBoundingClientRect();
      const scale = Math.max(
        containerRect.width / video.videoWidth,
        containerRect.height / video.videoHeight,
      );
      const offsetX = (video.videoWidth * scale - containerRect.width) / 2;
      const offsetY = (video.videoHeight * scale - containerRect.height) / 2;

      const sx = (guideRect.left - containerRect.left + offsetX) / scale;
      const sy = (guideRect.top - containerRect.top + offsetY) / scale;
      const sw = guideRect.width / scale;
      const sh = guideRect.height / scale;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(sw);
      canvas.height = Math.round(sh);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // The selfie preview is mirrored for natural framing — un-mirror the
      // actual capture so it matches the ID photo orientation.
      if (guide === "face") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (blob) {
        onCapture(
          new File([blob], `${guide}-capture.jpg`, { type: "image/jpeg" }),
        );
      }
    } finally {
      setCapturing(false);
    }
  }, [guide, onCapture]);

  // Rendered into <body>, not where the field sits: a full-screen overlay must
  // not inherit its caller's layout. Inside the field's `space-y-2` the dialog
  // picked up an 8px bottom margin, which shrank the fixed box and left a strip
  // of the page showing under the shutter. It is only ever mounted after a tap,
  // so `document` is always there.
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      role="dialog"
      aria-label={title}
    >
      <div className="relative flex-1 overflow-hidden" ref={containerRef}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setReady(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            guide === "face" && "-scale-x-100", // mirror the selfie preview
          )}
        />

        {/* Framing guide: everything outside the window is dimmed. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div
            ref={guideRef}
            style={
              guide === "card"
                ? { aspectRatio: String(CARD_ASPECT) }
                : undefined
            }
            className={cn(
              "border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]",
              guide === "card"
                ? "w-[88%] max-w-xl rounded-xl"
                : "aspect-[3/4] h-[60%] max-h-[28rem] rounded-[50%]",
            )}
          />
        </div>

        {/* Header: title + close */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <p className="rounded-full bg-black/50 px-3 py-1.5 text-sm font-medium text-white">
            {title}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
            onClick={onClose}
            aria-label={t("kyc.gv.cameraClose")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Hint above the controls */}
        <p className="absolute inset-x-0 bottom-28 px-8 text-center text-sm font-medium text-white drop-shadow">
          {t(
            guide === "card"
              ? "kyc.gv.cameraHintCard"
              : "kyc.gv.cameraHintFace",
          )}
        </p>

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center bg-black px-8 py-5">
        <button
          type="button"
          disabled={!ready || capturing}
          onClick={capture}
          aria-label={t("kyc.gv.captureBtn")}
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 transition-transform active:scale-90 disabled:opacity-40"
        >
          {capturing ? (
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          ) : (
            <Camera className="h-7 w-7 text-white" />
          )}
        </button>
      </div>
    </motion.div>,
    document.body,
  );
}
