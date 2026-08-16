"use client";

import { useState } from "react";
import { useLogout, useRequireAuth } from "@/hooks/use-authentication";
import {
  LogOut,
  Home,
  Loader2,
  Menu,
  X,
  LayoutDashboard,
  Briefcase,
  History,
  PieChart,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslations } from "@/lib/i18n";
import { cn, getInitials } from "@/lib/utils";

const navItems = [
  { labelKey: "dashboard.sidebar.overview", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "dashboard.sidebar.investmentProjects", href: "/dashboard/projects", icon: Briefcase },
  { labelKey: "dashboard.sidebar.transactions", href: "/dashboard/transactions", icon: History },
  { labelKey: "dashboard.sidebar.analytics", href: "/dashboard/analytics", icon: PieChart },
  { labelKey: "dashboard.sidebar.security", href: "/dashboard/security", icon: ShieldCheck },
  { labelKey: "dashboard.sidebar.settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardHeader() {
  const { user, isLoading } = useRequireAuth();
  const { mutate: logout } = useLogout();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSME = user?.role === "SME";

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
          <span className="inline-flex text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/50 whitespace-nowrap">
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
          </div>

          <div className="h-5 w-px bg-border/60" />

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-sm"
            onClick={() => router.push("/dashboard")}
          >
            <Home className="h-4 w-4" />
            {t("dashboard.header.home")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="gap-1.5 text-sm"
          >
            <LogOut className="h-4 w-4" />
            {t("dashboard.header.logout")}
          </Button>
        </div>

        {/* Right: Mobile actions */}
        <div className="flex md:hidden items-center gap-1.5">
          <LocaleSwitcher />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown menu (only visible on mobile) */}
      <div
        className={cn(
          "md:hidden overflow-hidden border-t border-border/50 bg-background/98 backdrop-blur-lg transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-t-0"
        )}
      >
        <div className="px-4 py-3 space-y-1">
          {/* User info */}
          <div className="flex items-center gap-2.5 py-2 px-1">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name ?? ""} />
              <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                {getInitials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.full_name || t("common.guest")}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {portalLabel}
              </p>
            </div>
          </div>

          <div className="border-t border-border/40 my-1" />

          {/* Sidebar nav items */}
          <nav className="space-y-0.5 py-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border/40 my-1" />

          {/* Logout */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              setMobileMenuOpen(false);
            }}
            className="w-full justify-start gap-2 text-sm h-10 mt-1"
          >
            <LogOut className="h-4 w-4" />
            {t("dashboard.header.logout")}
          </Button>
        </div>
      </div>
    </header>
  );
}
