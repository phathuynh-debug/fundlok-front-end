"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/lib/i18n";
import type { EmailPreview } from "@/services/admin-email.service";

// The server-rendered email, exactly as it would be sent.
//
// sandbox="" (every restriction on): the HTML is the server's own template
// with the admin's text escaped into it, so nothing in it should run, but a
// rendered email is still not this app's markup. No scripts, no forms, no
// same-origin access to the console, no navigating the page.
//
// `open` is separate from `preview` so the content stays put while the close
// animation runs; clearing it on close would shrink the dialog as it fades.
export function EmailPreviewDialog({
  open,
  preview,
  onOpenChange,
}: {
  open: boolean;
  preview: EmailPreview | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("admin.email.compose.previewTitle")}</DialogTitle>
          <DialogDescription>
            {t("admin.email.compose.previewDescription")}
          </DialogDescription>
        </DialogHeader>
        {preview && (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">
                {t("admin.email.compose.subjectLabel")}:
              </span>{" "}
              <span className="font-medium text-foreground">
                {preview.subject}
              </span>
            </p>
            <iframe
              title={t("admin.email.compose.previewTitle")}
              sandbox=""
              srcDoc={preview.html}
              className="h-[65vh] w-full rounded-md border border-border"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
