"use client";

import { Download, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminDocumentUrl } from "@/hooks/use-admin";
import { useTranslations } from "@/lib/i18n";
import type { AdminApplicationDocument } from "@/services/admin.service";

// Opens one uploaded application document.
//
// What can actually be shown depends on the file. A PDF renders in an iframe
// and an image in an <img>; a ZIP, XLSX, CSV or XML cannot be rendered by the
// browser at all, so those get a download instead of an empty frame. The
// e-invoice step collects exactly those formats, so this is the common case,
// not an edge one.
//
// The URL is fetched when the dialog opens rather than with the list: it
// expires after ten minutes, so one minted alongside the row would usually be
// dead by the time anyone clicked it.

/** Types a browser will render inline. Everything else is offered as a file. */
function isPreviewable(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType === "application/pdf" || contentType.startsWith("image/");
}

interface DocumentViewerDialogProps {
  document: AdminApplicationDocument | null;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewerDialog({
  document,
  onOpenChange,
}: DocumentViewerDialogProps) {
  const { t } = useTranslations();
  const { data, isLoading, error } = useAdminDocumentUrl(document?.id ?? null);

  const previewable = isPreviewable(
    data?.content_type ?? document?.content_type ?? null,
  );

  return (
    <Dialog open={document !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate">
            {document?.original_filename ?? t("admin.preview.documentsHeading")}
          </DialogTitle>
          <DialogDescription>
            {t("admin.preview.documentLinkExpiry")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !data ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t("admin.preview.documentUnavailable")}
          </p>
        ) : previewable ? (
          <div className="space-y-3">
            {data.content_type?.startsWith("image/") ? (
              /* A presigned, expiring URL on a foreign origin: next/image
                 would try to optimise and cache a link that dies in 10
                 minutes. */
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.url}
                alt={data.original_filename}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            ) : (
              <iframe
                src={data.url}
                title={data.original_filename}
                className="h-[70vh] w-full rounded-lg border border-border"
              />
            )}
            <DownloadButton
              url={data.url}
              label={t("admin.preview.download")}
            />
          </div>
        ) : (
          /* Not renderable in a browser — a ZIP of e-invoice data, a
             spreadsheet, an XML export. Offering an empty frame would look
             broken; offering the file is the useful thing. */
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {data.original_filename}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("admin.preview.notPreviewable")}
              </p>
            </div>
            <DownloadButton
              url={data.url}
              label={t("admin.preview.download")}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DownloadButton({ url, label }: { url: string; label: string }) {
  return (
    <Button asChild variant="outline" className="w-full">
      {/* `download` is advisory on a cross-origin URL — the browser may open
          it in a tab instead. Either outcome gets the operator the file. */}
      <a href={url} download target="_blank" rel="noopener noreferrer">
        <Download className="mr-2 h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}
