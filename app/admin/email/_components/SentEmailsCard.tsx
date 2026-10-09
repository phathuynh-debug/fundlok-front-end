"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSentEmails } from "@/hooks/use-admin-email";
import { useCurrentUser } from "@/hooks/use-authentication";
import { formatDateTime } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import type { InternalEmail } from "@/services/admin-email.service";
import { emailErrorCodeText } from "./email-errors";

// The send log, test emails and failures included, newest first. An admin
// sees their own sends; a system admin sees every admin's (the server scopes
// the list), so for them each subject also says whose account it went from.

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "ellipsis")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (currentPage > 3) {
    pages.push("ellipsis");
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) {
    pages.push("ellipsis");
  }
  pages.push(totalPages);
  return pages;
}

export function SentEmailsCard() {
  const { t, locale } = useTranslations();
  // isPending, not isLoading: it also covers the moment before the query
  // is enabled (waiting for the admin's id), which would otherwise read as
  // an error.
  const { data, isPending, isError } = useSentEmails();
  const { data: user } = useCurrentUser();
  const seesEveryone = user?.role === "SYSTEM_ADMIN";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const total = data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = data
    ? data.slice(startIndex, startIndex + pageSize)
    : [];

  return (
    <section className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">
        {seesEveryone
          ? t("admin.email.sent.titleAll")
          : t("admin.email.sent.title")}
      </h2>

      {isPending ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isError || !data ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {t("admin.email.sent.loadFailed")}
        </p>
      ) : data.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("admin.email.sent.empty")}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.email.sent.when")}</TableHead>
                  <TableHead>{t("admin.email.sent.subject")}</TableHead>
                  <TableHead>{t("admin.email.sent.to")}</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    {t("admin.email.sent.template")}
                  </TableHead>
                  <TableHead>{t("admin.email.sent.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(email.created_at, locale)}
                    </TableCell>
                    <TableCell className="max-w-[14rem]">
                      <span className="block truncate font-medium text-foreground">
                        {email.subject}
                      </span>
                      {seesEveryone && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {t("admin.email.sent.fromLine").replace(
                            "{address}",
                            email.from_address,
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[14rem]">
                      <span className="block truncate">
                        {email.recipients[0]}
                      </span>
                      {email.recipients.length > 1 && (
                        <span className="text-xs text-muted-foreground">
                          {t("admin.email.sent.andMore").replace(
                            "{count}",
                            String(email.recipients.length - 1),
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap xl:table-cell">
                      {email.template === "test"
                        ? t("admin.email.sent.test")
                        : t(`admin.email.compose.templates.${email.template}`)}
                    </TableCell>
                    <TableCell>
                      <StatusCell email={email} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination bar */}
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <p>
                {t("admin.pagination.page")}{" "}
                <span className="font-medium text-foreground">
                  {currentPage}
                </span>{" "}
                {t("admin.pagination.of")}{" "}
                <span className="font-medium text-foreground">
                  {totalPages}
                </span>{" "}
                · {total} {t("admin.pagination.emails")}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{t("admin.pagination.perPage")}:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setPage(1);
                  }}
                >
                  <SelectTrigger size="sm" className="h-8 w-[72px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1 px-2.5 text-xs sm:text-sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("admin.pagination.prev")}
                </span>
              </Button>

              {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                p === "ellipsis" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-xs text-muted-foreground"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant={currentPage === p ? "default" : "outline"}
                    className="h-8 w-8 p-0 text-xs sm:text-sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ),
              )}

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1 px-2.5 text-xs sm:text-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span className="hidden sm:inline">
                  {t("admin.pagination.next")}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusCell({ email }: { email: InternalEmail }) {
  const { t } = useTranslations();
  const label = t(`admin.email.sent.statuses.${email.status}`);
  // A FAILED row says why; a SENT row can carry a code too (some recipients
  // refused), and then names who did not get it.
  const detail = emailErrorCodeText(email.error_code, t);
  const missed =
    email.status === "SENT" && (email.undelivered ?? []).length > 0
      ? t("admin.email.sent.undelivered").replace(
          "{list}",
          (email.undelivered ?? []).join(", "),
        )
      : null;

  return (
    <div className="flex flex-col gap-1">
      {email.status === "SENT" ? (
        <Badge
          variant="outline"
          className="w-fit border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        >
          {label}
        </Badge>
      ) : email.status === "FAILED" ? (
        <Badge variant="destructive" className="w-fit">
          {label}
        </Badge>
      ) : (
        <Badge variant="secondary" className="w-fit">
          {label}
        </Badge>
      )}
      {/* Table cells don't wrap; the reason is a sentence, so let it. */}
      {detail && (
        <span className="block max-w-[14rem] whitespace-normal text-xs text-muted-foreground">
          {detail}
        </span>
      )}
      {missed && (
        <span className="block max-w-[14rem] whitespace-normal break-all text-xs text-muted-foreground">
          {missed}
        </span>
      )}
    </div>
  );
}
