"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useGVerifyVerify,
  useGVerifyVerifyWithToken,
} from "@/hooks/use-gverify";
import type { GVerifyVerifyResponse } from "@/services/gverify.service";

export type CaptureSlot = "front" | "back" | "portrait";

export const CAPTURE_SLOTS: CaptureSlot[] = ["front", "back", "portrait"];

// Mirror of the backend limits (app/gverify re-validates server-side).
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

// i18n key suffix under kyc.gv.* — translated where rendered.
export type CaptureError = "invalidType" | "tooLarge" | "processFailed" | null;

// Phone cameras produce 4-6MB photos; three of them base64-encoded blow past
// the Next dev proxy's 10MB body limit (and waste mobile bandwidth). OCR and
// face match don't need that resolution — downscale to this bound and
// re-encode as JPEG before staging. Files already smaller are kept as-is.
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;
const COMPRESS_ABOVE_BYTES = 1_500_000;

export async function compressImage(file: File): Promise<File> {
  if (file.size <= COMPRESS_ABOVE_BYTES) return file;
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } finally {
    bitmap.close();
  }
}

export interface StagedImage {
  file: File | null;
  previewUrl: string | null;
  error: CaptureError;
}

const emptySlot = (): StagedImage => ({
  file: null,
  previewUrl: null,
  error: null,
});

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // readAsDataURL yields "data:image/jpeg;base64,<payload>" — backend wants
    // only the payload.
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Local capture state for the GVerify KYC screen: three staged images (ID
// front/back + portrait), client-side validation, and the submit that turns
// them into the base64 payload. Staged files are ephemeral UI state → useState
// (never React Query); server state lives in useGVerifyStatus/useGVerifyVerify.
//
// Pass `handoffToken` on the phone capture page (/kyc/mobile): the submit then
// authenticates with the QR token instead of the session cookie.
export function useGVerifyKyc({
  handoffToken,
}: { handoffToken?: string } = {}) {
  const [images, setImages] = useState<Record<CaptureSlot, StagedImage>>({
    front: emptySlot(),
    back: emptySlot(),
    portrait: emptySlot(),
  });
  const { mutateAsync: verifySession, isPending: sessionPending } =
    useGVerifyVerify();
  const { mutateAsync: verifyToken, isPending: tokenPending } =
    useGVerifyVerifyWithToken();
  const submitting = sessionPending || tokenPending;

  // Track every object URL we minted so unmount can revoke stragglers.
  const urlsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Guards against a slow compression landing after the user re-picked.
  const pickSeqRef = useRef<Record<CaptureSlot, number>>({
    front: 0,
    back: 0,
    portrait: 0,
  });

  const setFile = useCallback((slot: CaptureSlot, file: File | null) => {
    const seq = ++pickSeqRef.current[slot];

    const stage = (next: StagedImage) => {
      if (pickSeqRef.current[slot] !== seq) return; // superseded by a newer pick
      setImages((prev) => {
        const previous = prev[slot];
        if (previous.previewUrl) {
          URL.revokeObjectURL(previous.previewUrl);
          urlsRef.current.delete(previous.previewUrl);
        }
        return { ...prev, [slot]: next };
      });
    };

    if (!file) {
      stage(emptySlot());
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      stage({ file: null, previewUrl: null, error: "invalidType" });
      return;
    }

    void compressImage(file)
      .catch(() => file) // un-decodable but well-typed: fall through to size check
      .then((staged) => {
        if (staged.size > MAX_IMAGE_BYTES) {
          stage({ file: null, previewUrl: null, error: "tooLarge" });
          return;
        }
        const previewUrl = URL.createObjectURL(staged);
        urlsRef.current.add(previewUrl);
        stage({ file: staged, previewUrl, error: null });
      })
      .catch(() =>
        stage({ file: null, previewUrl: null, error: "processFailed" }),
      );
  }, []);

  const reset = useCallback(() => {
    CAPTURE_SLOTS.forEach((slot) => setFile(slot, null));
  }, [setFile]);

  const allReady = CAPTURE_SLOTS.every((slot) => images[slot].file !== null);

  // Encode and submit. The caller handles the verdict (seeded into the status
  // cache by the mutation) and any ApiError.
  const submit = useCallback(async (): Promise<GVerifyVerifyResponse> => {
    const [front, back, portrait] = await Promise.all(
      CAPTURE_SLOTS.map((slot) => fileToBase64(images[slot].file as File)),
    );
    const payload = {
      id_front_b64: front,
      id_back_b64: back,
      portrait_b64: portrait,
    };
    return handoffToken
      ? verifyToken({ payload, token: handoffToken })
      : verifySession(payload);
  }, [images, handoffToken, verifySession, verifyToken]);

  return { images, setFile, reset, allReady, submit, submitting };
}
