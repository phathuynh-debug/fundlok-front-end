"use client";

import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

export function SentEmailsCard() {
  const { t, locale } = useTranslations();
  // isPending, not isLoading: it also covers the moment before the query
  // is enabled (waiting for the admin's id), which would otherwise read as
  // an error.
  const { data, isPending, isError } = useSentEmails();
  const { data: user } = useCurrentUser();
  const seesEveryone = user?.role === "SYSTEM_ADMIN";

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
        <div className="mt-4 overflow-x-auto">
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
              {data.map((email) => (
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
      )}
    </section>
  );
}

function StatusCell({ email }: { email: InternalEmail }) {
  const { t } = useTranslations();
  const label = t(`admin.email.sent.statuses.${email.status}`);
  // A FAILED row says why; a SENT row can carry a code too (some recipients
  // refused).
  const detail = emailErrorCodeText(email.error_code, t);

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
    </div>
  );
}
