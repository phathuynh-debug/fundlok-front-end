import * as z from "zod";

type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

const K = "dashboard.settings.profile.bankAccount.form";

// Same rules as the backend (register_payment_account): 4–32 letters or digits
// once the spaces bank apps print between groups are taken out.
export function bankAccountFormSchema(t: Translate) {
  return z.object({
    bank_bin: z.string().regex(/^\d{6}$/, t(`${K}.bankRequired`)),
    account_number: z
      .string()
      .transform((value) => value.replace(/\s+/g, ""))
      .pipe(
        z.string().regex(/^[A-Za-z0-9]{4,32}$/, t(`${K}.accountNumberInvalid`)),
      ),
    account_name: z
      .string()
      .trim()
      .min(1, t(`${K}.accountNameRequired`))
      .max(128),
    holder_type: z.enum(["INDIVIDUAL", "ENTITY"]),
    statement_purpose: z.enum(["BANK_STATEMENT", "BANK_CONFIRMATION"]),
  });
}

export type BankAccountFormInput = z.input<
  ReturnType<typeof bankAccountFormSchema>
>;
export type BankAccountFormValues = z.output<
  ReturnType<typeof bankAccountFormSchema>
>;
