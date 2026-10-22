"use client";

import { usePathname } from "next/navigation";

import { publicPathname } from "@/lib/locale-routing";

/**
 * `usePathname()` with a prerendered marketing page's internal /vi prefix
 * removed, so the server build and the browser read the same value. Use it,
 * not `usePathname()`, in anything a marketing page renders; see
 * `publicPathname` in lib/locale-routing.ts.
 */
export function usePublicPathname(): string {
  return publicPathname(usePathname() ?? "/");
}
