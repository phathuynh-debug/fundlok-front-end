"use client";

import Link from "next/link";
import { Headphones } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

export interface VerificationHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flow?: "kyc" | "kyb";
}

export function VerificationHelpDialog({
  open,
  onOpenChange,
  flow = "kyc",
}: VerificationHelpDialogProps) {
  const { t } = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Headphones className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold">
            {t("kyc.helpDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            {flow === "kyb"
              ? t("kyc.helpDialog.kybDescription")
              : t("kyc.helpDialog.kycDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-col">
          <Button asChild className="h-11 w-full">
            <Link href="/contact?purpose=support">
              <Headphones className="mr-2 h-4 w-4" />
              {t("kyc.helpDialog.contactBtn")}
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={() => onOpenChange(false)}
          >
            {t("kyc.helpDialog.closeBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
