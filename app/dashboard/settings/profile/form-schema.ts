import { z } from "zod";

type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

// Built as a factory so validation messages are localized via `t`.
// PATCH /users/me accepts full_name, phone, and bio.
export function profileFormSchema(t: Translate) {
  return z.object({
    full_name: z
      .string()
      .trim()
      .min(1, t("dashboard.settings.profile.fullNameRequired")),
    phone: z
      .string()
      .trim()
      .max(30, t("dashboard.settings.profile.phoneTooLong")),
    bio: z.string().trim().max(500, t("dashboard.settings.profile.bioTooLong")),
    email_signature: z
      .string()
      .trim()
      .max(
        2000,
        t("dashboard.settings.profile.emailSignatureTooLong"),
      ),
  });
}

export type ProfileFormValues = z.infer<ReturnType<typeof profileFormSchema>>;
