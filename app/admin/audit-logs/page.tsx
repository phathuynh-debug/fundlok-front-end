"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useRequireAuth } from "@/hooks/use-authentication"
import { useAuditLogs } from "@/hooks/use-admin"
import type { AuditLog, AuditUserRef } from "@/services/admin.service"
import { isAdminRole } from "@/services/authentication.service"
import { Loader2, ScrollText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, type Column } from "../_components/DataTable"
import { useTranslations } from "@/lib/i18n"

const LIMIT_OPTIONS = [50, 100, 200, 500]

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// UUIDs are long — show a short, copy-friendly prefix with the full value on hover.
function shortId(id?: string | null) {
  if (!id) return "—"
  return id.length > 12 ? `${id.slice(0, 8)}…` : id
}

// A resolved user (name + email); falls back to the short raw id when the
// backend couldn't resolve the reference.
function UserCell({
  user,
  fallbackId,
}: {
  user: AuditUserRef | null
  fallbackId: string | null
}) {
  if (!user) {
    return (
      <span
        className="font-mono text-xs text-muted-foreground"
        title={fallbackId ?? undefined}
      >
        {shortId(fallbackId)}
      </span>
    )
  }
  return (
    <div className="flex flex-col">
      <span className="font-medium text-foreground">
        {user.full_name || "—"}
      </span>
      <span className="text-xs text-muted-foreground">{user.email}</span>
    </div>
  )
}

type TranslateFn = (key: string, values?: Record<string, string | number>) => string

const buildColumns = (t: TranslateFn): Column<AuditLog>[] => [
  {
    key: "time",
    header: t("admin.auditLogs.time"),
    cellClassName: "text-muted-foreground whitespace-nowrap",
    render: (log) => formatDateTime(log.created_at),
  },
  {
    key: "action",
    header: t("admin.auditLogs.action"),
    render: (log) =>
      log.action ? <Badge variant="secondary">{log.action}</Badge> : "—",
  },
  {
    key: "entity",
    header: t("admin.auditLogs.entity"),
    render: (log) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{log.entity_type}</span>
        {/* For USER entities the backend resolves the subject; show it. */}
        {log.entity_user ? (
          <span className="text-xs text-muted-foreground">
            {log.entity_user.full_name || log.entity_user.email}
          </span>
        ) : (
          log.entity_id && (
            <span
              className="font-mono text-xs text-muted-foreground"
              title={log.entity_id}
            >
              {shortId(log.entity_id)}
            </span>
          )
        )}
      </div>
    ),
  },
  {
    key: "actor",
    header: t("admin.auditLogs.actor"),
    render: (log) => <UserCell user={log.actor} fallbackId={log.actor_id} />,
  },
  {
    key: "ip",
    header: t("admin.auditLogs.ip"),
    cellClassName: "font-mono text-xs text-muted-foreground whitespace-nowrap",
    render: (log) => log.ip_address || "—",
  },
]

export default function AdminAuditLogsPage() {
  const { user, isLoading } = useRequireAuth()
  const router = useRouter()
  const { t } = useTranslations()
  const isAdmin = !isLoading && isAdminRole(user?.role)

  const [entityInput, setEntityInput] = useState("")
  const [entityType, setEntityType] = useState("")
  const [limit, setLimit] = useState(100)

  // Debounce the entity-type filter.
  useEffect(() => {
    const id = setTimeout(() => setEntityType(entityInput.trim()), 350)
    return () => clearTimeout(id)
  }, [entityInput])

  const { data: logs = [], isLoading: isLogsLoading, isFetching } = useAuditLogs(
    { entity_type: entityType || undefined, limit },
    isAdmin
  )

  // Fallback guard: middleware blocks non-admins server-side.
  useEffect(() => {
    if (!isLoading && user && !isAdminRole(user.role)) {
      router.replace("/dashboard")
    }
  }, [isLoading, user, router])

  if (isLoading || !user || !isAdminRole(user.role)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            {t("admin.loading")}
          </span>
        </div>
      </div>
    )
  }

  const columns = buildColumns(t)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("admin.auditLogs.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.auditLogs.subtitle")}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {/* Filters */}
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Input
            value={entityInput}
            onChange={(e) => setEntityInput(e.target.value)}
            placeholder={t("admin.auditLogs.entityPlaceholder")}
            className="w-full sm:w-48"
          />
          <Select
            value={String(limit)}
            onValueChange={(v) => setLimit(Number(v))}
          >
            <SelectTrigger size="sm" className="w-full sm:w-32">
              <SelectValue placeholder={t("admin.auditLogs.limit")} />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {t("admin.auditLogs.limit")} {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable<AuditLog>
          columns={columns}
          rows={logs}
          getRowKey={(log) => log.id}
          isLoading={isLogsLoading}
          isFetching={isFetching}
          emptyMessage={t("admin.auditLogs.empty")}
        />
      </div>
    </div>
  )
}
