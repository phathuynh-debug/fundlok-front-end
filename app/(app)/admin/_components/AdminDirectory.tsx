"use client";

import { useEffect, useState } from "react";
import { useAdminOverview } from "@/hooks/use-admin";
import type {
  AdminMode,
  AdminProjectRow,
  AdminUserRow,
} from "@/services/admin.service";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, type Column } from "./DataTable";
import { ProjectPreviewSheet } from "./ProjectPreviewSheet";
import { UserPreviewSheet } from "./UserPreviewSheet";
import { useTranslations } from "@/lib/i18n";
import { getInitials } from "@/lib/utils";
import { enumLabel, roleLabel } from "@/lib/enum-labels";
import { formatDate as formatLocaleDate } from "@/lib/format-date";
import { industryLabel } from "@/lib/industry-label";

const PAGE_SIZE = 14;

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

// The app's locale, not the browser's: toLocaleDateString(undefined) printed
// an English month on the Vietnamese site for anyone with an English browser.
function formatDate(value: string | null | undefined, locale: string) {
  return formatLocaleDate(value, locale) || "—";
}

function statusVariant(status: string) {
  const s = status?.toUpperCase();
  if (s === "ACTIVE") return "default" as const;
  if (s === "SUSPENDED" || s === "INACTIVE") return "destructive" as const;
  return "secondary" as const;
}

// Column configs — each table just declares how to render its cells.
// Built with `t` so the headers localize with the active language.
const buildUserColumns = (
  t: TranslateFn,
  locale: string,
): Column<AdminUserRow>[] => [
  {
    key: "name",
    header: t("admin.table.name"),
    render: (u) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage
            src={u.avatar_url ?? undefined}
            alt={u.full_name ?? ""}
          />
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {getInitials(u.full_name)}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-foreground">
          {u.full_name || "—"}
        </span>
      </div>
    ),
  },
  {
    key: "email",
    header: t("admin.table.email"),
    cellClassName: "text-muted-foreground",
    render: (u) => u.email,
  },
  {
    key: "role",
    header: t("admin.table.role"),
    render: (u) => <Badge variant="outline">{roleLabel(t, u.role)}</Badge>,
  },
  {
    key: "status",
    header: t("admin.table.status"),
    render: (u) => (
      <Badge variant={statusVariant(u.status)}>
        {enumLabel(t, "userStatus", u.status)}
      </Badge>
    ),
  },
  {
    key: "joined",
    header: t("admin.table.joined"),
    cellClassName: "text-muted-foreground",
    render: (u) => formatDate(u.created_at, locale),
  },
];

const buildProjectColumns = (
  t: TranslateFn,
  locale: string,
): Column<AdminProjectRow>[] => [
  {
    key: "legal_name",
    header: t("admin.table.legalName"),
    cellClassName: "font-medium text-foreground",
    render: (p) => p.legal_name,
  },
  {
    key: "industry",
    header: t("admin.table.industry"),
    cellClassName: "text-muted-foreground",
    render: (p) => industryLabel(p.industry, t) || "—",
  },
  {
    key: "status",
    header: t("admin.table.status"),
    render: (p) => (
      <Badge variant={statusVariant(p.status)}>
        {enumLabel(t, "projectStatus", p.status)}
      </Badge>
    ),
  },
  {
    key: "created",
    header: t("admin.table.created"),
    cellClassName: "text-muted-foreground",
    render: (p) => formatDate(p.created_at, locale),
  },
];

/**
 * The filtered, paginated admin table for one `mode` — plus the preview panel
 * a row opens.
 *
 * Users and projects live on their own sidebar routes (`/admin/users`,
 * `/admin/projects`) rather than behind an in-page toggle, so this component
 * never switches modes: it is mounted per route and its filter state resets
 * naturally when the operator navigates away. Callers must only render it once
 * the admin guard has passed — the query is enabled unconditionally here.
 */
