"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmailPolicy, useSaveEmailPolicy } from "@/hooks/use-admin-email";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "@/lib/i18n";
import { emailErrorText, invalidDomains, parseList } from "./email-errors";

// SYSTEM_ADMIN only (the page renders it for them; the API refuses anyone
// else). The recipient domains every admin's email may go to. A per-admin
// list would restrict nothing, since each admin could widen their own.

export function EmailPolicyCard() {
  const { t } = useTranslations();
  const { data, isLoading, isError } = useEmailPolicy();

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          {t("admin.email.policy.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("admin.email.policy.description")}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isError || !data ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {t("admin.email.policy.loadFailed")}
        </p>
      ) : (
        // Keyed on the saved list so a save re-seeds the field.
        <PolicyForm
          key={data.allowed_domains.join(",")}
          domains={data.allowed_domains}
        />
      )}
    </section>
  );
}

function PolicyForm({ domains: saved }: { domains: string[] }) {
  const { t, locale } = useTranslations();
  const { toast } = useToast();
  const { mutateAsync: save, isPending } = useSaveEmailPolicy();
  const [domains, setDomains] = useState(saved.join(", "));
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const list = parseList(domains);
    const bad = invalidDomains(list);
    if (bad.length > 0) {
      setError(
        t("admin.email.settings.domainsInvalid").replace("{list}", bad.join(", ")),
      );
      return;
    }
    setError(null);
    try {
      await save(list);
      toast({ title: t("admin.email.policy.saved") });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("admin.email.errors.saveTitle"),
        description: emailErrorText(err, t, locale),
      });
    }
  };

  return (
    <form onSubmit={handleSave} noValidate className="mt-4 flex flex-col gap-3">
      <div className="space-y-2">
        <Label htmlFor="email-policy-domains">
          {t("admin.email.settings.domainsLabel")}
        </Label>
        <Input
          id="email-policy-domains"
          autoComplete="off"
          placeholder={t("admin.email.settings.domainsPlaceholder")}
          value={domains}
          aria-invalid={!!error}
          aria-describedby="email-policy-help"
          onChange={(event) => setDomains(event.target.value)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p id="email-policy-help" className="text-xs text-muted-foreground">
          {t("admin.email.settings.domainsHelp")}
        </p>
      </div>
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isPending
            ? t("admin.email.settings.saving")
            : t("admin.email.settings.save")}
        </Button>
      </div>
    </form>
  );
}
