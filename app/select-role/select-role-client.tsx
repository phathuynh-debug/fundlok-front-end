"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, TrendingUp, Loader2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useToast } from "@/hooks/use-toast";
import { useSelectRole } from "@/hooks/use-authentication";
import { useTranslations } from "@/lib/i18n";
import type { SelectableRole } from "@/services/authentication.service";

// After picking a role, send the user straight to where that role belongs.
// Middleware re-validates and (for SMEs without projects) forwards on to the
// application form, so this is just an optimistic first hop.
const LANDING_BY_ROLE: Record<SelectableRole, string> = {
  SME: "/project-application",
  INVESTOR: "/dashboard",
};

export function SelectRoleClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslations();
  const { mutate: selectRole, isPending } = useSelectRole();
  // Track which card is submitting so only its button shows the spinner.
  const [pendingRole, setPendingRole] = useState<SelectableRole | null>(null);

  const handleSelect = (role: SelectableRole) => {
    setPendingRole(role);
    selectRole(role, {
      onSuccess: () => {
        toast({
          title: t("auth.selectRole.successTitle"),
          description: t("auth.selectRole.successDescription"),
        });
        router.push(LANDING_BY_ROLE[role]);
      },
      onError: (error) => {
        setPendingRole(null);
        toast({
          variant: "destructive",
          title: t("auth.selectRole.failedTitle"),
          description: error?.message || t("auth.selectRole.failedDescription"),
        });
      },
    });
  };

  const cards: Array<{
    role: SelectableRole;
    icon: typeof Building2;
    title: string;
    description: string;
  }> = [
    {
      role: "SME",
      icon: Building2,
      title: t("auth.selectRole.smeTitle"),
      description: t("auth.selectRole.smeDescription"),
    },
    {
      role: "INVESTOR",
      icon: TrendingUp,
      title: t("auth.selectRole.investorTitle"),
      description: t("auth.selectRole.investorDescription"),
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-6">
      <div className="w-full max-w-3xl space-y-10">
        <div className="flex justify-end">
          <LocaleSwitcher />
        </div>

        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("auth.selectRole.title")}
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            {t("auth.selectRole.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {cards.map(({ role, icon: Icon, title, description }) => {
            const isThisPending = isPending && pendingRole === role;

            return (
              <div
                key={role}
                className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-white p-8 text-center shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
                <Button
                  type="button"
                  onClick={() => handleSelect(role)}
                  disabled={isPending}
                  className="h-12 w-full text-base font-medium"
                >
                  {isThisPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isThisPending
                    ? t("auth.selectRole.submitting")
                    : t("auth.selectRole.select")}
                  {!isThisPending ? (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  ) : null}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
