"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-authentication"
import { useAdminOverview } from "@/hooks/use-admin"
import type {
  AdminMode,
  AdminProjectRow,
  AdminUserRow,
} from "@/services/admin.service"
import {
  Loader2,
  Users,
  Briefcase,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn, getInitials } from "@/lib/utils"

const PAGE_SIZE = 14

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function statusVariant(status: string) {
  const s = status?.toUpperCase()
  if (s === "ACTIVE") return "default" as const
  if (s === "SUSPENDED" || s === "INACTIVE") return "destructive" as const
  return "secondary" as const
}

export default function AdminPage() {
  const { user, isLoading } = useRequireAuth()
  const router = useRouter()
  const isAdmin = !isLoading && user?.role === "ADMIN"

  const [mode, setMode] = useState<AdminMode>("users")
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  // Debounce the search box; reset to the first page whenever it changes.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(id)
  }, [searchInput])

  const { data, isLoading: isOverviewLoading, isFetching } = useAdminOverview(
    { mode, page, page_size: PAGE_SIZE, search: search || undefined },
    isAdmin
  )

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

  const stats = data?.stats
  const table = data?.table
  const rows = table?.items ?? []
  const total = table?.total ?? rows.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function switchMode(next: AdminMode) {
    if (next === mode) return
    setMode(next)
    setPage(1)
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

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Users</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {isOverviewLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              (stats?.total_users ?? "—")
            )}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span className="text-sm font-medium">Projects</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {isOverviewLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              (stats?.total_projects ?? "—")
            )}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">Role</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{user.role}</p>
        </div>
      </div>

      {/* Table: users / projects */}
      <div className="rounded-lg border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Mode switch */}
          <div className="inline-flex rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={mode === "users" ? "default" : "ghost"}
              className="gap-2"
              onClick={() => switchMode("users")}
            >
              <Users className="h-4 w-4" />
              Users
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "projects" ? "default" : "ghost"}
              className="gap-2"
              onClick={() => switchMode("projects")}
            >
              <Briefcase className="h-4 w-4" />
              Projects
            </Button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                mode === "users" ? "Search users…" : "Search projects…"
              }
              className="pl-9"
            />
          </div>
        </div>

        <div className="relative overflow-x-auto">
          {/* Subtle overlay while refetching a new page/filter */}
          {isFetching && !isOverviewLoading && (
            <div className="absolute right-3 top-3 z-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          <Table>
            <TableHeader>
              {mode === "users" ? (
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              ) : (
                <TableRow>
                  <TableHead>Legal name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              )}
            </TableHeader>

            <TableBody>
              {isOverviewLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={mode === "users" ? 5 : 4}
                    className="h-32 text-center"
                  >
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={mode === "users" ? 5 : 4}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    {mode === "users" ? "No users found." : "No projects found."}
                  </TableCell>
                </TableRow>
              ) : mode === "users" ? (
                (rows as AdminUserRow[]).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage
                            src={row.avatar_url ?? undefined}
                            alt={row.full_name ?? ""}
                          />
                          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            {getInitials(row.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                          {row.full_name || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                (rows as AdminProjectRow[]).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-foreground">
                      {row.legal_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.industry || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {total > 0 ? (
              <>
                Page <span className="font-medium text-foreground">{page}</span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {totalPages}
                </span>{" "}
                · {total} {mode === "users" ? "users" : "projects"}
              </>
            ) : (
              "—"
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={cn("gap-1")}
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
