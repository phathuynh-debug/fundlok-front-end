import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { ContactForm } from "@/components/contact-form";
import { BackgroundBlobs } from "@/components/background-blobs";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact FundLok | Partnerships, Support, and Inquiries",
  description:
    "Reach out to FundLok for partnerships, support, and general inquiries.",
  keywords: [
    "FundLok contact",
    "FundLok support",
    "FundLok partnerships",
    "SME financing contact",
    "private credit platform",
    "contact FundLok",
    "funding inquiries",
    "business financing support",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact FundLok | Partnerships, Support, and Inquiries",
    description:
      "Reach out to FundLok for partnerships, support, and general inquiries.",
    url: "/contact",
    siteName: "FundLok",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact FundLok | Partnerships, Support, and Inquiries",
    description:
      "Reach out to FundLok for partnerships, support, and general inquiries.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact FundLok",
  description:
    "Reach out to FundLok for partnerships, support, and general inquiries.",
  url: `${SITE_URL}/contact`,
  mainEntity: {
    "@type": "Organization",
    name: "FundLok",
    email: "support@fundlok.com",
    url: SITE_URL,
  },
};

export default function ContactPage() {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden">
      <script type="application/ld+json" id="contact-jsonld">
        {JSON.stringify(contactJsonLd)}
      </script>
      <SiteHeader />

      <BackgroundBlobs variant="compact" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-mono font-bold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">
                Contact
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                Talk to the FundLok team
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Use this page for partnership requests, product questions, or
                general support. We reply by email and can route your request to
                the right team faster than the old footer form.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/60 bg-white/40 p-5 shadow-sm backdrop-blur-md dark:bg-slate-900/30">
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">
                  Email
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  support@fundlok.com
                </p>
              </div>
              <div className="rounded-3xl border border-border/60 bg-white/40 p-5 shadow-sm backdrop-blur-md dark:bg-slate-900/30">
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">
                  Location
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Trương Định / 123 Võ Thị Sáu, Xuân Hòa, Hồ Chí Minh
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
