/**
 * What a contact-form sender is writing about.
 *
 * `value` is sent to the backend verbatim and must match a member of
 * `ContactPurpose` in the backend's `app/contact/schemas.py` exactly — the
 * request is rejected with a 422 otherwise. The backend maps the value to the
 * English label that prefixes the notification subject (`[Partnership] …`), so
 * the team inbox can be filtered on the header; the label is never taken from
 * this file, only the value.
 */
export interface ContactPurposeOption {
  /** Exact backend enum value. Do not translate, do not reword. */
  value: string;
  /** i18n key under `contactPage.form.purposes`. */
  labelKey: string;
}

export const CONTACT_PURPOSE_OPTIONS: readonly ContactPurposeOption[] = [
  { value: "sme_funding", labelKey: "smeFunding" },
  { value: "investing", labelKey: "investing" },
  { value: "partnership", labelKey: "partnership" },
  { value: "support", labelKey: "support" },
  { value: "media", labelKey: "media" },
  { value: "other", labelKey: "other" },
] as const;
