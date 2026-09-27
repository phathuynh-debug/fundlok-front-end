/**
 * Localized labels for the raw enum strings the backend sends (roles,
 * statuses, audit actions). Rendering `user.role` or `project.status` directly
 * put "INVESTOR" or "DRAFT" on the Vietnamese site; every such value goes
 * through one of these instead.
 *
 * Labels live under `enums.<group>.<VALUE>` in en.json / vi.json. A value the
 * dictionary does not know yet (the backend added one) falls back to a
 * readable form of the code ("MANUAL_REVIEW" -> "Manual review") rather than
 * the screaming constant, so a new value degrades instead of breaking.
 */
type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export type EnumGroup =
  | "role"
  | "userStatus"
  | "projectStatus"
  | "approval"
  | "documentStatus"
  | "verificationStatus"
  | "scoreRunStatus"
  | "scoreDecision"
  | "auditAction"
  | "auditEntity";

export function humanizeEnum(value: string): string {
  const words = value.replace(/[_-]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function enumLabel(
  t: Translate,
  group: EnumGroup,
  value: string | null | undefined,
): string {
  if (!value) return "";
  const key = `enums.${group}.${value}`;
  const label = t(key);
  return label === key ? humanizeEnum(value) : label;
}

export const roleLabel = (t: Translate, role: string | null | undefined) =>
  enumLabel(t, "role", role);
