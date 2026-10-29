import * as z from "zod";

type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

const K = "dashboard.settings.profile.bankAccount.form";

// The bank picker's value for "my bank is not in the list". Never sent to the
// backend: the request carries `bank_bin: null` and the typed name instead.
export const OTHER_BANK = "OTHER";

// Same rules as the backend (register_payment_account): 4–32 letters or digits
// once the spaces bank apps print between groups are taken out.
export function bankAccountFormSchema(t: Translate) {
  return z
    .object({
      bank_bin: z.string(),
      other_bank_name: z.string().trim().max(100),
      account_number: z
        .string()
        .transform((value) => value.replace(/\s+/g, ""))
        .pipe(
          z
            .string()
            .regex(/^[A-Za-z0-9]{4,32}$/, t(`${K}.accountNumberInvalid`)),
        ),
      account_name: z
        .string()
        .trim()
        .min(1, t(`${K}.accountNameRequired`))
        .max(128),
      holder_type: z.enum(["INDIVIDUAL", "ENTITY"]),
    })
    .superRefine((values, ctx) => {
      if (values.bank_bin === OTHER_BANK) {
        if (!values.other_bank_name) {
          ctx.addIssue({
            code: "custom",
            path: ["other_bank_name"],
            message: t(`${K}.otherBankNameRequired`),
          });
        }
      } else if (!/^\d{6}$/.test(values.bank_bin)) {
        ctx.addIssue({
          code: "custom",
          path: ["bank_bin"],
          message: t(`${K}.bankRequired`),
        });
      }
    });
}

export type BankAccountFormInput = z.input<
  ReturnType<typeof bankAccountFormSchema>
>;
export type BankAccountFormValues = z.output<
  ReturnType<typeof bankAccountFormSchema>
>;
