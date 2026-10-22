"use client";

import {
  CheckCircle2,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLoanApplicationContext } from "./LoanApplicationContext";
import {
  acceptForDocument,
  maxSizeMbForDocument,
  type DocumentKey,
} from "./useLoanApplication";

interface UploadFieldProps {
  docKey: DocumentKey;
  label: string;
  required?: boolean;
}

// A single drag-style upload tile. Files are only staged here (status "ready");
// the actual upload happens later from the review step.
export function UploadField({
  docKey,
  label,
  required = true,
}: UploadFieldProps) {
  const { documents, busy, locale, t, handleFileChange, removeFile } =
    useLoanApplicationContext();
  const { file, status, progress, error } = documents[docKey];
  const id = docKey;

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground flex items-center gap-1">
        {label}
        {required && <span className="text-destructive font-bold">*</span>}
        <span className="ml-auto text-[10px] font-normal text-muted-foreground">
          {t("dashboard.sme.maxFileSizeHint").replace(
            "{maxSize}",
            String(maxSizeMbForDocument(docKey)),
          )}
        </span>
      </label>
      <div
        onClick={() => {
          if (status !== "uploading" && !busy)
            document.getElementById(id)?.click();
        }}
        className={cn(
          "border border-dashed rounded-xl p-4 flex flex-col sm:flex-row items-center justify-center gap-3 transition-all duration-200",
          status === "uploading" &&
            "border-primary/50 bg-accent/30 cursor-wait",
          status === "uploaded" &&
            "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/10 cursor-default",
          status === "error" &&
            "border-destructive/60 bg-destructive/5 hover:bg-destructive/10 cursor-pointer",
          status === "ready" &&
            "border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer",
          status === "idle" &&
            "border-border hover:border-primary/50 hover:bg-accent/40 bg-muted/20 cursor-pointer",
        )}
      >
        <input
          type="file"
          id={id}
          className="hidden"
          onChange={(e) => handleFileChange(docKey, e)}
          accept={acceptForDocument(docKey)}
        />
        {status === "uploading" && file ? (
          <>
            <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            <div className="text-center sm:text-left min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("dashboard.sme.uploadingFile").replace(
                  "{percent}",
                  String(progress),
                )}
              </p>
            </div>
          </>
        ) : status === "uploaded" && file ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-center sm:text-left min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB ·{" "}
                {t("dashboard.sme.uploadComplete")}
              </p>
            </div>
          </>
        ) : status === "error" && file ? (
          <>
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="text-center sm:text-left min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-destructive">{error}</p>
            </div>
          </>
        ) : status === "ready" && file ? (
          <>
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="text-center sm:text-left min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB ·{" "}
                {t("dashboard.sme.readyToSend")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-destructive hover:bg-destructive/10"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                removeFile(docKey);
              }}
            >
              {locale === "vi" ? "Xoá" : "Remove"}
            </Button>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 text-muted-foreground animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">
              {t("dashboard.sme.clickToUpload")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
