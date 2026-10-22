"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, LogOut, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import Logo from "@/components/logo";
import { useTranslations } from "@/lib/i18n";
import { useCurrentUser, useLogout } from "@/hooks/use-authentication";
import { cn } from "@/lib/utils";
import { CONTROL_ICON_IDLE, CONTROL_IDLE } from "@/lib/ui-tokens";
import { adminNavItems } from "./AdminSidebar";

export function AdminHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslations();
  const { data: user } = useCurrentUser();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  // Close the mobile sheet when navigating to a new page
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const isSystemAdmin = user?.role === "SYSTEM_ADMIN";
  const visibleNavItems = adminNavItems.filter(
    (item) => !item.systemAdminOnly || isSystemAdmin,
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6 md:px-8">
      {/* Mobile nav trigger & brand (visible on screens < md) */}
      <div className="flex items-center gap-2.5 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={t("common.toggleMenu")}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex h-full w-72 flex-col p-0 bg-card text-card-foreground border-r sm:w-80"
          >
            <SheetHeader className="border-b p-4 text-left">
              <div className="flex items-center justify-between gap-2 pr-6">
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex min-w-0 items-center font-bold tracking-tight text-primary"
                >
                  <Logo
                    alt="FundLok"
                    containerClassName="relative w-28 h-8 overflow-hidden shrink-0"
                  />
                </Link>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t("admin.sidebar.badge")}
                </span>
              </div>
              <SheetTitle className="sr-only">
                {t("header.navigationMenu")}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {t("seo.adminDescription")}
              </SheetDescription>
            </SheetHeader>

            {/* Mobile Navigation Links */}
            <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
              {visibleNavItems.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                      active ? "bg-primary/10 text-primary" : CONTROL_IDLE,
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 shrink-0",
                        active ? "text-primary" : CONTROL_ICON_IDLE,
                      )}
                    />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Logout */}
            <div className="shrink-0 border-t p-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                disabled={isLoggingOut}
                className={cn(
                  "group flex w-full items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none",
                  CONTROL_IDLE,
                )}
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-3 h-5 w-5 shrink-0 animate-spin" />
                ) : (
                  <LogOut
                    className={cn("mr-3 h-5 w-5 shrink-0", CONTROL_ICON_IDLE)}
                  />
                )}
                {t("admin.sidebar.logout")}
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <Link
          href="/admin"
          className="flex min-w-0 items-center font-bold tracking-tight text-primary"
        >
          <Logo
            alt="FundLok"
            containerClassName="relative w-24 h-7 overflow-hidden shrink-0"
          />
        </Link>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
          <ShieldCheck className="h-3 w-3" />
          {t("admin.sidebar.badge")}
        </span>
      </div>

      {/* Desktop spacer to keep language & theme toggles aligned on the right */}
      <div className="hidden md:block" />

      {/* Top bar right: language & theme switchers */}
      <div className="flex items-center gap-2.5">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
