import Link from "next/link"
import SiteHeader from "@/components/site-header"

export default function FaqPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <SiteHeader />
      <div className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-6">Frequently Asked Questions</h1>

          <section className="space-y-6">
            <div>
              <h3 className="font-bold">How do I contact support?</h3>
              <p className="text-sm text-muted-foreground">Use the Contact form on the footer of the homepage or email hello@fundlok.com.</p>
            </div>

            <div>
              <h3 className="font-bold">What is FundLok?</h3>
              <p className="text-sm text-muted-foreground">FundLok is a marketplace for on-chain credit facilities designed to improve capital access for SMEs and provide investment opportunities.</p>
            </div>

            <div>
              <h3 className="font-bold">How do I become a partner?</h3>
              <p className="text-sm text-muted-foreground">Reach out via the Contact form or email us directly and our partnerships team will follow up.</p>
            </div>
          </section>

          <div className="mt-8">
            <Link href="/" className="text-emerald-600 hover:underline">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
