/**
 * Shared interaction classes for dashboard controls.
 *
 * Every clickable control in the dashboard — sidebar nav, header toggles,
 * segmented pills, outline/ghost buttons, tab triggers — hovers to the same
 * neutral fill. `--accent` is the emerald brand color in light mode, which is
 * too loud for a wide surface like a full-width button, so controls
 * deliberately override the shadcn default `hover:bg-accent`.
 *
 * Import these instead of retyping the classes, so the hover stays one
 * decision in one place.
 */
export const CONTROL_HOVER =
  // `dark:hover:bg-muted` looks redundant but is load-bearing: the shadcn
  // outline variant ships `dark:hover:bg-input/50`, which sits in a different
  // tailwind-merge group than `hover:bg-*` and would otherwise survive and win
  // in dark mode.
  "hover:bg-muted hover:text-foreground dark:hover:bg-muted";

/** Idle half of a control that also has a selected/active state. */
export const CONTROL_IDLE = `text-muted-foreground ${CONTROL_HOVER}`;

/** Idle half of an icon inside a `group` control (nav items, pills). */
export const CONTROL_ICON_IDLE =
  "text-muted-foreground group-hover:text-foreground";
