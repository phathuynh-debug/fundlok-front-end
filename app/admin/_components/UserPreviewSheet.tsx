"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSetUserStatus } from "@/hooks/use-admin";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useTranslations } from "@/lib/i18n";
import { formatDate } from "@/lib/format-date";
import { enumLabel, roleLabel } from "@/lib/enum-labels";
import { cn } from "@/lib/utils";
import type { AdminUserRow, AdminUserStatus } from "@/services/admin.service";
import { apiErrorMessage } from "@/lib/api-error-message";

// Account status, changed from the users table.
//
// SUSPENDED is a real deny server-side — the backend rejects the account on
// every request and refuses to mint a new session — so this panel is not
// cosmetic and the confirmation language says what will actually happen.
//
// Two guards live on the server and are mirrored here only as affordances: an
// operator cannot change their own status, and only a SYSTEM_ADMIN may act on
// an admin-level account. Hiding the controls saves a pointless round trip;
// the server is what enforces it.

const STATUSES: AdminUserStatus[] = ["ACTIVE", "PENDING_KYC", "SUSPENDED"];
const ADMIN_ROLES = ["ADMIN", "SYSTEM_ADMIN"];

interface UserPreviewSheetProps {
  user: AdminUserRow | null;
  onOpenChange: (open: boolean) => void;
}

export function UserPreviewSheet({
  user,
  onOpenChange,
}: UserPreviewSheetProps) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { data: me } = useCurrentUser();
  const { mutateAsync: setStatus, isPending } = useSetUserStatus();
  const [note, setNote] = useState("");

  const isSelf = !!user && !!me && user.id === me.id;
  const targetIsAdmin = !!user && ADMIN_ROLES.includes(user.role);
  const canActOnAdmin = me?.role === "SYSTEM_ADMIN";
  const blockedReason = isSelf
    ? t("admin.userPreview.blockedSelf")
    : targetIsAdmin && !canActOnAdmin
      ? t("admin.userPreview.blockedAdmin")
      : null;

  const handleStatus = async (status: AdminUserStatus) => {
    if (!user) return;
    try {
      await setStatus({ id: user.id, body: { status, note: note || null } });
      setNote("");
      toast({ title: t("admin.userPreview.statusChanged") });
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("admin.userPreview.statusFailed"),
        description: apiErrorMessage(err, locale, t("common.tryAgain")),
      });
    }
  };

  return (
    <Sheet open={user !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {user?.full_name || user?.email || t("admin.userPreview.title")}
          </SheetTitle>
          <SheetDescription>{t("admin.userPreview.subtitle")}</SheetDescription>
        </SheetHeader>

        {user && (
          <div className="space-y-6 px-4 pb-8">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">
                {t("admin.table.email")}
              </dt>
              <dd className="break-all text-foreground">{user.email}</dd>
              <dt className="text-muted-foreground">{t("admin.table.role")}</dt>
              <dd>
                <Badge variant="secondary">{roleLabel(t, user.role)}</Badge>
              </dd>
              <dt className="text-muted-foreground">
                {t("admin.table.status")}
              </dt>
              <dd>
                <Badge
                  variant={
                    user.status === "SUSPENDED" ? "destructive" : "secondary"
                  }
                >
                  {enumLabel(t, "userStatus", user.status)}
                </Badge>
              </dd>
              <dt className="text-muted-foreground">
                {t("admin.table.joined")}
              </dt>
              <dd className="text-foreground">
                {formatDate(user.created_at, locale)}
              </dd>
            </dl>

            <Separator />

            <section className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  {t("admin.userPreview.statusHeading")}
                </h3>
                {/* Says what suspending actually does, because it does it. */}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t("admin.userPreview.suspendWarning")}
                </p>
              </div>

              {blockedReason ? (
                <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <AlertTriangle
                    className="mt-px h-4 w-4 shrink-0 text-amber-600"
                    aria-hidden
                  />
                  <span>{blockedReason}</span>
                </p>
              ) : (
                <>
                  <Textarea
                    rows={2}
                    value={note}
                    disabled={isPending}
                    placeholder={t("admin.userPreview.notePlaceholder")}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        // Destructive styling only for the one that denies.
                        variant={
                          status === "SUSPENDED"
                            ? "destructive"
                            : status === user.status
                              ? "default"
                              : "outline"
                        }
                        className={cn("flex-1", "min-w-28")}
                        disabled={isPending || status === user.status}
                        onClick={() => handleStatus(status)}
                      >
                        {isPending && (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        )}
                        {t(`admin.userPreview.statuses.${status}`)}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
