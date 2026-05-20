"use client"

import { useLogout, useRequireAuth } from "@/hooks/use-authentication"
import { LogOut, Home, Briefcase, TrendingUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function DashboardHeader() {
  const { user, isLoading } = useRequireAuth()
  const { mutate: logout } = useLogout()
  const router = useRouter()

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading header...</span>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight">
            {user?.role === "INVESTOR" ? (
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            ) : (
              <Briefcase className="h-6 w-6 text-blue-500" />
            )}
            <span>FundLok</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground ml-2">
            ({user?.role === "SME" ? "SME Portal" : "Investor Portal"})
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 mr-4 text-sm font-medium">
            <span className="text-muted-foreground">
              Welcome back, <span className="text-foreground font-semibold">{user?.full_name || "Guest"}</span>
            </span>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden sm:flex gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <Home className="h-4 w-4" />
            Home
          </Button>

          <Button variant="outline" size="sm" onClick={() => logout()} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
