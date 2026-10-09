"use client";

import { useState } from "react";
import { useLogout, useRequireAuth } from "@/hooks/use-authentication";
import {
  LogOut,
  Loader2,
  Menu,
  LayoutDashboard,
  Briefcase,
  History,
  PieChart,
  ShieldCheck,
  Settings,
  Headphones,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { TourReplayButton } from "@/components/tour-replay-button";
import { WelcomeReplayButton } from "@/components/welcome-replay-button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useTranslations } from "@/lib/i18n";
import { cn, getInitials } from "@/lib/utils";
import { CONTROL_IDLE } from "@/lib/ui-tokens";

const navItems = [
  {
    labelKey: "dashboard.sidebar.overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    labelKey: "dashboard.sidebar.investmentProjects",
    href: "/dashboard/projects",
    icon: Briefcase,
  },
  {
    labelKey: "dashboard.sidebar.transactions",
    href: "/dashboard/transactions",
    icon: History,
  },
  {
    labelKey: "dashboard.sidebar.analytics",
    href: "/dashboard/analytics",
    icon: PieChart,
  },
  {
    labelKey: "dashboard.sidebar.security",
    href: "/dashboard/security",
    icon: ShieldCheck,
  },
  {
    labelKey: "dashboard.sidebar.settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardHeader() {
  const { user, isLoading } = useRequireAuth();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const pathname = usePathname();
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);

  // Close mobile menu on page navigation
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const isSME = user?.role === "SME";
  // The welcome cutscreen exists for the two customer roles only.
  const hasWelcome = isSME || user?.role === "INVESTOR";

  const filteredNavItems = navItems.filter((item) => {
    if (isSME && item.href === "/dashboard/projects") return false;
    return true;
  });

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {t("dashboard.header.loading")}
            </span>
          </div>
        </div>
      </header>
    );
  }

  const portalLabel =
    user?.role === "SME"
      ? t("dashboard.header.portal.sme")
      : t("dashboard.header.portal.investor");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-8">
        {/* Left: Role badge */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/50 whitespace-nowrap truncate max-w-[130px] sm:max-w-none">
            {portalLabel}
          </span>
        </div>

        {/* Right: Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground hidden lg:inline-block">
            {t("dashboard.header.welcomeBack", {
              name: user?.full_name || t("common.guest"),
            })}
          </span>

          <div className="flex items-center gap-1.5">
            <LocaleSwitcher />
            <ThemeToggle />
            {hasWelcome && <WelcomeReplayButton />}
            <TourReplayButton />
          </div>

          <div className="h-5 w-px bg-border/60" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="gap-1.5 text-sm"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {t("dashboard.header.logout")}
          </Button>
        </div>

        {/* Right: Mobile actions */}
        <div className="flex md:hidden items-center gap-1 shrink-0">
          <LocaleSwitcher />
          <ThemeToggle />
          {hasWelcome && <WelcomeReplayButton />}
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
              side="right"
              className="flex h-full w-72 sm:w-80 flex-col p-0 bg-card text-card-foreground border-l"
            >
              <SheetHeader className="border-b p-4 text-left">
                <div className="flex items-center gap-2.5 pr-6">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage
                      src={user?.avatar_url ?? undefined}
                      alt={user?.full_name ?? ""}
                    />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user?.full_name || t("common.guest")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {portalLabel}
                    </p>
                  </div>
                </div>
                <SheetTitle className="sr-only">
                  {t("header.navigationMenu")}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {t("seo.dashboardDescription")}
                </SheetDescription>
              </SheetHeader>

              {/* Mobile Navigation Links */}
              <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1">
                {filteredNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href === "/dashboard/settings" &&
                      pathname.startsWith("/dashboard/settings"));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : CONTROL_IDLE,
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      {t(item.labelKey)}
                    </Link>
                  );
                })}

                <div className="border-t border-border/40 my-3" />

                {/* Quick Help & Support for Mobile */}
                <div className="rounded-xl border border-border/80 bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Headphones className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {t("dashboard.sidebar.needHelp")}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <a
                      href="tel:0943711382"
                      className="flex items-center gap-2 rounded-md px-2 py-1 font-medium text-foreground hover:bg-card transition-colors"
                    >
                      <Phone className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="tabular-nums font-semibold">
                        094 371 13 82
                      </span>
                    </a>
                    <a
                      href="mailto:support@fundlok.com"
                      className="flex items-center gap-2 rounded-md px-2 py-1 font-medium text-foreground hover:bg-card transition-colors"
                    >
                      <Mail className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">support@fundlok.com</span>
                    </a>
                  </div>
                </div>
              </nav>

              {/* Mobile Logout */}
              <div className="shrink-0 border-t p-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                  disabled={isLoggingOut}
                  className="w-full justify-start gap-2 text-sm h-10"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {t("dashboard.header.logout")}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
