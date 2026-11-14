import type { AdminFundingActivity } from "@/services/admin-funding.service";

export type ActivityTone = "approve" | "deny" | "review" | "neutral";

/** What an audit entry means for the ticket, as a label key and a tone. A
 *  receipt check is an approval when it matched and a referral when not. */
export function activityKind(entry: AdminFundingActivity): {
  key: string;
  tone: ActivityTone;
} {
  switch (entry.action) {
    case "TRANSFER_RECEIPT_CHECKED":
      return entry.check_status === "MATCHED"
        ? { key: "approvedMatch", tone: "approve" }
        : { key: "sentToReview", tone: "review" };
    case "TRANSFER_RECEIVED":
      return { key: "received", tone: "approve" };
    case "TRANSFER_NOT_RECEIVED":
      return { key: "notReceived", tone: "deny" };
    case "TRANSFER_RECEIPT_REJECTED":
      return { key: "rejected", tone: "deny" };
    // The system's own verdicts on receipts it read (receipt-ocr.md).
    case "TRANSFER_SYSTEM_ACCEPTED":
      return { key: "systemAccepted", tone: "approve" };
    case "TRANSFER_SYSTEM_DENIED":
      return { key: "systemDenied", tone: "deny" };
    case "TRANSFER_SYSTEM_NEEDS_REVIEW":
      return { key: "systemNeedsReview", tone: "review" };
    case "INVESTMENT_RESERVED":
      return { key: "reserved", tone: "neutral" };
    case "INVESTMENT_RECEIPT_UPLOADED":
      return { key: "uploaded", tone: "neutral" };
    case "TRANSFER_RECEIPT_VIEWED":
      return { key: "viewed", tone: "neutral" };
    case "REPAYMENT_RECEIPT_APPROVED":
      return { key: "repaymentApproved", tone: "approve" };
    case "REPAYMENT_RECEIPT_CONFIRMED":
      return { key: "repaymentConfirmed", tone: "approve" };
    case "REPAYMENT_RECEIPT_DENIED":
      return { key: "repaymentDenied", tone: "deny" };
    case "REPAYMENT_DAYS_MARKED_PAID":
      return { key: "repaymentMarked", tone: "neutral" };
    case "INVESTMENT_REPORTED_MISSING":
      return { key: "reportedMissing", tone: "review" };
    case "REPAYMENT_RECEIPT_VIEWED":
      return { key: "repaymentViewed", tone: "neutral" };
    default:
      return { key: "other", tone: "neutral" };
  }
}

export const TONE_CLASS: Record<ActivityTone, string> = {
  approve:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  deny: "border-destructive/40 bg-destructive/10 text-destructive",
  review:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  neutral: "",
};

export function personName(
  person: { full_name: string | null; email: string | null } | null,
): string | null {
  return person ? person.full_name || person.email : null;
}
