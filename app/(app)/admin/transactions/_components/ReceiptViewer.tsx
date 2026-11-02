"use client";

import { useState } from "react";
import { ExternalLink, FileText, Loader2, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAdminReceiptUrl } from "@/hooks/use-admin-funding";
import { useTranslations } from "@/lib/i18n";

// The investor's receipt. Shown only when staff ask for it: every link is
// audited (it carries a person's bank details) and lives for ten minutes, so
// one fetched with the panel would be both noise in the log and often dead.
export function ReceiptViewer({
  transferId,
  filename,
}: {
  transferId: string;
  filename: string | null;
}) {
  const { t } = useTranslations();
  const [shown, setShown] = useState(false);
  const { data, isLoading, error } = useAdminReceiptUrl(
    shown ? transferId : null,
  );

  if (!shown) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setShown(true)}
      >
        <Eye className="h-4 w-4" />
        {t("admin.transactions.sheet.showReceipt")}
      </Button>
    );
  }
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border bg-muted/30">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <p role="alert" className="text-xs text-destructive">
        {t("admin.transactions.sheet.receiptFailed")}
      </p>
    );
  }

  const isImage = data.content_type.startsWith("image/");
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border bg-muted/30">
        {isImage ? (
          // A presigned URL that dies in 10 minutes, on a foreign origin:
          // next/image would try to optimise and cache it.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.url}
            alt={t("admin.transactions.sheet.receiptAlt")}
            className="max-h-[28rem] w-full object-contain"
          />
        ) : (
          <iframe
            src={data.url}
            title={t("admin.transactions.sheet.receiptAlt")}
            className="h-[28rem] w-full"
          />
        )}
      </div>
      <a
        href={data.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        {isImage ? (
          <ExternalLink className="h-3.5 w-3.5" />
        ) : (
          <FileText className="h-3.5 w-3.5" />
        )}
        {filename || t("admin.transactions.sheet.openReceipt")}
      </a>
    </div>
  );
}
