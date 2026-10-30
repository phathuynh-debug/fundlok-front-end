"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDecidePaymentAccount } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { apiErrorMessage } from "@/lib/api-error-message";
import { CONTROL_HOVER } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";

const K = "admin.bankAccounts";

interface PaymentAccountDecisionProps {
  accountId: string;
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/**
 * Approve or reject a PENDING bank account. The note is optional to approve
 * and required to reject (the user sees it as the reason). The decision is
 * final, and the backend records it in the audit log with the admin who made
 * it.
 */
export function PaymentAccountDecision({
  accountId,
  locale,
  t,
}: PaymentAccountDecisionProps) {
  const { toast } = useToast();
  const decide = useDecidePaymentAccount();
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  const submit = (decision: "APPROVED" | "REJECTED") => {
    const trimmed = note.trim();
    if (decision === "REJECTED" && !trimmed) {
      setNoteError(t(`${K}.reasonRequired`));
      return;
    }
    setNoteError(null);
    decide.mutate(
      { id: accountId, body: { decision, note: trimmed || null } },
      {
        onSuccess: () => {
          toast({
            title:
              decision === "APPROVED"
                ? t(`${K}.approvedToast`)
                : t(`${K}.rejectedToast`),
          });
          setNote("");
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: t(`${K}.decisionFailed`),
            description: apiErrorMessage(
              error,
              locale,
              t(`${K}.decisionFailedDescription`),
            ),
          });
        },
      },
    );
  };

  const pending = decide.isPending;

  return (
    <div className="space-y-2 pt-2">
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t(`${K}.notePlaceholder`)}
        aria-label={t(`${K}.note`)}
        aria-invalid={Boolean(noteError) || undefined}
        className={cn("min-h-16 text-xs", noteError && "border-destructive")}
        maxLength={1000}
        disabled={pending}
      />
      {noteError && (
        <p className="text-xs font-medium text-destructive">{noteError}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => submit("APPROVED")}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {t(`${K}.approve`)}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn("text-destructive", CONTROL_HOVER)}
          disabled={pending}
          onClick={() => submit("REJECTED")}
        >
          <X className="h-4 w-4" />
          {t(`${K}.reject`)}
        </Button>
      </div>
    </div>
  );
}
