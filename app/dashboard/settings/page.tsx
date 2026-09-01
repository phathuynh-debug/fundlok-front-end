import { redirect } from "next/navigation";

/**
 * /dashboard/settings has no screen of its own — it is a group, not a page.
 *
 * It still needs to resolve: the mobile nav in DashboardHeader links straight
 * here (it has no room for the sidebar's expandable group), and people bookmark
 * and type bare section URLs. Before this file that link was a 404, found by
 * the sidebar link-integrity test in e2e/tests/navigation.spec.ts.
 *
 * `redirect` rather than `permanentRedirect`: which section is the natural
 * landing is a product choice that may change, and a 308 would be cached by
 * browsers long after it did.
 */
export default function SettingsIndexPage() {
  redirect("/dashboard/settings/profile");
}
