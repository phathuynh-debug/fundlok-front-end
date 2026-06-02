"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Logo from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, ChevronDown } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type SiteHeaderProps = {
  onProcess?: (e: React.MouseEvent) => void;
  onAchievements?: (e: React.MouseEvent) => void;
  onTeam?: (e: React.MouseEvent) => void;
};

export default function SiteHeader({
  onProcess,
  onAchievements,
  onTeam,
}: SiteHeaderProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [contactOpen, setContactOpen] = useState(false);
  const [mobileContactOpen, setMobileContactOpen] = useState(false);

  const handleProcessClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      if (onProcess) {
        onProcess(e);
      } else {
        const element = document.getElementById("process");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      router.push("/#process");
    }
  };

  const handleAchievementsClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      if (onAchievements) {
        onAchievements(e);
      } else {
        const element = document.getElementById("achievements");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      router.push("/#achievements");
    }
  };

  const handleTeamClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      if (onTeam) {
        onTeam(e);
      } else {
        const element = document.getElementById("team");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else {
      router.push("/#team");
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-background/45 backdrop-blur-md border-b border-border/10 flex items-center justify-between px-6 py-4 md:px-12">
      <Link href="/" className="flex items-center gap-2 group relative z-40">
        <Logo />
      </Link>

      <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[11px] font-mono tracking-widest font-semibold">
        <Link
          href="#"
          className="transition-colors duration-200 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
        >
          {t("header.product")}
        </Link>

        <Link
          href="/why-us"
          className={`transition-colors duration-200 font-mono tracking-widest text-[11px] font-semibold ${
            pathname === "/why-us"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
          }`}
        >
          {t("header.whyUs")}
        </Link>

        <button
          onClick={handleProcessClick}
          className="transition-colors duration-200 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer font-mono tracking-widest text-[11px] font-semibold bg-transparent border-none p-0 outline-none"
        >
          {t("header.howItWorks")}
        </button>

        <button
          onClick={handleAchievementsClick}
          className="transition-colors duration-200 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer font-mono tracking-widest text-[11px] font-semibold bg-transparent border-none p-0 outline-none"
        >
          {t("header.achievements")}
        </button>

        <button
          onClick={handleTeamClick}
          className="transition-colors duration-200 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer font-mono tracking-widest text-[11px] font-semibold bg-transparent border-none p-0 outline-none"
        >
          {t("header.team")}
        </button>

        <div
          className="relative"
          onMouseEnter={() => setContactOpen(true)}
          onMouseLeave={() => setContactOpen(false)}
        >
          <button
            onFocus={() => setContactOpen(true)}
            onBlur={() => setContactOpen(false)}
            className="transition-colors duration-200 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer font-mono tracking-widest text-[11px] font-semibold bg-transparent border-none p-0 outline-none"
            aria-haspopup="true"
            aria-expanded={contactOpen}
          >
            {t("header.contact")}
          </button>

          {contactOpen && (
            <div className="absolute right-0 top-full pt-2 w-44 z-40">
              <div className="bg-white dark:bg-slate-900 border border-border/30 rounded-md shadow-lg overflow-hidden">
                <Link
                  href="/contact"
                  className="block px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-slate-800"
                >
                  {t("header.contactUs")}
                </Link>
                <Link
                  href="/faq"
                  className="block px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-slate-800"
                >
                  {t("header.faq")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Desktop Header Navigation Actions */}
      <div className="hidden lg:flex items-center gap-4 relative z-30">
        <LocaleSwitcher />
        <ThemeToggle />
        <Link
          href="/login"
          className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 px-6 py-2.5 text-xs font-mono tracking-widest font-bold uppercase transition-all duration-300 shadow-md hover:shadow-emerald-500/10 active:scale-95"
        >
          {t("header.enterApp")}
        </Link>
      </div>

      {/* Mobile Navigation Drawer (Burger Menu) */}
      <div className="flex lg:hidden items-center gap-2 relative z-30">
        <Link
          href="/login"
          className="w-full text-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 px-6 py-3.5 text-xs font-mono tracking-widest font-bold uppercase transition-all duration-300 shadow-md hover:shadow-emerald-500/10 active:scale-95"
        >
          {t("header.enterApp")}
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer outline-hidden"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-80 sm:w-96 flex flex-col p-6 z-50 bg-background/95 backdrop-blur-md"
          >
            <SheetHeader className="p-0 border-b border-border/10 pb-4 mb-4">
              <SheetTitle className="text-left font-mono tracking-widest text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                {t("header.navigationMenu")}
              </SheetTitle>
            </SheetHeader>

            {/* Mobile Navigation List */}
            <div className="flex flex-col gap-4 py-2">
              <SheetClose asChild>
                <Link
                  href="#"
                  className="text-left py-2 font-mono tracking-widest text-xs font-bold text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition-colors"
                >
                  {t("header.product")}
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link
                  href="/why-us"
                  className={`text-left py-2 font-mono tracking-widest text-xs font-bold transition-colors ${
                    pathname === "/why-us"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                  }`}
                >
                  {t("header.whyUs")}
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <button
                  onClick={handleProcessClick}
                  className="text-left py-2 font-mono tracking-widest text-xs font-bold text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer bg-transparent border-none p-0 outline-none transition-colors"
                >
                  {t("header.howItWorks")}
                </button>
              </SheetClose>

              <SheetClose asChild>
                <button
                  onClick={handleAchievementsClick}
                  className="text-left py-2 font-mono tracking-widest text-xs font-bold text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer bg-transparent border-none p-0 outline-none transition-colors"
                >
                  {t("header.achievements")}
                </button>
              </SheetClose>

              <SheetClose asChild>
                <button
                  onClick={handleTeamClick}
                  className="text-left py-2 font-mono tracking-widest text-xs font-bold text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer bg-transparent border-none p-0 outline-none transition-colors"
                >
                  {t("header.team")}
                </button>
              </SheetClose>

              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => setMobileContactOpen(!mobileContactOpen)}
                  className="text-left py-2 font-mono tracking-widest text-xs font-bold text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white cursor-pointer bg-transparent border-none p-0 outline-none transition-colors flex justify-between items-center"
                >
                  <span>{t("header.contact")}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${mobileContactOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileContactOpen && (
                  <div className="flex flex-col gap-3 pl-3 py-2 border-l border-zinc-200/50 dark:border-zinc-800/50">
                    <SheetClose asChild>
                      <Link
                        href="/contact"
                        className="text-left text-xs font-bold font-mono tracking-wider text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors"
                      >
                        {t("header.contactUs")}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/faq"
                        className="text-left text-xs font-bold font-mono tracking-wider text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors"
                      >
                        {t("header.faq")}
                      </Link>
                    </SheetClose>
                  </div>
                )}
              </div>
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
                <Link
                  href="/login"
                  className="w-full text-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-400 dark:hover:bg-emerald-300 dark:text-slate-950 px-6 py-3.5 text-xs font-mono tracking-widest font-bold uppercase transition-all duration-300 shadow-md hover:shadow-emerald-500/10 active:scale-95"
                >
                  {t("header.enterApp")}
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
