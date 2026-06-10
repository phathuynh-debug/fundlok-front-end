import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { LocaleProvider } from "@/lib/i18n"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: 'FundLok - Dashboard',
  description: 'Connecting SMEs with Investors for smarter funding solutions',
}

function getLocaleFromCookie(cookieValue?: string | null) {
  return cookieValue === "vi" ? "vi" : "en"
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const locale = getLocaleFromCookie(cookieStore.get("NEXT_LOCALE")?.value)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <QueryProvider>
          <LocaleProvider initialLocale={locale}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <main>
                {children}
              </main>
            </ThemeProvider>
          </LocaleProvider>
        </QueryProvider>
        {/* Global notification system */}
        <Toaster />
      </body>
    </html>
  )
}