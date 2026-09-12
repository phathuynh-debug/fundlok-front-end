import en from "@/lib/i18n/en.json";

export const FAQ_CATEGORIES = ["general", "msme", "investor"] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

/**
 * The question numbers a category actually has, read from the dictionary
 * rather than a hardcoded count — so one category can carry an extra Q&A
 * without the other two rendering blank accordion rows (and without the
 * FAQPage structured data emitting `undefined` answers).
 *
 * `en.json` is the reference because `vi.json` must mirror its structure (see
 * AGENTS.md), which makes the numbering identical in both locales. Importing it
 * costs nothing on the client: `lib/i18n` already pulls both dictionaries in.
 */
export function faqQuestionNumbers(category: FaqCategory): number[] {
  const entries = en.faqPage[category] as Record<string, string>;
  return Object.keys(entries)
    .map((key) => /^q(\d+)$/.exec(key)?.[1])
    .filter((digits): digits is string => digits !== undefined)
    .map(Number)
    .sort((a, b) => a - b);
}
