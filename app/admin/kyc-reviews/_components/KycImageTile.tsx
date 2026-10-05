"use client";

import { ImageOff, Loader2 } from "lucide-react";

import { useAdminKycImageUrl } from "@/hooks/use-admin";
import { useTranslations } from "@/lib/i18n";
import type { AdminKycImageName } from "@/services/admin.service";

// One submitted image. Each tile fetches its own short-lived URL, so a slow or
// missing image never holds up the other two. Storage is best-effort on the
// backend, so "not stored" is a normal state, not an error.
export function KycImageTile({
  verificationId,
  name,
}: {
  verificationId: string;
  name: AdminKycImageName;
}) {
  const { t } = useTranslations();
  const { data, isLoading, error } = useAdminKycImageUrl(verificationId, name);
  const label = t(`admin.kycReviews.images.${name}`);

  return (
    <figure className="space-y-1.5">
      <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : error || !data ? (
          <span className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
            <ImageOff className="h-5 w-5" aria-hidden />
            {t("admin.kycReviews.imageMissing")}
          </span>
        ) : (
          <a
            href={data.url}
            target="_blank"
            rel="noreferrer"
            className="block h-full w-full focus-visible:outline-2 focus-visible:outline-ring"
            aria-label={t("admin.kycReviews.imageOpen").replace(
              "{name}",
              label,
            )}
          >
            {/* A presigned URL that dies in 10 minutes, on a foreign origin:
                next/image would try to optimise and cache it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.url}
              alt={label}
              className="h-full w-full object-contain"
            />
          </a>
        )}
      </div>
      <figcaption className="text-center text-[11px] text-muted-foreground">
        {label}
      </figcaption>
    </figure>
  );
}
