"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import { localizedPath, parseLocalePath } from "@/lib/locale-routing";
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
  const route = parseLocalePath(usePathname() ?? "/");
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
        const className = cn(
          "inline-flex h-7 min-w-9 items-center justify-center rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors",
          active
            ? inverted
              ? "bg-white text-slate-900"
              : "bg-primary text-primary-foreground shadow-sm"
            : inverted
              ? "text-white/70 hover:bg-white/15 hover:text-white"
              : CONTROL_IDLE,
        );

        // On a page with a URL per language (lib/locale-routing.ts) each
        // option is a real link to that language's URL. Search engines follow
        // <a href>, not buttons: while this was a button, no Vietnamese page
        // linked to its English twin, so Google could reach /en/* only through
        // the sitemap and left those pages largely unindexed.
        //
        // The click itself still goes through setLocale — cookie first, then
        // a full load that keeps the query and hash — exactly as the button
        // did. A plain <a>, not next/link: a soft navigation would keep the
        // other language's server-rendered <title> and canonical (see
        // setLocale in lib/i18n).
        if (route.locale !== null) {
          return (
            <a
              key={opt.value}
              href={localizedPath(route.path, opt.value)}
              hrefLang={opt.value}
              onClick={(event) => {
                event.preventDefault();
                setLocale(opt.value);
              }}
              aria-current={active ? "true" : undefined}
              aria-label={opt.label}
              title={opt.label}
              className={className}
            >
              {opt.code}
            </a>
          );
        }

        // Everywhere else the language is a cookie preference with no URL of
        // its own (dashboard, admin, KYC), so there is nothing to link to.
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLocale(opt.value)}
            aria-pressed={active}
            aria-label={opt.label}
            title={opt.label}
            className={className}
          >
            {opt.code}
          </button>
        );
      })}
    </div>
  );
}
