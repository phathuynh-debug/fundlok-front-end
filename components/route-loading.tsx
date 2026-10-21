import { Skeleton } from "@/components/ui/skeleton";
import { getServerTranslations } from "@/lib/i18n/server";

// Shared `loading.tsx` body for the signed-in sections. Without a loading
// boundary, a client navigation into a dynamic route leaves the previous page
// frozen on screen until the proxy's session lookup and the server render have
// both finished. With one, Next swaps this in the moment the link is clicked
// (and prefetches it), so the click always answers immediately.
//
// Rendered inside the section's layout, so the sidebar and header stay put and
// only the content area pulses.
export async function RouteLoading({
  fullScreen = false,
}: {
  // Sections without a sidebar layout (KYC, project application, select-role)
  // fill the viewport instead of sitting in a content column.
  fullScreen?: boolean;
}) {
  const { t } = await getServerTranslations();

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        fullScreen
          ? "mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10"
          : "flex flex-col gap-6"
      }
    >
      <span className="sr-only">{t("common.loading")}</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
