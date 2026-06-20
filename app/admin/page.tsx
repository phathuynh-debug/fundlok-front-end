"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-authentication"
import { Loader2, Users, Briefcase, ShieldCheck } from "lucide-react"

export default function AdminPage() {
  const { user, isLoading } = useRequireAuth()
  const router = useRouter()

  // Fallback guard: middleware blocks non-admins server-side, but if the
  // session changes between the request and render, bounce them out.
  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  if (isLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading admin…
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Admin overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user.full_name || user.email}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Users</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">—</p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span className="text-sm font-medium">Projects</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">—</p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">Role</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{user.role}</p>
        </div>
      </div>
    </div>
  )
}
