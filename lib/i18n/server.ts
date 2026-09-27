import en from "@/lib/i18n/en.json";
import vi from "@/lib/i18n/vi.json";
import { resolveSeoLocale, type SeoLocale } from "@/lib/seo";

/**
 * `t()` for server components and `generateMetadata()`.
 *
 * `useTranslations()` lives in a "use client" module and needs the React
 * context, so a server component (a page wrapper, a Suspense fallback, a tab
 * title) cannot call it. This reads the same NEXT_LOCALE cookie the provider is
 * seeded from, so server-rendered text and client-rendered text agree.
 *
 * Same contract as the client `t()`: dot-path keys, `{name}` placeholders, and
 * the key itself comes back when a string is missing.
 */
export type ServerTranslate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

const dictionaries = { en, vi } as const;

function lookup(source: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

export function createServerTranslator(locale: SeoLocale): ServerTranslate {
  const dictionary = dictionaries[locale];
  return (key, values) => {
    const value = lookup(dictionary, key);
    if (typeof value !== "string") return key;
    if (!values) return value;
    return value.replace(/\{(\w+)\}/g, (_, name: string) =>
      values[name] === undefined ? `{${name}}` : String(values[name]),
    );
  };
}

export async function getServerTranslations() {
  const locale = await resolveSeoLocale();
  return { locale, t: createServerTranslator(locale) };
}
