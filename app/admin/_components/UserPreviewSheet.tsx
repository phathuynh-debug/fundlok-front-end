"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Key,
  KeyRound,
  Landmark,
  Loader2,
  Monitor,
  Shield,
  ShieldCheck,
  TrendingUp,
  User,
  XCircle,
} from "lucide-react";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAdminUserDetail, useSetUserStatus } from "@/hooks/use-admin";
import { useCurrentUser } from "@/hooks/use-authentication";
import { useTranslations } from "@/lib/i18n";
import { formatDate } from "@/lib/format-date";
import { formatCurrency } from "@/lib/format-currency";
import { enumLabel, roleLabel } from "@/lib/enum-labels";
import { industryLabel } from "@/lib/industry-label";
import { getInitials } from "@/lib/utils";
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

function statusVariant(status?: string | null) {
  const s = status?.toUpperCase();
  if (s === "ACTIVE" || s === "APPROVED") return "default" as const;
  if (s === "SUSPENDED" || s === "INACTIVE" || s === "REJECTED")
    return "destructive" as const;
  return "secondary" as const;
}

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
  const { mutateAsync: setStatus, isPending: isUpdatingStatus } =
    useSetUserStatus();
  const { data: detail, isLoading } = useAdminUserDetail(user?.id ?? null);
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

  const displayName =
    detail?.full_name || user?.full_name || detail?.email || user?.email || "";
  const avatarInitials = getInitials(displayName);
  const currentStatus = detail?.status || user?.status || "ACTIVE";
  const currentRole = detail?.role || user?.role;

  return (
    <Sheet open={user !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-xl">
            {t("admin.userPreview.title")}
          </SheetTitle>
          <SheetDescription>{t("admin.userPreview.subtitle")}</SheetDescription>
        </SheetHeader>

        {user && (
          <div className="space-y-6 pb-12 pt-2">
            {/* 1. Header Profile & Identity Card */}
            <div className="rounded-xl border bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <Avatar className="h-14 w-14 shrink-0 rounded-full border ring-1 ring-border">
                    <AvatarImage
                      src={user.avatar_url ?? undefined}
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                      {avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-foreground leading-tight">
                      {displayName}
                    </h3>
                    <p className="text-xs text-muted-foreground break-all">
                      {detail?.email || user.email}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {currentRole && (
                        <Badge variant="outline" className="text-xs">
                          {roleLabel(t, currentRole)}
                        </Badge>
                      )}
                      <Badge
                        variant={statusVariant(currentStatus)}
                        className="text-xs"
                      >
                        {enumLabel(t, "userStatus", currentStatus)}
                      </Badge>
                      {detail?.kyc_status && (
                        <Badge
                          variant={
                            detail.kyc_status === "APPROVED"
                              ? "default"
                              : detail.kyc_status === "REJECTED"
                                ? "destructive"
                                : "secondary"
                          }
                          className={cn(
                            "text-xs gap-1",
                            detail.kyc_status === "APPROVED" &&
                              "bg-emerald-600 hover:bg-emerald-600",
                          )}
                        >
                          {detail.kyc_status === "APPROVED" && (
                            <ShieldCheck className="h-3 w-3" />
                          )}
                          {detail.kyc_status === "REJECTED" && (
                            <XCircle className="h-3 w-3" />
                          )}
                          {(detail.kyc_status === "PENDING" ||
                            detail.kyc_status === "MANUAL_REVIEW") && (
                            <Clock className="h-3 w-3" />
                          )}
                          KYC:{" "}
                          {enumLabel(
                            t,
                            "verificationStatus",
                            detail.kyc_status,
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground sm:text-right shrink-0">
                  <span className="block">{t("admin.table.joined")}</span>
                  <span className="font-medium text-foreground">
                    {formatDate(detail?.created_at || user.created_at, locale)}
                  </span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs">{t("admin.loading")}</span>
              </div>
            ) : detail ? (
              <>
                {/* 2. Authentication & Security Posture */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    {t("admin.userPreview.authAndSecurity")}
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Password / Google SSO */}
                    <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                      <span className="text-xs text-muted-foreground block">
                        {t("dashboard.settings.profile.loginMethod")}
                      </span>
                      <div className="flex items-center gap-2">
                        {detail.has_password ? (
                          <>
                            <KeyRound className="h-4 w-4 text-emerald-600" />
                            <span className="text-xs font-medium text-foreground">
                              {t("admin.userPreview.passwordSet")}
                            </span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-medium text-amber-600">
                              {t("admin.userPreview.googleSso")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Passkeys (WebAuthn) */}
                    <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                      <span className="text-xs text-muted-foreground block">
                        {t("admin.userPreview.passkeys")}
                      </span>
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">
                          {detail.passkeys_count > 0
                            ? t("admin.userPreview.passkeyEnabled").replace(
                                "{count}",
                                String(detail.passkeys_count),
                              )
                            : t("admin.userPreview.passkeyNone")}
                        </span>
                      </div>
                    </div>

                    {/* 2FA / TOTP */}
                    <div className="rounded-lg border bg-muted/20 p-3 space-y-1 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {t("admin.userPreview.twoFactor")}
                        </span>
                        <Badge
                          variant={
                            detail.totp_enabled ? "default" : "secondary"
                          }
                          className={cn(
                            "text-xs",
                            detail.totp_enabled &&
                              "bg-emerald-600 hover:bg-emerald-600",
                          )}
                        >
                          {detail.totp_enabled
                            ? detail.totp_confirmed_at
                              ? t(
                                  "admin.userPreview.twoFactorConfirmed",
                                ).replace(
                                  "{date}",
                                  formatDate(detail.totp_confirmed_at, locale),
                                )
                              : t("admin.userPreview.twoFactorEnabled")
                            : t("admin.userPreview.twoFactorDisabled")}
                        </Badge>
                      </div>
                      {detail.totp_enabled && (
                        <p className="text-xs text-muted-foreground pt-1">
                          {t("admin.userPreview.recoveryCodes")}:{" "}
                          <span className="font-medium text-foreground">
                            {t("admin.userPreview.recoveryCodesCount").replace(
                              "{count}",
                              String(detail.unused_recovery_codes_count),
                            )}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Active Sessions */}
                    <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                      <span className="text-xs text-muted-foreground block">
                        {t("admin.userPreview.activeSessions")}
                      </span>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">
                          {t("admin.userPreview.activeSessionsCount").replace(
                            "{count}",
                            String(detail.active_sessions_count),
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Last Activity */}
                    <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                      <span className="text-xs text-muted-foreground block">
                        {t("admin.userPreview.lastActive")}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {detail.last_sign_in_at
                          ? formatDate(detail.last_sign_in_at, locale)
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 3. Verification & Banking Insight */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Landmark className="h-4 w-4 text-primary" />
                    {t("admin.userPreview.verificationAndBanking")}
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* eKYC Status */}
                    <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                      <span className="text-xs text-muted-foreground block">
                        {t("admin.userPreview.kycStatus")}
                      </span>
                      {detail.kyc_status ? (
                        <Badge
                          variant={
                            detail.kyc_status === "APPROVED"
                              ? "default"
                              : detail.kyc_status === "REJECTED"
                                ? "destructive"
                                : "secondary"
                          }
                          className={cn(
                            "text-xs gap-1",
                            detail.kyc_status === "APPROVED" &&
                              "bg-emerald-600 hover:bg-emerald-600",
                          )}
                        >
                          {detail.kyc_status === "APPROVED" && (
                            <ShieldCheck className="h-3 w-3" />
                          )}
                          {detail.kyc_status === "REJECTED" && (
                            <XCircle className="h-3 w-3" />
                          )}
                          {(detail.kyc_status === "PENDING" ||
                            detail.kyc_status === "MANUAL_REVIEW") && (
                            <Clock className="h-3 w-3" />
                          )}
                          {enumLabel(
                            t,
                            "verificationStatus",
                            detail.kyc_status,
                          )}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("admin.userPreview.kycNone")}
                        </span>
                      )}
                    </div>

                    {/* Linked Bank Accounts */}
                    <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                      <span className="text-xs text-muted-foreground block">
                        {t("admin.userPreview.linkedAccounts")}
                      </span>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">
                          {t("admin.userPreview.linkedAccountsCount").replace(
                            "{count}",
                            String(detail.linked_accounts_count),
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 4. Profile & Preferences */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <User className="h-4 w-4 text-primary" />
                    {t("admin.userPreview.profileDetails")}
                  </h4>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <dt className="text-muted-foreground">
                        {t("admin.userPreview.phone")}
                      </dt>
                      <dd className="font-medium text-foreground">
                        {detail.phone || "—"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-muted-foreground">
                        {t("dashboard.settings.profile.emailAddress")}
                      </dt>
                      <dd className="font-medium text-foreground">
                        {detail.email_verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            {t("admin.userPreview.emailVerified")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {t("admin.userPreview.emailNotVerified")}
                          </span>
                        )}
                      </dd>
                    </div>

                    <div className="col-span-2">
                      <dt className="text-muted-foreground">
                        {t("admin.userPreview.onboardingTour")}
                      </dt>
                      <dd className="font-medium text-foreground">
                        {detail.onboarding_tour_completed_at
                          ? t("admin.userPreview.onboardingCompleted").replace(
                              "{date}",
                              formatDate(
                                detail.onboarding_tour_completed_at,
                                locale,
                              ),
                            )
                          : t("admin.userPreview.onboardingNotCompleted")}
                      </dd>
                    </div>

                    {detail.bio && (
                      <div className="col-span-2">
                        <dt className="text-muted-foreground">
                          {t("admin.userPreview.bio")}
                        </dt>
                        <dd className="rounded-md border bg-muted/20 p-2.5 text-foreground italic">
                          &ldquo;{detail.bio}&rdquo;
                        </dd>
                      </div>
                    )}

                    {/* Email signature preview */}
                    <div className="col-span-2 space-y-1">
                      <dt className="text-muted-foreground">
                        {t("admin.userPreview.emailSignature")}
                      </dt>
                      <dd>
                        {detail.email_signature ? (
                          <div className="rounded-md border bg-muted/30 p-2.5 font-mono text-[11px] leading-relaxed text-foreground whitespace-pre-wrap">
                            {detail.email_signature}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">
                            {t("admin.userPreview.noSignature")}
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* 5. Associated Entities: Projects (SME) */}
                {(detail.projects.length > 0 || detail.role === "SME") && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Briefcase className="h-4 w-4 text-primary" />
                        {t("admin.userPreview.relatedProjects")} (
                        {detail.projects.length})
                      </h4>

                      {detail.projects.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">
                          {t("admin.userPreview.noProjects")}
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {detail.projects.map((proj) => (
                            <div
                              key={proj.id}
                              className="rounded-lg border bg-muted/20 p-3.5 space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h5 className="text-sm font-semibold text-foreground">
                                    {proj.legal_name}
                                  </h5>
                                  <p className="text-xs text-muted-foreground">
                                    {proj.ownership_role}
                                    {proj.industry &&
                                      ` · ${industryLabel(proj.industry, t)}`}
                                  </p>
                                </div>
                                <Badge
                                  variant={statusVariant(proj.status)}
                                  className="text-xs"
                                >
                                  {enumLabel(t, "projectStatus", proj.status)}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-xs">
                                <div>
                                  <span className="text-muted-foreground block">
                                    {t("admin.userPreview.taxId")}
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {proj.tax_id || "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block">
                                    {t("admin.userPreview.employeeCount")}
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {proj.employee_count !== null
                                      ? t(
                                          "admin.userPreview.employeeCountFormat",
                                        ).replace(
                                          "{count}",
                                          String(proj.employee_count),
                                        )
                                      : "—"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block">
                                    {t("admin.userPreview.totalApplications")}
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {proj.applications_count}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block">
                                    {t("admin.userPreview.totalRequested")}
                                  </span>
                                  <span className="font-medium text-foreground">
                                    {proj.total_requested_amount > 0
                                      ? formatCurrency(
                                          proj.total_requested_amount,
                                          locale,
                                        )
                                      : "0 ₫"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 6. Associated Entities: Investments (Investor) */}
                {(detail.investments?.orders_count > 0 ||
                  detail.investments?.holdings_count > 0 ||
                  detail.role === "INVESTOR") && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        {t("admin.userPreview.investmentsSummary")}
                      </h4>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                          <span className="text-xs text-muted-foreground block">
                            {t("admin.userPreview.orders")}
                          </span>
                          <p className="text-xs font-semibold text-foreground">
                            {t("admin.userPreview.ordersSummary")
                              .replace(
                                "{count}",
                                String(detail.investments.orders_count),
                              )
                              .replace(
                                "{amount}",
                                formatCurrency(
                                  detail.investments.orders_amount,
                                  locale,
                                ),
                              )}
                          </p>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                          <span className="text-xs text-muted-foreground block">
                            {t("admin.userPreview.holdings")}
                          </span>
                          <p className="text-xs font-semibold text-foreground">
                            {t("admin.userPreview.holdingsSummary")
                              .replace(
                                "{count}",
                                String(detail.investments.holdings_count),
                              )
                              .replace(
                                "{amount}",
                                formatCurrency(
                                  detail.investments.holdings_principal,
                                  locale,
                                ),
                              )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : null}

            <Separator />

            {/* 7. Account Status Actions */}
            <section className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {t("admin.userPreview.statusHeading")}
                </h4>
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
                    disabled={isUpdatingStatus}
                    placeholder={t("admin.userPreview.notePlaceholder")}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((status) => (
                      <Button
                        key={status}
                        type="button"
                        size="sm"
                        variant={
                          status === "SUSPENDED"
                            ? "destructive"
                            : status === currentStatus
                              ? "default"
                              : "outline"
                        }
                        className={cn("flex-1", "min-w-28")}
                        disabled={isUpdatingStatus || status === currentStatus}
                        onClick={() => handleStatus(status)}
                      >
                        {isUpdatingStatus && (
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
