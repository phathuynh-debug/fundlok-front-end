"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Briefcase, 
  History, 
  Settings, 
  ShieldCheck,
  CircleUser,
  PieChart
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Investment Projects", href: "/dashboard/projects", icon: Briefcase },
  { label: "Transactions", href: "/dashboard/transactions", icon: History },
  { label: "Analytics", href: "/dashboard/analytics", icon: PieChart },
  { label: "Security", href: "/dashboard/security", icon: ShieldCheck },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-card md:flex md:w-64 md:flex-col h-screen">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Logo */}
        <div className="flex items-center h-16 flex-shrink-0 px-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-2xl tracking-tight text-primary">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-black">FL</span>
            </div>
            FundLok
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
                )} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Profile Summary */}
        <div className="flex-shrink-0 flex border-t p-4">
          <div className="flex items-center gap-3 px-2 py-2 w-full">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <CircleUser className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-medium text-foreground truncate">FundLok User</p>
              <p className="text-xs text-muted-foreground truncate">Verified Member</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}