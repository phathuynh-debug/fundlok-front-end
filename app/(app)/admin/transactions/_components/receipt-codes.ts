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

export function failureLabel(t: T, code: string): string {
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
export function reasonLabel(t: T, code: string): string {
  const [head, arg] = code.split(":", 2);
  const key = `admin.transactions.system.reasons.${head}`;
  const label = t(key);
  if (label === key) return code;
  return arg === undefined ? label : label.replace("{field}", fieldLabel(t, arg));
}
