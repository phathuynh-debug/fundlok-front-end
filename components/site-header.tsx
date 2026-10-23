"use client";

import Link from "next/link";
import Logo from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { usePublicPathname } from "@/lib/use-public-pathname";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/", labelKey: "header.home" },
  { href: "/why-us", labelKey: "header.whyUs" },
  { href: "/rate", labelKey: "header.rate" },
  { href: "/faq", labelKey: "header.faq" },
  { href: "/contact", labelKey: "header.contactUs" },
] as const;

// Page-level navigation only. In-page section navigation on the landing page
// is handled by the SectionLocator rail instead.
export default function SiteHeader() {
  const { t, localize } = useTranslations();
  // Not the raw usePathname(): see usePublicPathname for why.
  const pathname = usePublicPathname();

  const linkClass = (href: string) =>
    pathname === href
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white";

  return (
    <header className="sticky top-0 z-30 w-full bg-background/45 backdrop-blur-md border-b border-border/10 flex items-center justify-between gap-4 px-4 sm:px-6 py-4 md:px-12 lg:px-8 xl:px-12">
      <Link
        href={localize("/")}
        className="flex items-center gap-2 group relative z-40"
      >
        <Logo />
      </Link>

      <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
        {NAV_LINKS.map(({ href, labelKey }) => (
          <Link
            key={href}
            href={localize(href)}
            className={`whitespace-nowrap transition-colors duration-200 text-sm font-medium ${linkClass(href)}`}
          >
            {t(labelKey)}
          </Link>
        ))}
      </nav>

      {/* Desktop Header Navigation Actions */}
      <div className="hidden lg:flex items-center gap-4 relative z-30">
        <LocaleSwitcher />
        <ThemeToggle />
        <a
          href={localize("/login")}
          className="whitespace-nowrap rounded-full bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 px-5 xl:px-6 py-2.5 text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-emerald-500/10 active:scale-95"
        >
          {t("header.enterApp")}
        </a>
      </div>

      {/* Mobile Navigation Drawer (Burger Menu) */}
      <div className="flex lg:hidden items-center gap-2 relative z-30">
        <a
          href={localize("/login")}
          // A compact pill on one line: at w-full/py-3.5 the Vietnamese
          // label wrapped onto two lines and took a third of the header.
          className="whitespace-nowrap text-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-emerald-500/10 active:scale-95"
        >
          {t("header.enterApp")}
        </a>
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="p-2.5 rounded-full hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer outline-hidden"
              aria-label={t("common.toggleMenu")}
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-80 sm:w-96 flex flex-col p-6 z-50 bg-background/95 backdrop-blur-md"
          >
            <SheetHeader className="p-0 border-b border-border/10 pb-4 mb-4">
              <SheetTitle className="text-left text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                {t("header.navigationMenu")}
              </SheetTitle>
            </SheetHeader>

            {/* Mobile Navigation List */}
            <div className="flex flex-col gap-4 py-2">
              {NAV_LINKS.map(({ href, labelKey }) => (
                <SheetClose asChild key={href}>
                  <Link
                    href={localize(href)}
                    className={`text-left py-2 text-sm font-semibold transition-colors ${linkClass(href)}`}
                  >
                    {t(labelKey)}
                  </Link>
                </SheetClose>
              ))}
            </div>

            {/* Mobile Drawer Settings & CTA Action */}
            <div className="mt-auto border-t border-border/10 pt-6 flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <LocaleSwitcher />
                  <ThemeToggle />
                </div>
              </div>

              <SheetClose asChild>
                <a
                  href={localize("/login")}
                  className="w-full text-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 px-6 py-3.5 text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-emerald-500/10 active:scale-95"
                >
                  {t("header.enterApp")}
                </a>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
