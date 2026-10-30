import enDictionary from "@/lib/i18n/en.json";

/** The English dictionary with {placeholders} filled, for component tests. */
export const t = (key: string, vars?: Record<string, string | number>) => {
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      enDictionary,
    );
  if (typeof value !== "string") return key;
  return Object.entries(vars ?? {}).reduce(
    (text, [name, v]) => text.replaceAll(`{${name}}`, String(v)),
    value,
  );
};