export function AdminDirectory({ mode }: { mode: AdminMode }) {
  const { t, locale } = useTranslations();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  // "all" = no filter (Radix Select can't use an empty-string value).
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  // Which project the preview panel is showing; null = closed.
  const [previewProjectId, setPreviewProjectId] = useState<string | null>(null);
  // The row the user panel is showing; null = closed. The row itself is enough
  // for this panel — there is no extra detail to fetch.
  const [previewUser, setPreviewUser] = useState<AdminUserRow | null>(null);
  const [industryInput, setIndustryInput] = useState("");
  const [industry, setIndustry] = useState("");

  // Debounce the free-text inputs; reset to the first page whenever they change.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    const id = setTimeout(() => {
      setIndustry(industryInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [industryInput]);

  const {
    data,
    isLoading: isOverviewLoading,
    isFetching,
  } = useAdminOverview({
    mode,
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    // role applies to users mode only; industry to projects mode only.
    role: mode === "users" && role !== "all" ? role : undefined,
    industry: mode === "projects" && industry ? industry : undefined,
  });

  const stats = data?.stats;
  const table = data?.table;
  const rows = table?.items ?? [];
  const total = table?.total ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Filter options come from the stats maps (global counts, so they stay
  // stable while filtering) — only keys that exist in the DB are present.
  const statusOptions = Object.keys(
    (mode === "users" ? stats?.users_by_status : stats?.projects_by_status) ??
      {},
  );
  const roleOptions = Object.keys(stats?.users_by_role ?? {});

  return (
    <>
      <div className="rounded-lg border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Filters + search */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Status — both modes */}
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-full sm:w-40">
                <SelectValue placeholder={t("admin.table.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("admin.table.allStatuses")}
                </SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {enumLabel(
                      t,
                      mode === "users" ? "userStatus" : "projectStatus",
                      s,
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Role — users mode only */}
            {mode === "users" && (
              <Select
                value={role}
                onValueChange={(v) => {
                  setRole(v);
                  setPage(1);
                }}
              >
                <SelectTrigger size="sm" className="w-full sm:w-40">
                  <SelectValue placeholder={t("admin.table.role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.table.allRoles")}
                  </SelectItem>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabel(t, r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Industry — projects mode only */}
            {mode === "projects" && (
              <Input
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                placeholder={t("admin.table.industryPlaceholder")}
                className="w-full sm:w-40"
              />
            )}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                mode === "users"
                  ? t("admin.table.searchUsers")
                  : t("admin.table.searchProjects")
              }
              className="pl-9"
            />
          </div>
        </div>

        {mode === "users" ? (
          <DataTable<AdminUserRow>
            columns={buildUserColumns(t, locale)}
            rows={rows as AdminUserRow[]}
            getRowKey={(u) => u.id}
            isLoading={isOverviewLoading}
            isFetching={isFetching}
            emptyMessage={t("admin.table.noUsers")}
            onRowClick={(u) => setPreviewUser(u)}
            getRowLabel={(u) =>
              t("admin.userPreview.openRow").replace(
                "{name}",
                u.full_name || u.email,
              )
            }
          />
        ) : (
          <DataTable<AdminProjectRow>
            columns={buildProjectColumns(t, locale)}
            rows={rows as AdminProjectRow[]}
            getRowKey={(p) => p.id}
            isLoading={isOverviewLoading}
            isFetching={isFetching}
            emptyMessage={t("admin.table.noProjects")}
            onRowClick={(p) => setPreviewProjectId(p.id)}
            getRowLabel={(p) =>
              t("admin.preview.openRow").replace("{name}", p.legal_name)
            }
          />
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {total > 0 ? (
              <>
                {t("admin.pagination.page")}{" "}
                <span className="font-medium text-foreground">{page}</span>{" "}
                {t("admin.pagination.of")}{" "}
                <span className="font-medium text-foreground">
                  {totalPages}
                </span>{" "}
                · {total}{" "}
                {mode === "users"
                  ? t("admin.pagination.users")
                  : t("admin.pagination.projects")}
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
              className="gap-1"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("admin.pagination.prev")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t("admin.pagination.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Opened by clicking a project row. Renders nothing until then — the
          detail query is gated on projectId, so the list view stays one
          request. */}
      {mode === "projects" && (
        <ProjectPreviewSheet
          projectId={previewProjectId}
          onOpenChange={(open) => {
            if (!open) setPreviewProjectId(null);
          }}
        />
      )}

      {mode === "users" && (
        <UserPreviewSheet
          user={previewUser}
          onOpenChange={(open) => {
            if (!open) setPreviewUser(null);
          }}
        />
      )}
    </>
  );
}

/** Shared loading state for the admin pages while the session resolves. */
export function AdminPageLoader() {
  const { t } = useTranslations();
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          {t("admin.loading")}
        </span>
      </div>
    </div>
  );
}
