"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  LogOut,
  Loader2,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLogout } from "@/hooks/use-authentication"
import Logo from "@/components/logo"

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  return (
    <div className="hidden border-r bg-card md:flex md:w-64 md:flex-col h-screen">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
          <Link
            href="/admin"
            className="flex min-w-0 items-center font-bold tracking-tight text-primary"
          >
            <Logo
              alt="Fundlok"
              containerClassName="relative w-28 h-8 overflow-hidden shrink-0"
            />
          </Link>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 shrink-0",
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-accent-foreground"
                  )}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t p-3">
          <button
            type="button"
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="group flex w-full items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground disabled:opacity-60 disabled:pointer-events-none"
          >
            {isLoggingOut ? (
              <Loader2 className="mr-3 h-5 w-5 shrink-0 animate-spin" />
            ) : (
              <LogOut className="mr-3 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-accent-foreground" />
            )}
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
