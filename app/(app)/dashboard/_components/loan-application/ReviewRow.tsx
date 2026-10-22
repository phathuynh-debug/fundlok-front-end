"use client";

import {
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
  RotateCcw,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isPreviewable } from "./DocumentPreviewDialog";
import { useLoanApplicationContext } from "./LoanApplicationContext";
import type { DocumentKey } from "./useLoanApplication";

interface ReviewRowProps {
  docKey: DocumentKey;
  label: string;
}

// One document line on the review step: icon + name/size + live status, with a
// Preview action (when renderable) and a Retry/Add action as needed.
export function ReviewRow({ docKey, label }: ReviewRowProps) {
  const {
    documents,
    busy,
    isSending,
    isFinalizing,
    t,
    openPreview,
    retryUpload,
    goToStep,
    stepForDocument,
  } = useLoanApplicationContext();
  const { file, status, progress, error } = documents[docKey];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3.5 transition-colors",
        status === "uploaded" && "border-emerald-500/40 bg-emerald-500/5",
        status === "uploading" && "border-primary/40 bg-primary/5",
        status === "error" && "border-destructive/50 bg-destructive/5",
        (status === "ready" || status === "idle") &&
          "border-border bg-muted/20",
      )}
    >
      <div className="shrink-0">
        {status === "uploaded" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        ) : status === "uploading" ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : status === "error" ? (
          <AlertCircle className="h-5 w-5 text-destructive" />
        ) : file ? (
          <FileText className="h-5 w-5 text-muted-foreground" />
        ) : (
          <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground break-words">
          {label}
        </p>
        {file ? (
          <p className="text-xs text-muted-foreground truncate">
            {file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("dashboard.sme.notSelectedYet")}
          </p>
        )}
        {status === "uploading" && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {status === "error" && error && (
          <p className="mt-0.5 text-xs text-destructive">{error}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {file && isPreviewable(file) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => openPreview(file)}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {t("dashboard.sme.preview")}
            </span>
          </Button>
        )}
        {status === "uploaded" ? (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {t("dashboard.sme.sentStatus")}
          </span>
        ) : status === "uploading" ? (
          <span className="text-xs font-medium text-muted-foreground">
            {progress}%
          </span>
        ) : status === "error" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            disabled={isSending || isFinalizing}
            onClick={() => retryUpload(docKey)}
          >
            <RotateCcw className="h-3 w-3" />
            {t("dashboard.sme.retryUpload")}
          </Button>
        ) : !file ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            disabled={busy}
            onClick={() => goToStep(stepForDocument(docKey))}
          >
            {t("dashboard.sme.clickToUpload")}
          </Button>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {t("dashboard.sme.readyToSend")}
          </span>
        )}
      </div>
    </div>
  );
}
