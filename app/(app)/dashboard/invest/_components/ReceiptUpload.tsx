"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadReceipt } from "@/hooks/use-funding";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format-date";
import { RECEIPT_MAX_BYTES, RECEIPT_TYPES } from "@/services/funding.service";

const K = "investConfirm.receipt";

// Upload failures the investor can act on, by X-Error-Code.
const KNOWN_ERRORS = new Set([
  "FILE_TOO_LARGE",
  "UNSUPPORTED_TYPE",
  "DUPLICATE_FILE",
  "RECEIPT_ALREADY_SUBMITTED",
  "TRANCHE_NOT_SIGNED",
]);

interface ReceiptUploadProps {
  trancheId: string;
  /** When a receipt was uploaded for this ticket; null if none yet. */
  submittedAt: string | null;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

function sizeLabel(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * After transferring, the investor uploads the receipt their bank app shows:
 * the evidence FundLok checks against the reservation (amount, the business's
 * account, the memo). Once one is in, it says so instead. A receipt sent after
 * the hold lapsed is still taken, for FundLok to review.
 */
export function ReceiptUpload({
  trancheId,
  submittedAt,
  locale,
  t,
}: ReceiptUploadProps) {
  const { toast } = useToast();
  const upload = useUploadReceipt();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  // One key per chosen file: a retry of the same file replays, a new file is a
  // new upload.
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );
  const late = upload.data?.tranche_status === "UNDER_REVIEW";

  if (submittedAt || upload.isSuccess) {
    return (
      <div
        className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm"
        data-testid="receipt-received"
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            {t(`${K}.receivedTitle`)}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {late
              ? t(`${K}.lateBody`)
              : t(`${K}.receivedBody`, {
                  date: formatDateTime(submittedAt ?? new Date(), locale),
                })}
          </p>
        </div>
      </div>
    );
  }

  const choose = (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    if (!(RECEIPT_TYPES as readonly string[]).includes(picked.type)) {
      setError(t(`${K}.errors.UNSUPPORTED_TYPE`));
      return;
    }
    if (picked.size > RECEIPT_MAX_BYTES) {
      setError(t(`${K}.errors.FILE_TOO_LARGE`));
      return;
    }
    setFile(picked);
    setIdempotencyKey(crypto.randomUUID());
  };

  const send = () => {
    if (!file) return;
    setError(null);
    upload.mutate(
      { trancheId, file, idempotencyKey },
      {
        onSuccess: () => toast({ title: t(`${K}.uploaded`) }),
        onError: (failure) => {
          const code = failure.code ?? "";
          const message = KNOWN_ERRORS.has(code)
            ? t(`${K}.errors.${code}`)
            : t(`${K}.errors.generic`);
          setError(message);
          toast({
            variant: "destructive",
            title: t(`${K}.failed`),
            description: message,
          });
        },
      },
    );
  };

  return (
    <section
      className="space-y-3 rounded-xl border p-4"
      aria-labelledby="receipt-title"
      data-testid="receipt-upload"
    >
      <div className="space-y-1">
        <h3
          id="receipt-title"
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <FileUp className="h-4 w-4 text-muted-foreground" />
          {t(`${K}.title`)}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t(`${K}.body`)}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={RECEIPT_TYPES.join(",")}
        className="sr-only"
        aria-label={t(`${K}.choose`)}
        data-testid="receipt-input"
        onChange={(event) => {
          choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <span className="min-w-0 truncate font-medium text-foreground">
            {file.name}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {sizeLabel(file.size)}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setFile(null)}
            disabled={upload.isPending}
            className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t(`${K}.remove`)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t(`${K}.hint`)}</p>
      )}

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
        >
          <Upload className="h-4 w-4" />
          {t(`${K}.choose`)}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={send}
          disabled={!file || upload.isPending}
        >
          {upload.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t(`${K}.uploading`)}
            </>
          ) : (
            t(`${K}.upload`)
          )}
        </Button>
      </div>
    </section>
  );
}
