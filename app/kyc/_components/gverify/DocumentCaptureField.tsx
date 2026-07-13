'use client';

import { AlertCircle, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/lib/i18n';
import { KYB_ACCEPT, type StagedDocument } from './useGVerifyKyb';

interface DocumentCaptureFieldProps {
  document: StagedDocument;
  disabled: boolean;
  onSelect: (file: File | null) => void;
  // Names the exact certificate expected for the selected type.
  label: string;
}

// Single-document tile for the KYB certificate: photo (with preview) or PDF
// (icon tile). Mirrors ImageCaptureField's look and interaction.
export function DocumentCaptureField({
  document: doc,
  disabled,
  onSelect,
  label,
}: DocumentCaptureFieldProps) {
  const { t, locale } = useTranslations();
  const inputId = 'gverify-kyb-document';

  return (
    <div className="space-y-2 text-left">
      <label className="flex items-center gap-1 text-sm font-semibold text-foreground">
        {label}
        <span className="font-bold text-destructive">*</span>
      </label>
      <div
        onClick={() => {
          if (!disabled) window.document.getElementById(inputId)?.click();
        }}
        className={cn(
          'flex min-h-24 items-center justify-center gap-3 rounded-xl border border-dashed p-3 transition-all duration-200',
          disabled && 'cursor-wait opacity-60',
          !disabled && 'cursor-pointer',
          doc.error && 'border-destructive/60 bg-destructive/5 hover:bg-destructive/10',
          doc.file && !doc.error && 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/10',
          !doc.file && !doc.error && 'border-border bg-muted/20 hover:border-primary/50 hover:bg-accent/40',
        )}
      >
        <input
          type="file"
          id={inputId}
          className="hidden"
          accept={KYB_ACCEPT}
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
          }}
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        />
        {doc.file ? (
          <>
            {doc.previewUrl ? (
              // Object-URL preview — next/image can't optimize blob: URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={doc.previewUrl}
                alt={label}
                className="h-20 w-28 shrink-0 rounded-lg border border-border object-cover"
              />
            ) : (
              <FileText className="h-8 w-8 shrink-0 text-primary" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{doc.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(doc.file.size / (1024 * 1024)).toFixed(2)} MB
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
                onSelect(null);
              }}
            >
              {locale === 'vi' ? 'Xoá' : 'Remove'}
            </Button>
          </>
        ) : doc.error ? (
          <>
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <span className="text-sm text-destructive">
              {t(doc.error === 'invalidTypeDoc' ? 'kyc.kyb.invalidTypeDoc' : `kyc.gv.${doc.error}`)}
            </span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {t('kyc.kyb.clickToAdd')}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
