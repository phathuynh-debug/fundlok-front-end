"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, QrCode, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  useBanks,
  useParseVietQr,
  useSavePaymentAccount,
} from "@/hooks/use-payment-accounts";
import { apiErrorMessage } from "@/lib/api-error-message";
import { decodeQrImage } from "@/lib/decode-qr-image";
import { useTranslations } from "@/lib/i18n";
import { CONTROL_HOVER } from "@/lib/ui-tokens";
import type { ApiError } from "@/lib/types";
import { BankPicker } from "./BankPicker";
import {
  bankAccountFormSchema,
  type BankAccountFormInput,
  type BankAccountFormValues,
} from "./bank-account-schema";

const K = "dashboard.settings.profile.bankAccount.form";

// Backend error codes (X-Error-Code) we word ourselves, so the Vietnamese site
// never shows the backend's English text. Codes without their own word fall
// back to `failedDescription`.
const ERROR_KEYS: Record<string, string> = {
  ACCOUNT_EXISTS: "duplicate",
  "Unsupported bank": "unsupportedBank",
  "Invalid account number": "invalidNumber",
  INVALID_QR: "scanNotVietQr",
  NOT_AN_ACCOUNT_QR: "scanNotAccount",
};

type ScanState =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "filled" }
  | { kind: "error"; message: string };

interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultHolderType: "INDIVIDUAL" | "ENTITY";
}

export function AddBankAccountDialog({
  open,
  onOpenChange,
  defaultHolderType,
}: AddBankAccountDialogProps) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const banks = useBanks(open);
  const parseQr = useParseVietQr();
  const save = useSavePaymentAccount();

  const qrInputRef = useRef<HTMLInputElement>(null);
  const [scan, setScan] = useState<ScanState>({ kind: "idle" });

  const defaultValues: BankAccountFormInput = {
    bank_bin: "",
    account_number: "",
    account_name: "",
    holder_type: defaultHolderType,
  };
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BankAccountFormInput, unknown, BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema(t)),
    defaultValues,
  });

  const errorText = (
    error: ApiError | null | undefined,
    fallbackKey: string,
  ) => {
    const key = error?.code ? ERROR_KEYS[error.code] : undefined;
    if (key) return t(`${K}.${key}`);
    return apiErrorMessage(error, locale, t(`${K}.${fallbackKey}`));
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset(defaultValues);
      setScan({ kind: "idle" });
    }
    onOpenChange(next);
  };

  // Decode the QR in the browser; only its text goes to the server, which
  // reads the bank and account number out of it.
  const handleQrPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    setScan({ kind: "reading" });
    let text: string | null = null;
    try {
      text = await decodeQrImage(picked);
    } catch {
      text = null;
    }
    if (!text) {
      setScan({ kind: "error", message: t(`${K}.scanNoQr`) });
      return;
    }
    parseQr.mutate(text, {
      onSuccess: (parsed) => {
        setValue("bank_bin", parsed.bank_bin, { shouldValidate: true });
        setValue("account_number", parsed.account_number, {
          shouldValidate: true,
        });
        if (parsed.account_name && !getValues("account_name").trim()) {
          setValue("account_name", parsed.account_name, {
            shouldValidate: true,
          });
        }
        setScan({ kind: "filled" });
      },
      onError: (error) => {
        setScan({ kind: "error", message: errorText(error, "scanFailed") });
      },
    });
  };

  const onSubmit = (values: BankAccountFormValues) => {
    save.mutate(values, {
      onSuccess: () => {
        toast({
          title: t(`${K}.savedTitle`),
          description: t(`${K}.savedDescription`),
        });
        handleOpenChange(false);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: t(`${K}.failedTitle`),
          description: errorText(error, "failedDescription"),
        });
      },
    });
  };

  const isSaving = save.isPending;
  const isScanning = scan.kind === "reading" || parseQr.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(`${K}.title`)}</DialogTitle>
          <DialogDescription>{t(`${K}.description`)}</DialogDescription>
        </DialogHeader>

        <form
          id="add-bank-account-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Fill in from the bank app's QR (optional) */}
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {t(`${K}.scanTitle`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`${K}.scanHint`)}
                </p>
              </div>
            </div>
            <input
              ref={qrInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleQrPicked}
              data-testid="bank-qr-input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={CONTROL_HOVER}
              disabled={isScanning || isSaving}
              onClick={() => qrInputRef.current?.click()}
            >
              {isScanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="h-4 w-4" />
              )}
              {isScanning ? t(`${K}.scanReading`) : t(`${K}.scanButton`)}
            </Button>
            {scan.kind === "filled" && (
              <p
                role="status"
                className="flex items-center gap-1.5 text-xs font-medium text-primary"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t(`${K}.scanFilled`)}
              </p>
            )}
            {scan.kind === "error" && (
              <p
                role="alert"
                className="flex items-center gap-1.5 text-xs font-medium text-destructive"
              >
                <TriangleAlert className="h-4 w-4" />
                {scan.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t(`${K}.manualDivider`)}
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank-bin">{t(`${K}.bank`)}</Label>
            <Controller
              control={control}
              name="bank_bin"
              render={({ field }) => (
                <BankPicker
                  id="bank-bin"
                  banks={banks.data ?? []}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSaving || banks.isLoading}
                  invalid={Boolean(errors.bank_bin)}
                />
              )}
            />
            {errors.bank_bin && (
              <p className="text-xs font-medium text-destructive">
                {errors.bank_bin.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-number">{t(`${K}.accountNumber`)}</Label>
            <Input
              id="account-number"
              inputMode="numeric"
              autoComplete="off"
              placeholder={t(`${K}.accountNumberPlaceholder`)}
              aria-invalid={Boolean(errors.account_number) || undefined}
              disabled={isSaving}
              {...register("account_number")}
            />
            {errors.account_number && (
              <p className="text-xs font-medium text-destructive">
                {errors.account_number.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-name">{t(`${K}.accountName`)}</Label>
            <Input
              id="account-name"
              autoComplete="off"
              placeholder={t(`${K}.accountNamePlaceholder`)}
              aria-invalid={Boolean(errors.account_name) || undefined}
              disabled={isSaving}
              {...register("account_name")}
            />
            <p className="text-xs text-muted-foreground">
              {t(`${K}.accountNameHint`)}
            </p>
            {errors.account_name && (
              <p className="text-xs font-medium text-destructive">
                {errors.account_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t(`${K}.holderType`)}</Label>
            <Controller
              control={control}
              name="holder_type"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-wrap gap-5"
                  disabled={isSaving}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="INDIVIDUAL" id="holder-individual" />
                    <Label htmlFor="holder-individual" className="font-normal">
                      {t(
                        "dashboard.settings.profile.bankAccount.holderIndividual",
                      )}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="ENTITY" id="holder-entity" />
                    <Label htmlFor="holder-entity" className="font-normal">
                      {t("dashboard.settings.profile.bankAccount.holderEntity")}
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
            <p className="text-xs text-muted-foreground">
              {t(`${K}.holderTypeHint`)}
            </p>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className={CONTROL_HOVER}
            disabled={isSaving}
            onClick={() => handleOpenChange(false)}
          >
            {t(`${K}.cancel`)}
          </Button>
          <Button
            type="submit"
            form="add-bank-account-form"
            disabled={isSaving || isScanning}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? t(`${K}.saving`) : t(`${K}.save`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
