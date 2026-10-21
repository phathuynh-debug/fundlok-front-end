import type en from "@/lib/i18n/en.json";

export const FAQ_CATEGORIES = ["general", "msme", "investor"] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

type FaqPageMessages = (typeof en)["faqPage"];

/**
 * The question numbers a category actually has, read from the dictionary
 * rather than a hardcoded count — so one category can carry an extra Q&A
 * without the other two rendering blank accordion rows (and without the
 * FAQPage structured data emitting `undefined` answers).
 *
 * Either locale's `faqPage` gives the same numbering, because `vi.json` must
 * mirror `en.json`'s structure (see AGENTS.md). The caller passes it in — the
 * page from the server dictionary, the client from `useTranslations().messages`
 * — so this module never imports a dictionary into a client bundle.
 */
export function faqQuestionNumbers(
  faqPage: FaqPageMessages,
  category: FaqCategory,
): number[] {
  const entries = faqPage[category] as Record<string, string>;
  return Object.keys(entries)
    .map((key) => /^q(\d+)$/.exec(key)?.[1])
    .filter((digits): digits is string => digits !== undefined)
    .map(Number)
    .sort((a, b) => a - b);
}
