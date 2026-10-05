/**
 * Whether Google sign-in is configured on this build.
 *
 * `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is inlined at build time, so this is a
 * constant per deployment rather than something to check at runtime.
 *
 * Why this exists: with an empty client id, @react-oauth/google throws while
 * initialising during hydration. Next catches that in the global error boundary
 * and replaces the whole page with "This page couldn\u2019t load" — so a missing
 * OPTIONAL integration took down the entire login screen, password sign-in
 * included. CI hit exactly that, because the variable is only set in a local
 * .env.local.
 *
 * The provider still mounts (hooks cannot be called conditionally, and
 * useGoogleLogin requires its context) — it just gets a syntactically valid
 * placeholder, and the button that would use it is hidden.
 */

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const isGoogleSignInConfigured = GOOGLE_CLIENT_ID.length > 0;

/** Keeps GoogleOAuthProvider mountable when the real id is absent. */
export const GOOGLE_CLIENT_ID_OR_PLACEHOLDER =
  GOOGLE_CLIENT_ID || "unconfigured.apps.googleusercontent.com";
