"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslations();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    // Pulse skeleton/placeholder to prevent hydration layout shift
    return (
      <div className="w-9 h-9 rounded-full border border-border/20 bg-muted/20 animate-pulse shrink-0" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground bg-white/40 dark:bg-slate-900/30 hover:bg-white/70 dark:hover:bg-slate-900/60 transition-all duration-300 outline-none hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
      aria-label={t("common.toggleTheme")}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-500 animate-in fade-in zoom-in-50 duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-500 animate-in fade-in zoom-in-50 duration-300" />
      )}
    </button>
  );
}
