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

  const options = [
    { value: "en", label: t("localeSwitcher.english") },
    { value: "vi", label: t("localeSwitcher.vietnamese") },
  ] as const;

  return (
    <div
      className={cn(
        "inline-flex rounded-full border p-1 shadow-sm",
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
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium transition-colors",
              active
                ? inverted
                  ? "bg-white text-slate-900"
                  : "bg-primary text-primary-foreground shadow-sm"
                : inverted
                  ? "text-white/70 hover:bg-white/15 hover:text-white"
                  : CONTROL_IDLE,
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
