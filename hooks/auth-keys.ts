// Query-key factory for the auth domain. Plain module (no "use client") so
// server components can import it too; hooks/use-authentication.ts re-exports
// it for everything else.
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "me"] as const,
  securityOverview: (limit?: number) =>
    typeof limit === "number"
      ? ([...authKeys.all, "security-overview", limit] as const)
      : ([...authKeys.all, "security-overview"] as const),
  sessions: () => [...authKeys.all, "sessions"] as const,
  securityPreferences: () => [...authKeys.all, "security-preferences"] as const,
  securityEvents: (limit?: number) =>
    typeof limit === "number"
      ? ([...authKeys.all, "security-events", limit] as const)
      : ([...authKeys.all, "security-events"] as const),
  twoFactor: () => [...authKeys.all, "two-factor"] as const,
  passkeys: () => [...authKeys.all, "passkeys"] as const,
};
