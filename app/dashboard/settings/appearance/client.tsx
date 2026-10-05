"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Globe,
  Laptop,
  Moon,
  Palette,
  Sparkles,
  Square,
  Sun,
  Zap,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppearance } from "@/components/appearance-provider";
import { RADII } from "@/lib/appearance";
import { useTranslations } from "@/lib/i18n";
import {
  fadeInUpProps,
  pageTransitionProps,
  springItemVariants,
  staggerContainerVariants,
} from "@/lib/animations";
import { AccentPicker } from "./_components/AccentPicker";
import { ChromePreview } from "./_components/ChromePreview";
import { OptionCard } from "./_components/OptionCard";
import { ThemePreview } from "./_components/ThemePreview";

/**
 * /dashboard/settings/appearance
 *
 * Every control here changes the app immediately — there is no Save button,
 * because each preference is a single value with a visible effect, and a
 * "Save" step on a theme picker only delays the feedback that tells you
 * whether you picked the right thing.
 *
 * Persistence differs per preference and that is deliberate:
 *   theme        next-themes (localStorage) + the `class` attribute
 *   language     NEXT_LOCALE cookie, read by app/layout.tsx during SSR
 *   accent       fl_accent cookie + a data-accent attribute on <html>
 *   radius       fl_radius cookie + a data-radius attribute on <html>
 *   reduce motion  fl_reduce_motion cookie, likewise (see appearance-provider)
 * None of the three round-trips to the backend: there is no user-preferences
 * API, and inventing one here would mean a column, a migration and a shared
 * model change. When that API lands, this page keeps its shape and swaps the
 * setters for mutations.
 */
export function AppearanceClient() {
  const { t, locale, setLocale } = useTranslations();
  const { theme, setTheme } = useTheme();
  const {
    reduceMotion,
    setReduceMotion,
    accent,
    setAccent,
    radius,
    setRadius,
  } = useAppearance();

  // next-themes cannot know the resolved theme until it has read localStorage,
  // so rendering a selection before mount would flash the wrong option. Same
  // guard as components/theme-toggle.tsx.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const themeOptions = [
    {
      value: "light",
      label: t("dashboard.settings.appearance.theme.light"),
      description: t("dashboard.settings.appearance.theme.lightHint"),
      icon: Sun,
    },
    {
      value: "dark",
      label: t("dashboard.settings.appearance.theme.dark"),
      description: t("dashboard.settings.appearance.theme.darkHint"),
      icon: Moon,
    },
    {
      value: "system",
      label: t("dashboard.settings.appearance.theme.system"),
      description: t("dashboard.settings.appearance.theme.systemHint"),
      icon: Laptop,
    },
  ] as const;

  const localeOptions = [
    {
      value: "en",
      label: t("localeSwitcher.english"),
      description: t("dashboard.settings.appearance.language.enHint"),
      icon: Globe,
    },
    {
      value: "vi",
      label: t("localeSwitcher.vietnamese"),
      description: t("dashboard.settings.appearance.language.viHint"),
      icon: Globe,
    },
  ] as const;

  return (
    <motion.div {...pageTransitionProps} className="space-y-6 md:space-y-8">
      <motion.header {...fadeInUpProps}>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("dashboard.settings.appearance.title")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("dashboard.settings.appearance.subtitle")}
        </p>
      </motion.header>

      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6 md:space-y-8"
      >
        {/* Theme */}
        <motion.div variants={springItemVariants}>
          <Card className="p-6 md:p-8">
            <div className="mb-5">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("dashboard.settings.appearance.theme.heading")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.settings.appearance.theme.description")}
              </p>
            </div>

            {mounted ? (
              <div
                role="radiogroup"
                aria-label={t("dashboard.settings.appearance.theme.heading")}
                className="grid gap-3 sm:grid-cols-3"
              >
                {themeOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    id={`theme-${option.value}`}
                    label={option.label}
                    description={option.description}
                    icon={option.icon}
                    selected={theme === option.value}
                    onSelect={() => setTheme(option.value)}
                    preview={<ThemePreview tone={option.value} />}
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {themeOptions.map((option) => (
                  <Skeleton
                    key={option.value}
                    className="h-[148px] w-full rounded-xl"
                  />
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Accent + radius: the two knobs that restyle the whole app */}
        <motion.div variants={springItemVariants}>
          <Card className="p-6 md:p-8">
            <div className="mb-5">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
                <Palette className="h-5 w-5 text-primary" />
                {t("dashboard.settings.appearance.accent.heading")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.settings.appearance.accent.description")}
              </p>
            </div>

            <AccentPicker value={accent} onChange={setAccent} />

            <p className="mt-4 text-xs text-muted-foreground">
              {t("dashboard.settings.appearance.accent.scopeNote")}
            </p>
          </Card>
        </motion.div>

        <motion.div variants={springItemVariants}>
          <Card className="p-6 md:p-8">
            <div className="mb-5">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
                <Square className="h-5 w-5 text-primary" />
                {t("dashboard.settings.appearance.radius.heading")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.settings.appearance.radius.description")}
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label={t("dashboard.settings.appearance.radius.heading")}
              className="grid gap-3 sm:grid-cols-3"
            >
              {RADII.map((option) => (
                <OptionCard
                  key={option.id}
                  id={`radius-${option.id}`}
                  label={t(
                    `dashboard.settings.appearance.radius.options.${option.labelKey}`,
                  )}
                  icon={Square}
                  selected={radius === option.id}
                  onSelect={() => setRadius(option.id)}
                  preview={
                    <span
                      aria-hidden="true"
                      style={{ borderRadius: option.value }}
                      className="block h-10 w-full border-2 border-primary/40 bg-primary/10"
                    />
                  }
                />
              ))}
            </div>

            <div className="mt-5">
              <ChromePreview />
            </div>
          </Card>
        </motion.div>

        {/* Language */}
        <motion.div variants={springItemVariants}>
          <Card className="p-6 md:p-8">
            <div className="mb-5">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
                <Globe className="h-5 w-5 text-primary" />
                {t("dashboard.settings.appearance.language.heading")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.settings.appearance.language.description")}
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label={t("dashboard.settings.appearance.language.heading")}
              className="grid gap-3 sm:grid-cols-2"
            >
              {localeOptions.map((option) => (
                <OptionCard
                  key={option.value}
                  id={`locale-${option.value}`}
                  label={option.label}
                  description={option.description}
                  icon={option.icon}
                  selected={locale === option.value}
                  onSelect={() => setLocale(option.value)}
                />
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Motion */}
        <motion.div variants={springItemVariants}>
          <Card className="p-6 md:p-8">
            <div className="mb-5">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-foreground">
                <Zap className="h-5 w-5 text-primary" />
                {t("dashboard.settings.appearance.motion.heading")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.settings.appearance.motion.description")}
              </p>
            </div>

            <div className="flex items-start justify-between gap-6 rounded-xl border border-border bg-muted/30 p-4">
              <div className="min-w-0 space-y-1">
                <Label
                  htmlFor="reduce-motion"
                  className="text-sm font-semibold text-foreground"
                >
                  {t("dashboard.settings.appearance.motion.reduceLabel")}
                </Label>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("dashboard.settings.appearance.motion.reduceHint")}
                </p>
              </div>
              <Switch
                id="reduce-motion"
                checked={reduceMotion}
                onCheckedChange={setReduceMotion}
                className="mt-0.5 shrink-0"
              />
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              {t("dashboard.settings.appearance.motion.systemNote")}
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
