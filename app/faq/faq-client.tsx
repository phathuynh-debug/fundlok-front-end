"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const QUESTIONS_PER_CATEGORY = 6;

const CATEGORIES = ["general", "msme", "investor"] as const;
type CategoryKey = (typeof CATEGORIES)[number];

const sectionId = (key: CategoryKey) => `faq-${key}`;

// Organic blob shape (blobmaker-style path, centered on origin).
const BLOB_PATH =
  "M44.9,-65.2C57.4,-56.6,66.3,-43.2,71.3,-28.5C76.3,-13.8,77.4,2.3,73.1,16.7C68.8,31.1,59.2,43.7,46.9,53.3C34.6,62.9,19.7,69.4,3.6,64.9C-12.5,60.4,-25,44.9,-37.2,34.6C-49.4,24.3,-61.3,19.2,-67.4,9.4C-73.5,-0.4,-73.9,-14.9,-67.4,-25.8C-60.9,-36.7,-47.5,-44,-34.7,-52.4C-21.9,-60.8,-11,-70.3,2.7,-74.5C16.4,-78.7,32.4,-73.8,44.9,-65.2Z";

const BLOB_PATH_ALT =
  "M51.4,-58.8C64.9,-47.9,73.3,-30.4,75.4,-12.4C77.5,5.6,73.2,24.1,63.2,38.4C53.2,52.7,37.5,62.8,20.3,68.3C3.1,73.8,-15.6,74.7,-31.4,67.9C-47.2,61.1,-60.1,46.6,-67.1,29.9C-74.1,13.2,-75.2,-5.7,-69.3,-21.9C-63.4,-38.1,-50.5,-51.6,-35.9,-62.1C-21.3,-72.6,-5,-80.1,9.9,-78.2C24.8,-76.3,37.9,-69.7,51.4,-58.8Z";

function BackgroundBlobs() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
    >
      <motion.svg
        viewBox="-100 -100 200 200"
        animate={{ y: [0, 26, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-48 top-[16%] w-[34rem] h-[34rem] text-emerald-500/10 dark:text-emerald-400/[0.07]"
      >
        <path d={BLOB_PATH} fill="currentColor" />
      </motion.svg>

      <motion.svg
        viewBox="-100 -100 200 200"
        animate={{ y: [0, -30, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-56 top-[4%] w-[42rem] h-[42rem] text-emerald-500/15 dark:text-emerald-400/10"
      >
        <path d={BLOB_PATH_ALT} fill="currentColor" />
      </motion.svg>

      <motion.svg
        viewBox="-100 -100 200 200"
        animate={{ y: [0, 22, 0], rotate: [0, 12, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-40 bottom-[-6rem] w-[36rem] h-[36rem] text-emerald-500/10 dark:text-emerald-400/[0.07]"
      >
        <path d={BLOB_PATH} fill="currentColor" />
      </motion.svg>

      <motion.svg
        viewBox="-100 -100 200 200"
        animate={{ y: [0, -18, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-40 bottom-[18%] w-[30rem] h-[30rem] text-emerald-500/[0.08] dark:text-emerald-400/[0.06]"
      >
        <path d={BLOB_PATH_ALT} fill="currentColor" />
      </motion.svg>
    </div>
  );
}

export default function FaqClient() {
  const { t } = useTranslations();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("general");

  // Highlight the pill of the category currently in view while scrolling.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveCategory(
              entry.target.id.replace("faq-", "") as CategoryKey,
            );
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    for (const key of CATEGORIES) {
      const element = document.getElementById(sectionId(key));
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  const scrollToCategory = (key: CategoryKey) => {
    setActiveCategory(key);
    document
      .getElementById(sectionId(key))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col overflow-x-hidden selection:bg-accent/20">
      <SiteHeader />

      <BackgroundBlobs />

      <main className="relative z-10 flex-1 w-full">
        {/* Page hero */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center pt-16 pb-8 px-6"
        >
          <p className="font-mono text-xs tracking-widest text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-3">
            {t("faqPage.eyebrow")}
          </p>
          <h1 className="font-sans text-4xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase mb-4">
            {t("faqPage.title")}
          </h1>
          <p className="font-sans text-sm md:text-base text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
            {t("faqPage.subtitle")}
          </p>
        </motion.div>

        {/* Category pill bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="flex flex-wrap items-center justify-center gap-3 px-6 mb-14"
        >
          {CATEGORIES.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => scrollToCategory(key)}
              className={cn(
                "rounded-full px-6 py-2.5 font-mono text-[11px] tracking-widest font-bold uppercase transition-all duration-300 cursor-pointer shadow-sm active:scale-95",
                activeCategory === key
                  ? "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-slate-950 shadow-emerald-500/25 shadow-md"
                  : "bg-white dark:bg-slate-900 border border-border/60 text-emerald-700 dark:text-emerald-400 hover:border-emerald-500/40 hover:shadow-md",
              )}
            >
              {t(`faqPage.${key}.title`)}
            </button>
          ))}
        </motion.div>

        {/* Question sections */}
        <div className="max-w-3xl mx-auto px-6 pb-20 space-y-16">
          {CATEGORIES.map((key) => (
            <motion.section
              key={key}
              id={sectionId(key)}
              className="scroll-mt-28"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <h2 className="font-sans text-2xl md:text-3xl font-extrabold tracking-tight text-foreground uppercase mb-2">
                {t(`faqPage.${key}.title`)}:
              </h2>

              <Accordion type="single" collapsible className="w-full">
                {Array.from(
                  { length: QUESTIONS_PER_CATEGORY },
                  (_, i) => i + 1,
                ).map((n) => (
                  <AccordionItem
                    key={n}
                    value={`${key}-${n}`}
                    className="border-foreground/15"
                  >
                    <AccordionTrigger className="py-5 font-sans text-sm md:text-[15px] font-bold text-foreground hover:no-underline hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors [&>svg]:text-foreground/60">
                      {t(`faqPage.${key}.q${n}`)}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm text-muted-foreground leading-relaxed">
                      {t(`faqPage.${key}.a${n}`)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.section>
          ))}

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/15 backdrop-blur-md p-8 md:p-10 text-center"
          >
            <h3 className="font-sans text-xl md:text-2xl font-extrabold tracking-tight text-foreground mb-2">
              {t("faqPage.ctaTitle")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
              {t("faqPage.ctaText")}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 px-6 py-3 text-xs font-mono tracking-widest font-bold uppercase text-white transition-all duration-300 shadow-md hover:shadow-emerald-500/10 active:scale-95"
            >
              {t("faqPage.ctaButton")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
