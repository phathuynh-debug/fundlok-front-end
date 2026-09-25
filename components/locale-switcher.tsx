"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { CONTROL_IDLE } from "@/lib/ui-tokens";

interface LocaleSwitcherProps {
  // "inverted" is for placement on a dark panel (e.g. the 404 / auth hero side).
  tone?: "default" | "inverted";
  className?: string;
}

export function LocaleSwitcher({
  tone = "default",
  className,
}: LocaleSwitcherProps) {
  const { locale, setLocale, t } = useTranslations();
  const inverted = tone === "inverted";

  // Two-letter codes rather than the language names. "EN"/"VI" read the same
  // in either locale, so the control stops changing width when the language
  // does — the names were the widest thing in the header, and in Vietnamese
  // ("Tiếng Anh"/"Tiếng Việt") they were nearly twice the English width.
  //
  // The full name stays as the accessible name: a screen reader announcing
  // "V I" is not a language.
  const options = [
    { value: "en", code: "EN", label: t("localeSwitcher.english") },
    { value: "vi", code: "VI", label: t("localeSwitcher.vietnamese") },
  ] as const;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border p-0.5 shadow-sm",
        inverted
          ? "border-white/20 bg-white/10 backdrop-blur-sm"
          : "border-border bg-background",
        className,
      )}
    >
      {options.map((opt) => {
        const active = locale === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLocale(opt.value)}
            aria-pressed={active}
            aria-label={opt.label}
            title={opt.label}
            className={cn(
              "h-7 min-w-9 rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors",
              active
                ? inverted
                  ? "bg-white text-slate-900"
                  : "bg-primary text-primary-foreground shadow-sm"
                : inverted
                  ? "text-white/70 hover:bg-white/15 hover:text-white"
                  : CONTROL_IDLE,
            )}
          >
            {opt.code}
          </button>
        );
      })}
    </div>
  );
}
