import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

// Server-safe primitive (no i18n hook): callers pass a translated `label`.
function Spinner({
  className,
  label = "Loading",
  ...props
}: React.ComponentProps<"svg"> & { label?: string }) {
  return (
    <Loader2Icon
      role="status"
      aria-label={label}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
