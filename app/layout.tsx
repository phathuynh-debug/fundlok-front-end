import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { LocaleProvider } from "@/lib/i18n";
import { GoogleOAuthProvider } from "@react-oauth/google";
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "FundLok | Flexible Capital Platform for SMEs",
    template: "%s | FundLok",
  },
  description:
    "FundLok connects investors with SMEs through a technology-led financing platform, using data and AI to support flexible funding aligned with real business needs.",
  keywords: [
    "FundLok",
    "SME funding",
    "private credit",
    "flexible capital",
    "on-chain credit",
    "investor portal",
    "flexible funding",
    "AI credit scoring",
    "DeFi lending",
    "Sustainability in Action",
    "Australian Government",
    "SIHUB FinTech",
    "IBCOL 2023",
  ],
  openGraph: {
    title: "FundLok | Flexible Capital Platform for SMEs",
    description:
      "FundLok connects investors with SMEs through a technology-led financing platform, using data and AI to support flexible funding aligned with real business needs.",
    type: "website",
    siteName: "FundLok",
  },
  twitter: {
    card: "summary_large_image",
    title: "FundLok | Flexible Capital Platform for SMEs",
    description:
      "FundLok connects investors with SMEs through a technology-led financing platform, using data and AI to support flexible funding aligned with real business needs.",
  },
  icons: {
    icon: "/logo/image.png",
    shortcut: "/logo/image.png",
    apple: "/logo/image.png",
  },
};

function getLocaleFromCookie(cookieValue?: string | null) {
  return cookieValue === "vi" ? "vi" : "en";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("NEXT_LOCALE")?.value);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
        >
          <QueryProvider>
            <LocaleProvider initialLocale={locale}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
              >
                <main>{children}</main>
              </ThemeProvider>
            </LocaleProvider>
          </QueryProvider>
        </GoogleOAuthProvider>
        {/* Global notification system */}
        <Toaster />
      </body>
    </html>
  );
}
