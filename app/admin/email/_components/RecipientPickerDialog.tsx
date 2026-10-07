"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEmailRecipients } from "@/hooks/use-admin-email";
import { roleLabel } from "@/lib/enum-labels";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// Pick recipients from the system's users: active accounts with a verified
// email, searched on the server by name or email. "FundLok emails only" keeps
// addresses on FundLok's domains. Ticked addresses are added to the To list;
// ones already in it start ticked.

export function RecipientPickerDialog({
  open,
  onOpenChange,
  selected,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: string[];
  onConfirm: (emails: string[]) => void;
}) {
  const { t } = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("admin.email.picker.title")}</DialogTitle>
          <DialogDescription>
            {t("admin.email.picker.description")}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted per opening, so the ticks start from the current To list. */}
        {open && (
          <PickerBody
            selected={selected}
            onCancel={() => onOpenChange(false)}
            onConfirm={(emails) => {
              onConfirm(emails);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PickerBody({
  selected,
  onCancel,
  onConfirm,
}: {
  selected: string[];
  onCancel: () => void;
  onConfirm: (emails: string[]) => void;
}) {
  const { t } = useTranslations();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [fundlokOnly, setFundlokOnly] = useState(false);
  // Keyed by lower-cased address, value is the address as listed.
  const [ticked, setTicked] = useState<Map<string, string>>(
    () => new Map(selected.map((email) => [email.toLowerCase(), email])),
  );

  // Search on the server once typing pauses, not on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isPending, isError } = useEmailRecipients(
    debounced,
    fundlokOnly,
  );
  const users = data ?? [];

  const toggle = (email: string) =>
    setTicked((current) => {
      const next = new Map(current);
      const key = email.toLowerCase();
      if (next.has(key)) next.delete(key);
      else next.set(key, email);
      return next;
    });

  // Only the users on screen: an address typed into the To list by hand is
  // never listed here, so it must not vanish because "Clear" was pressed.
  const clearShown = () =>
    setTicked((current) => {
      const next = new Map(current);
      for (const user of users) next.delete(user.email.toLowerCase());
      return next;
    });

  const tickAllShown = () =>
    setTicked((current) => {
      const next = new Map(current);
      for (const user of users) next.set(user.email.toLowerCase(), user.email);
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-10"
            autoComplete="off"
            placeholder={t("admin.email.picker.search")}
            aria-label={t("admin.email.picker.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="picker-fundlok-only"
            checked={fundlokOnly}
            onCheckedChange={setFundlokOnly}
          />
          <Label htmlFor="picker-fundlok-only" className="whitespace-nowrap">
            {t("admin.email.picker.fundlokOnly")}
          </Label>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {t("admin.email.picker.selectedCount").replace(
            "{count}",
            String(ticked.size),
          )}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={users.length === 0}
            onClick={tickAllShown}
          >
            {t("admin.email.picker.selectAll")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={
              !users.some((user) => ticked.has(user.email.toLowerCase()))
            }
            onClick={clearShown}
          >
            {t("admin.email.picker.clear")}
          </Button>
        </div>
      </div>

      <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
        {isPending ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : isError ? (
          <p role="alert" className="p-4 text-sm text-destructive">
            {t("admin.email.picker.loadFailed")}
          </p>
        ) : users.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {t("admin.email.picker.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((user) => {
              const checked = ticked.has(user.email.toLowerCase());
              const id = `picker-user-${user.id}`;
              return (
                <li key={user.id}>
                  <label
                    htmlFor={id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50",
                      checked && "bg-primary/5",
                    )}
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() => toggle(user.email)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {user.full_name || t("admin.email.picker.noName")}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </span>
                    {user.role && (
                      <Badge variant="secondary" className="shrink-0">
                        {roleLabel(t, user.role)}
                      </Badge>
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="button" onClick={() => onConfirm([...ticked.values()])}>
          {t("admin.email.picker.add").replace("{count}", String(ticked.size))}
        </Button>
      </DialogFooter>
    </div>
  );
}
