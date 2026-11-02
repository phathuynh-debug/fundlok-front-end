"use client";

import { useState } from "react";
import { Loader2, ScanSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import { useEnterTransferFields } from "@/hooks/use-admin-funding";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { transferErrorMessage } from "./transfer-errors";

const FIELDS = [
  "payer_name",
  "payer_account",
  "payee_account",
  "memo",
  "bank_txn_id",
] as const;
type TextField = (typeof FIELDS)[number];

// Staff type what the receipt shows. Nothing is prefilled from the
// reservation: the point is to compare the receipt with it, and a prefilled
// form would only be compared with itself. A field the receipt does not show
// stays blank; the checks then fail and the ticket goes to review.
export function ReceiptFieldsForm({ transferId }: { transferId: string }) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const enter = useEnterTransferFields();
  const [amount, setAmount] = useState("");
  const [transferredAt, setTransferredAt] = useState("");
  const [text, setText] = useState<Record<TextField, string>>({
    payer_name: "",
    payer_account: "",
    payee_account: "",
    memo: "",
    bank_txn_id: "",
  });
  const [reason, setReason] = useState("");
  const ready =
    Number(amount) > 0 && transferredAt !== "" && reason.trim() !== "";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    const blank = (value: string) => value.trim() || null;
    enter.mutate(
      {
        transferId,
        body: {
          amount_vnd: Number(amount),
          // datetime-local is the reviewer's local time; send it with an offset.
          transferred_at: new Date(transferredAt).toISOString(),
          payer_name: blank(text.payer_name),
          payer_account: blank(text.payer_account),
          payee_account: blank(text.payee_account),
          memo: blank(text.memo),
          bank_txn_id: blank(text.bank_txn_id),
          reason: reason.trim(),
        },
      },
      {
        onSuccess: (row) =>
          toast({
            title:
              row.transfer?.check_status === "MATCHED"
                ? t("admin.transactions.sheet.matchedToast")
                : t("admin.transactions.sheet.mismatchToast"),
          }),
        onError: (error) =>
          toast({
            variant: "destructive",
            title: t("admin.transactions.sheet.checkFailed"),
            description: transferErrorMessage(error, t, locale),
          }),
      },
    );
  };

  const id = (name: string) => `receipt-${name}-${transferId}`;
  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={id("amount")}>
            {t("admin.transactions.fields.amount_vnd")}
          </Label>
          <NumericInput
            id={id("amount")}
            value={amount}
            onValueChange={setAmount}
            disabled={enter.isPending}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={id("time")}>
            {t("admin.transactions.fields.transferred_at")}
          </Label>
          <Input
            id={id("time")}
            type="datetime-local"
            value={transferredAt}
            onChange={(event) => setTransferredAt(event.target.value)}
            disabled={enter.isPending}
            required
          />
        </div>
        {FIELDS.map((name) => (
          <div
            key={name}
            className={
              name === "memo" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"
            }
          >
            <Label htmlFor={id(name)}>
              {t(`admin.transactions.fields.${name}`)}
            </Label>
            <Input
              id={id(name)}
              value={text[name]}
              onChange={(event) =>
                setText((prev) => ({ ...prev, [name]: event.target.value }))
              }
              disabled={enter.isPending}
              autoComplete="off"
              className={
                name === "memo" || name.endsWith("account")
                  ? "font-mono"
                  : undefined
              }
            />
          </div>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {t("admin.transactions.sheet.blankHint")}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor={id("reason")}>
          {t("admin.transactions.sheet.note")}
        </Label>
        <Textarea
          id={id("reason")}
          rows={2}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t("admin.transactions.sheet.notePlaceholder")}
          disabled={enter.isPending}
          required
        />
      </div>
      <Button
        type="submit"
        size="sm"
        className="w-full gap-2"
        disabled={!ready || enter.isPending}
      >
        {enter.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ScanSearch className="h-4 w-4" />
        )}
        {t("admin.transactions.sheet.check")}
      </Button>
    </form>
  );
}
