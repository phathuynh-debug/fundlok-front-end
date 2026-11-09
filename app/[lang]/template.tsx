import { ViewTransition } from "react";

/**
 * Moving between the marketing pages fades the next page in over the last one
 * while the header holds still (modelled on thisisamplify.com). The animation
 * is `.page-fade` in globals.css; browsers without the View Transitions API
 * just swap pages as before.
 *
 * A template, not the layout: a template remounts on every navigation between
 * pages, so this ViewTransition exits with the old page and enters with the
 * new one. A layout persists, so enter/exit would never fire there.
 * `default="none"` keeps transitions inside a page (the rate calculator, the
 * FAQ search) from animating.
 *
 * The wrapper div gives React one element to snapshot per page, whatever the
 * page renders at its top level (JSON-LD scripts, fragments).
 */
export default function MarketingTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
