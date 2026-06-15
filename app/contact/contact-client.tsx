"use client";

import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { ContactForm } from "@/components/contact-form";
import { BackgroundBlobs } from "@/components/background-blobs";
import { useTranslations } from "@/lib/i18n";

export default function ContactClient() {
  const { t } = useTranslations();

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      <SiteHeader />

      <BackgroundBlobs variant="compact" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-mono font-bold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">
                {t("contactPage.eyebrow")}
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                {t("contactPage.title")}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                {t("contactPage.description")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/60 bg-white/40 p-5 shadow-sm backdrop-blur-md dark:bg-slate-900/30">
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">
                  {t("contactPage.emailLabel")}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  support@fundlok.com
                </p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-white/40 p-5 shadow-sm backdrop-blur-md dark:bg-slate-900/30">
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">
                  {t("contactPage.locationLabel")}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("contactPage.locationValue")}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white/50 p-6 shadow-xl backdrop-blur-md dark:bg-slate-900/35 md:p-8">
            <ContactForm />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
