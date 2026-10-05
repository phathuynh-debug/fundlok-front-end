"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { ContactForm } from "@/components/contact-form";
import { BackgroundBlobs } from "@/components/background-blobs";
import { useTranslations } from "@/lib/i18n";

/* Entrance motion, matching the other marketing pages (see faq-client and
 * rate-client): the heading drops in, then the two panels rise with a short
 * cascade so the eye lands on the copy before the form.
 *
 * Restrained on purpose. This is a financing platform's contact page, so motion
 * is here to order the reading, not to perform. The two info cards stagger
 * against each other; nothing loops, nothing parallaxes. */
const cardsContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const cardItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function ContactClient() {
  const { t } = useTranslations();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-[100dvh] w-full bg-background text-foreground overflow-x-clip">
      <SiteHeader />

      <BackgroundBlobs variant="compact" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="space-y-3"
            >
              <p className="eyebrow">{t("contactPage.eyebrow")}</p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                {t("contactPage.title")}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                {t("contactPage.description")}
              </p>
            </motion.div>

            <motion.div
              variants={cardsContainer}
              initial={reduceMotion ? false : "hidden"}
              animate="visible"
              transition={{ delayChildren: 0.15 }}
              className="grid gap-4 sm:grid-cols-2"
            >
              <motion.div
                variants={cardItem}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {t("contactPage.emailLabel")}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  support@fundlok.com
                </p>
              </motion.div>
              <motion.div
                variants={cardItem}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {t("contactPage.locationLabel")}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("contactPage.locationValue")}
                </p>
              </motion.div>
            </motion.div>
          </section>

          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28, ease: "easeOut" }}
            className="rounded-2xl border border-border bg-card p-6 md:p-8"
          >
            <ContactForm />
          </motion.section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
