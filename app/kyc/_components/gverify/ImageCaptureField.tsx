'use client';

import { useState } from 'react';
import { AlertCircle, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { CameraCaptureDialog, cameraSupported } from './CameraCaptureDialog';
import { CAPTURE_ACCEPT, type CaptureSlot, type StagedImage } from './useGVerifyKyc';

interface ImageCaptureFieldProps {
  slot: CaptureSlot;
  image: StagedImage;
  disabled: boolean;
  onSelect: (slot: CaptureSlot, file: File | null) => void;
  // On the phone capture page, open the camera directly: rear camera for the
  // ID card, front camera for the selfie. Desktop ignores the attribute.
  cameraCapture?: boolean;
}

// One capture tile: hidden file input (camera-capable on mobile), preview
// thumbnail once staged, inline validation error otherwise.
export function ImageCaptureField({
  slot,
  image,
  disabled,
  onSelect,
  cameraCapture = false,
}: ImageCaptureFieldProps) {
  const { t, locale } = useTranslations();
  const inputId = `gverify-${slot}`;
  const label = t(`kyc.gv.${slot}Label`);
  // In-app guided camera (framing rectangle + crop-to-frame). Falls back to
  // the native file input when getUserMedia is unavailable (no permission or
  // insecure http origin).
  const [cameraOpen, setCameraOpen] = useState(false);

  const openPicker = () => document.getElementById(inputId)?.click();

  return (
    <div className="space-y-2 text-left">
      <label className="flex items-center gap-1 text-sm font-semibold text-foreground">
        {label}
        <span className="font-bold text-destructive">*</span>
      </label>
      {cameraOpen && (
        <CameraCaptureDialog
          guide={slot === 'portrait' ? 'face' : 'card'}
          title={label}
          onCapture={(file) => {
            setCameraOpen(false);
            onSelect(slot, file);
          }}
          onClose={() => setCameraOpen(false)}
          onUnavailable={() => {
            setCameraOpen(false);
            openPicker();
          }}
          onPickFile={() => {
            setCameraOpen(false);
            openPicker();
          }}
        />
      )}
      <div
        onClick={() => {
          if (disabled) return;
          if (cameraCapture && cameraSupported()) setCameraOpen(true);
          else openPicker();
        }}
        className={cn(
          'flex min-h-24 items-center justify-center gap-3 rounded-xl border border-dashed p-3 transition-all duration-200',
          disabled && 'cursor-wait opacity-60',
          !disabled && 'cursor-pointer',
          image.error && 'border-destructive/60 bg-destructive/5 hover:bg-destructive/10',
          image.previewUrl && !image.error && 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/10',
          !image.previewUrl && !image.error && 'border-border bg-muted/20 hover:border-primary/50 hover:bg-accent/40',
        )}
      >
        <input
          type="file"
          id={inputId}
          className="hidden"
          accept={CAPTURE_ACCEPT}
          capture={cameraCapture ? (slot === 'portrait' ? 'user' : 'environment') : undefined}
          // A newly-selected file must fire onChange even if it's the same
          // path the user picked before (e.g. retake after a rejection).
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
          onChange={(e) => onSelect(slot, e.target.files?.[0] ?? null)}
        />
        {image.previewUrl && image.file ? (
          <>
            {/* Object-URL preview — next/image can't optimize blob: URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.previewUrl}
              alt={label}
              className="h-20 w-28 shrink-0 rounded-lg border border-border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{image.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(image.file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-destructive hover:bg-destructive/10"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(slot, null);
              }}
            >
              {locale === 'vi' ? 'Xoá' : 'Remove'}
            </Button>
          </>
        ) : image.error ? (
          <>
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <span className="text-sm text-destructive">{t(`kyc.gv.${image.error}`)}</span>
          </>
        ) : (
          <>
            <Camera className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {t('kyc.gv.clickToAdd')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
