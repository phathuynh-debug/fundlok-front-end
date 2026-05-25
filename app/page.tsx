import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl text-center p-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">FundLok</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Simple, secure investing for small and medium enterprises.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700 transition-colors"
          >
            Sign In
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center px-4 py-2 border border-border text-foreground rounded-md hover:bg-slate-50 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  )
}
