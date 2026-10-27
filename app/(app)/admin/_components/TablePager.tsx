"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

// The footer under a paginated admin table: "Page 1 of 3 · 42 <unit>" and
// Prev / Next. Same layout as the users and projects directory.
export function TablePager({
  page,
  pageSize,
  total,
  unit,
  isFetching,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** What is being counted, already translated ("checks", "projects"). */
  unit: string;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslations();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <p className="text-sm text-muted-foreground">
        {total > 0 ? (
          <>
            {t("admin.pagination.page")}{" "}
            <span className="font-medium text-foreground">{page}</span>{" "}
            {t("admin.pagination.of")}{" "}
            <span className="font-medium text-foreground">{totalPages}</span> ·{" "}
            {total} {unit}
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
          onClick={() => onPageChange(Math.max(1, page - 1))}
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
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          {t("admin.pagination.next")}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
