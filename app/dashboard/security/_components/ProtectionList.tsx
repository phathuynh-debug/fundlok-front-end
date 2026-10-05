"use client";

import {
  Banknote,
  BellRing,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ProtectionItem, ProtectionState } from "./mock-security";

const ICONS: Record<string, LucideIcon> = {
  password: KeyRound,
  totp: ShieldCheck,
  withdrawalLock: Banknote,
  passkey: Fingerprint,
  loginAlerts: BellRing,
};

const STATE_STYLES: Record<ProtectionState, string> = {
  on: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  recommended:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  off: "bg-muted text-muted-foreground",
  unavailable: "bg-muted text-muted-foreground",
};

export function ProtectionList({
  items,
  onToggle,
  onChangePassword,
  pendingKey,
}: {
  items: ProtectionItem[];
  onToggle: (key: string) => void;
  onChangePassword: () => void;
  /** Row whose toggle is in flight, so only it shows as busy. */
  pendingKey?: string | null;
}) {
  const { locale, t } = useTranslations();

  return (
    <Card className="p-5 md:p-6 gap-0">
      <div className="flex flex-col gap-1 pb-4">
        <h2 className="text-base font-semibold text-foreground">
          {t("dashboard.security.protections.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.security.protections.subtitle")}
        </p>
      </div>

      <ul className="divide-y divide-border border-t border-border">
        {items.map((item) => {
          const Icon = ICONS[item.key] ?? ShieldCheck;
          const isOn = item.state === "on";

          return (
            <li
              key={item.key}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    isOn
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {t(`dashboard.security.protections.items.${item.key}`)}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-2 text-[11px] font-semibold",
                        STATE_STYLES[item.state],
                      )}
                    >
                      {t(`dashboard.security.protections.state.${item.state}`)}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t(`dashboard.security.protections.desc.${item.key}`)}
                  </p>
                  {item.updated_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("dashboard.security.protections.updated", {
                        date: formatDate(item.updated_at, locale),
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Three kinds of row: one that opens a dialog (password), one
                  that toggles through the API (sign-in alerts), and ones with
                  no backend, which say so instead of offering a dead switch. */}
              <Button
                variant={
                  item.key === "password" || isOn ? "outline" : "default"
                }
                size="sm"
                disabled={
                  item.state === "unavailable" ||
                  (!item.toggleable && item.key !== "password") ||
                  pendingKey === item.key
                }
                onClick={() =>
                  item.key === "password"
                    ? onChangePassword()
                    : onToggle(item.key)
                }
                className="shrink-0 sm:w-32"
              >
                {t(
                  item.state === "unavailable"
                    ? "dashboard.security.protections.action.unavailable"
                    : item.key === "password"
                      ? "dashboard.security.protections.action.managed"
                      : isOn
                        ? "dashboard.security.protections.action.turnOff"
                        : "dashboard.security.protections.action.turnOn",
                )}
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
