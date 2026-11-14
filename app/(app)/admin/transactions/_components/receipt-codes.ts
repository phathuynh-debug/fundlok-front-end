// Plain-language labels for the codes a receipt check returns: the checks a
// receipt failed (backend receipts.check_receipt and receipt_auto), and why the
// system left a receipt for staff (receipt-ocr.md). A code the dictionary does
// not know yet is shown as is.

type T = (key: string) => string;

function fieldLabel(t: T, field: string): string {
  const key = `admin.transactions.fields.${field}`;
  const label = t(key);
  return label === key ? field : label;
}

export type ReceiptSubject = "investment" | "repayment";

// The repayment wording first, where it differs; the investment wording else.
function labelFor(t: T, keys: string[]): string | null {
  for (const key of keys) {
    const label = t(key);
    if (label !== key) return label;
  }
  return null;
}

export function failureLabel(
  t: T,
  code: string,
  subject: ReceiptSubject = "investment",
): string {
  if (subject === "repayment" && !code.startsWith("MISSING_FIELD:")) {
    const label = labelFor(t, [
      `admin.transactions.repaymentFailures.${code}`,
      `admin.transactions.failures.${code}`,
    ]);
    return label ?? code;
  }
  if (code.startsWith("MISSING_FIELD:")) {
    return t("admin.transactions.failures.MISSING_FIELD").replace(
      "{field}",
      fieldLabel(t, code.slice("MISSING_FIELD:".length)),
    );
  }
  const key = `admin.transactions.failures.${code}`;
  const label = t(key);
  return label === key ? code : label;
}

/** e.g. LOW_CONFIDENCE:memo, PAYEE_BANK_NOT_SHOWN, OCR_FAILED:TIMEOUT. */
export function reasonLabel(
  t: T,
  code: string,
  subject: ReceiptSubject = "investment",
): string {
  const [head, arg] = code.split(":", 2);
  const label = labelFor(t, [
    ...(subject === "repayment"
      ? [`admin.transactions.system.repayment.reasons.${head}`]
      : []),
    `admin.transactions.system.reasons.${head}`,
  ]);
  if (label === null) return code;
  return arg === undefined
    ? label
    : label.replace("{field}", fieldLabel(t, arg));
}
