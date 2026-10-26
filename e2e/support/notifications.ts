import type { BrowserContext, Page } from "@playwright/test";

import { t } from "./i18n";

/** "Later", in either language: a spec may switch the UI to English. */
const LATER = new RegExp(
  `^(${t("notifications.alert.later")}|${t("notifications.alert.later", undefined, "en")})$`,
);

/**
 * Dismiss the new-notifications alert whenever it opens.
 *
 * The dashboard opens a modal over every screen while there are unread
 * notifications (components/new-notifications-alert.tsx), and the stub's SME
 * accounts always have one. The modal makes the rest of the page inert, so the
 * headings and buttons the suite looks for disappear from the accessibility
 * tree. It opens whenever the notifications query resolves, so a one-off click
 * would race it — a locator handler runs before every action and auto-waiting
 * assertion instead. "Later" only hides it for the visit: the notifications
 * stay unread, which is what the bell's own spec counts on.
 */
export async function dismissNotificationsAlert(
  context: BrowserContext,
): Promise<void> {
  const register = (page: Page) =>
    page.addLocatorHandler(
      page.getByRole("dialog").filter({
        has: page.getByRole("button", { name: LATER }),
      }),
      async (dialog) => {
        await dialog.getByRole("button", { name: LATER }).click();
      },
    );
  await Promise.all(context.pages().map(register));
  context.on("page", (page) => void register(page));
}
