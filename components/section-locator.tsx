"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

// Landing page sections, in document order. Each id must exist on a <section>.
const SECTIONS = [
  { id: "hero", labelKey: "header.overview" },
  { id: "process", labelKey: "header.howItWorks" },
  { id: "partners", labelKey: "header.partners" },
  { id: "team", labelKey: "header.team" },
] as const;

// Vertical scroll-spy rail pinned to the right edge of the landing page.
// Shows which section is currently in view and jumps to a section on click.
export function SectionLocator() {
  const { t } = useTranslations();
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    // A thin horizontal band around the middle of the viewport decides which
    // section is "current" — whichever section overlaps it wins.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );

    for (const { id } of SECTIONS) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.nav
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
      aria-label="Page sections"
      className="fixed right-5 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-end gap-5"
    >
      {SECTIONS.map(({ id, labelKey }) => {
        const isActive = activeId === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => scrollToSection(id)}
            aria-current={isActive ? "true" : undefined}
            className="group flex items-center gap-2.5 cursor-pointer bg-transparent border-none p-0 outline-none"
          >
            <span
              className={cn(
                "font-mono text-[9px] tracking-widest font-bold uppercase transition-all duration-300 select-none",
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 opacity-100 translate-x-0"
                  : "text-zinc-500 dark:text-zinc-400 opacity-0 translate-x-1.5 group-hover:opacity-100 group-hover:translate-x-0",
              )}
            >
              {t(labelKey)}
            </span>
            <span
              className={cn(
                "rounded-full transition-all duration-300",
                isActive
                  ? "w-2.5 h-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]"
                  : "w-1.5 h-1.5 bg-zinc-400/70 dark:bg-zinc-600 group-hover:bg-zinc-500 dark:group-hover:bg-zinc-400",
              )}
            />
          </button>
        );
      })}
    </motion.nav>
  );
}
