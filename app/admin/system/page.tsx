"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-authentication";
import { useMaintenance, useSetMaintenance } from "@/hooks/use-admin";
import { Loader2, ServerCog, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

export default function AdminSystemPage() {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const { t } = useTranslations();
  const isSystemAdmin = !isLoading && user?.role === "SYSTEM_ADMIN";

  const { data: maintenance, isLoading: isMaintenanceLoading } =
    useMaintenance(isSystemAdmin);
  const { mutate: save, isPending, isSuccess, isError } = useSetMaintenance();

  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  // Seed local form state once the current maintenance state loads.
  useEffect(() => {
    if (maintenance) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnabled(maintenance.enabled);
      setMessage(maintenance.message ?? "");
    }
  }, [maintenance]);

  // Fallback guard: middleware already restricts /admin/system to SYSTEM_ADMIN.
  useEffect(() => {
    if (!isLoading && user && user.role !== "SYSTEM_ADMIN") {
      router.replace("/admin");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== "SYSTEM_ADMIN") {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <ServerCog className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("admin.system.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.system.subtitle")}
          </p>
        </div>
      </div>

      {/* Maintenance mode */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">
            {t("admin.system.maintenance.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("admin.system.maintenance.description")}
          </p>
        </div>

        {isMaintenanceLoading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-6">
            {/* Toggle */}
            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 text-sm font-medium",
                    enabled ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {enabled ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {enabled
                    ? t("admin.system.maintenance.on")
                    : t("admin.system.maintenance.off")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="maintenance-toggle" className="sr-only">
                  {t("admin.system.maintenance.enabledLabel")}
                </Label>
                <Switch
                  id="maintenance-toggle"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="maintenance-message">
                {t("admin.system.maintenance.messageLabel")}
              </Label>
              <Textarea
                id="maintenance-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("admin.system.maintenance.messagePlaceholder")}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                disabled={isPending}
                onClick={() =>
                  save({ enabled, message: message.trim() || null })
                }
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending
                  ? t("admin.system.maintenance.saving")
                  : t("admin.system.maintenance.save")}
              </Button>
              {isSuccess && !isPending && (
                <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-500">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("admin.system.maintenance.saved")}
                </span>
              )}
              {isError && (
                <span className="flex items-center gap-1 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {t("admin.system.maintenance.error")}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
