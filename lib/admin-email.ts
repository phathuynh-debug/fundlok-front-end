/**
 * Validates whether an email belongs to the official FundLok organization domain (@fundlok.com).
 * Strict domain match (case-insensitive) to prevent subdomain and homograph/lookalike tricks.
 */
export function isFundlokEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex <= 0) return false;
  const domain = trimmed.slice(atIndex + 1);
  return domain === "fundlok.com";
}
