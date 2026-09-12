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
import { BackgroundBlobs } from "@/components/background-blobs";
import { useTranslations } from "@/lib/i18n";
import {
  FAQ_CATEGORIES,
  faqQuestionNumbers,
  type FaqCategory,
} from "@/lib/faq-questions";
import { cn } from "@/lib/utils";

const CATEGORIES = FAQ_CATEGORIES;
type CategoryKey = FaqCategory;

const sectionId = (key: CategoryKey) => `faq-${key}`;

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
                {faqQuestionNumbers(key).map((n) => (
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
