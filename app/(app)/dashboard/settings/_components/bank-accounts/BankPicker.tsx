"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CONTROL_HOVER } from "@/lib/ui-tokens";
import { useTranslations } from "@/lib/i18n";
import type { Bank } from "@/services/payment-accounts.service";

interface BankPickerProps {
  id?: string;
  banks: Bank[];
  value: string;
  onChange: (bin: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

const K = "dashboard.settings.profile.bankAccount.form";

// Popular banks pinned on top, the rest searchable by short name, full name or
// code. The value is the bank's BIN: users pick a bank, they never type a BIN.
export function BankPicker({
  id,
  banks,
  value,
  onChange,
  disabled,
  invalid,
}: BankPickerProps) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);

  const selected = banks.find((bank) => bank.bin === value);
  const popular = useMemo(() => banks.filter((b) => b.popular), [banks]);
  const others = useMemo(() => banks.filter((b) => !b.popular), [banks]);

  const renderItem = (bank: Bank) => (
    <CommandItem
      key={bank.bin}
      value={`${bank.short_name} ${bank.code} ${bank.name}`}
      onSelect={() => {
        onChange(bank.bin);
        setOpen(false);
      }}
    >
      <Check
        className={cn(
          "h-4 w-4",
          bank.bin === value ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{bank.short_name}</p>
        <p className="truncate text-xs text-muted-foreground">{bank.name}</p>
      </div>
      {!bank.vietqr && (
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
          {t(`${K}.noVietQr`)}
        </span>
      )}
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            CONTROL_HOVER,
            !selected && "text-muted-foreground",
            invalid && "border-destructive",
          )}
        >
          <span className="truncate">
            {selected ? selected.short_name : t(`${K}.bankPlaceholder`)}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={t(`${K}.bankSearch`)} />
          <CommandList>
            <CommandEmpty>{t(`${K}.bankNoResults`)}</CommandEmpty>
            {popular.length > 0 && (
              <CommandGroup heading={t(`${K}.popularBanks`)}>
                {popular.map(renderItem)}
              </CommandGroup>
            )}
            {others.length > 0 && (
              <CommandGroup heading={t(`${K}.otherBanks`)}>
                {others.map(renderItem)}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
