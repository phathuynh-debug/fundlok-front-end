"use client";

import { ExternalLink, FileX, Loader2 } from "lucide-react";

import { useAdminKybCertificateUrl } from "@/hooks/use-admin";
import { useTranslations } from "@/lib/i18n";

// The submitted registration certificate. The URL is fetched only while the
// panel is open and dies in 10 minutes. Images render inline; a PDF is
// embedded with an open-in-new-tab link, since some browsers won't render a
// cross-origin PDF in a frame. "Not stored" is a real state for attempts made
// before manual mode, when storage was best-effort.
export function KybCertificatePreview({
  verificationId,
}: {
  verificationId: string;
}) {
  const { t } = useTranslations();
  const { data, isLoading, error } = useAdminKybCertificateUrl(verificationId);
  const label = t("admin.kybReviews.certificateHeading");

  if (isLoading) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-border bg-muted/40">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
        <FileX className="h-5 w-5" aria-hidden />
        {t("admin.kybReviews.certificateMissing")}
      </div>
    );
  }

  const isPdf = data.content_type === "application/pdf";
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
        {isPdf ? (
          <iframe
            src={data.url}
            title={label}
            className="h-[28rem] w-full bg-background"
          />
        ) : (
          /* A presigned URL on a foreign origin that dies in 10 minutes:
             next/image would try to optimise and cache it. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={data.url}
            alt={label}
            className="max-h-[28rem] w-full object-contain"
          />
        )}
      </div>
      <a
        href={data.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline underline-offset-2"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        {t("admin.kybReviews.certificateOpen")}
      </a>
    </div>
  );
}
