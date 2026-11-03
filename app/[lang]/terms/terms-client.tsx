"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  FileText,
  Search,
  CheckCircle2,
  Lock,
  Building2,
  ArrowLeft,
  Share2,
  Check,
  ChevronRight,
} from "lucide-react";
import SiteHeader from "@/components/site-header";
import { BackgroundBlobs } from "@/components/background-blobs";
import { useTranslations } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TermsSection } from "./terms-content";

export function TermsClient({
  sections,
  footer,
}: {
  /** The terms in this page's language, from page.tsx (see terms-content.ts). */
  sections: TermsSection[];
  footer: React.ReactNode;
}) {
  const { t, localize } = useTranslations();

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((item) =>
          `${item.heading} ${item.content.join(" ")}`.toLowerCase().includes(q),
        ),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [searchQuery, sections]);

  return (
    // overflow-x-clip, not -hidden: `hidden` makes this wrapper a scroll
    // container, and the sticky table of contents below then sticks to it
    // (i.e. never) instead of the viewport. `clip` hides the background
    // blobs' overflow without that side effect.
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-clip">
      <SiteHeader />
      <BackgroundBlobs variant="compact" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-4 pb-8 border-b border-border/60">
          <Link
            href={localize("/")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t("termsPage.backToHome")}
          </Link>
        </div>

        {/* Hero Header */}
        <header className="py-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Shield className="h-3.5 w-3.5" />
            {t("termsPage.badge")}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            {t("termsPage.title")}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground">
            <span>{t("termsPage.version")}</span>
            <span aria-hidden>•</span>
            <span>{t("termsPage.effectiveDate")}</span>
            <span aria-hidden>•</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 hover:text-foreground font-medium transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t("termsPage.shareCopied")}
                  </span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{t("termsPage.share")}</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Mandatory Invariant / Custody Notice Banner */}
        <aside
          aria-label={t("termsPage.noticeTitle")}
          className="mb-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-5 md:p-6 backdrop-blur-md"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-foreground">
                {t("termsPage.noticeTitle")}
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {t("termsPage.noticeBanner")}
              </p>
            </div>
          </div>
        </aside>

        {/* Content Layout: Sticky Sidebar Navigation + Terms Body */}
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          {/* Sidebar Navigation */}
          <nav
            aria-label={t("termsPage.tableOfContents")}
            // Stays in view while the terms scroll; capped to the viewport so
            // a short screen scrolls the list rather than losing its end.
            className="hidden lg:block space-y-6 sticky top-24 self-start max-h-[calc(100dvh-7rem)] overflow-y-auto"
          >
            <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-2">
                {t("termsPage.tableOfContents")}
              </h3>
              <ul className="space-y-1 text-sm">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <a
                      href={`#${sec.id}`}
                      className="flex items-center justify-between rounded-lg px-2.5 py-1.5 font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors group"
                    >
                      <span className="min-w-0 break-words">{sec.title}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Lock className="h-4 w-4 text-emerald-500" />
                {t("termsPage.complianceTitle")}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("termsPage.complianceDesc")}
              </p>
            </div>
          </nav>

          {/* Main Legal Content */}
          <section className="space-y-12">
            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("termsPage.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-card/50 border-border/60"
              />
            </div>

            {filteredSections.length === 0 ? (
              <div className="text-center py-16 space-y-3 rounded-2xl border border-border/60 bg-card/30">
                <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <p className="text-muted-foreground text-sm font-medium">
                  {t("termsPage.noResults")}
                </p>
              </div>
            ) : (
              filteredSections.map((sec) => (
                <article
                  key={sec.id}
                  id={sec.id}
                  className="rounded-3xl border border-border/60 bg-card/60 p-6 md:p-8 shadow-sm backdrop-blur-md scroll-mt-24 space-y-8"
                >
                  <div className="border-b border-border/50 pb-4">
                    <span className="eyebrow">{sec.badge}</span>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                      {sec.title}
                    </h2>
                  </div>

                  <div className="space-y-8">
                    {sec.items.map((item, idx) => (
                      <div key={idx} className="space-y-3">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{item.heading}</span>
                        </h3>
                        <div className="space-y-2.5 pl-6 text-sm text-muted-foreground leading-relaxed">
                          {item.content.map((paragraph, pIdx) => (
                            <p key={pIdx}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))
            )}

            {/* Support Callout Box */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  {t("termsPage.supportTitle")}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("termsPage.supportDesc")}
                </p>
              </div>
              <Button asChild variant="outline" className="shrink-0">
                <Link href={localize("/contact")}>
                  {t("auth.footer.supportLink")}
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* Server-rendered by page.tsx: see components/site-footer.tsx. */}
      {footer}
    </div>
  );
}

export default TermsClient;
