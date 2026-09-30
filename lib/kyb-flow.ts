// Whether the SME's KYB screen includes the identity (KYC) step.
//
// On by default and ALWAYS on in a production build: the step is how an SME
// proves they are a legal representative of the business they verify.
//
// For local testing it can be hidden with
//   NEXT_PUBLIC_GVERIFY_KYB_REQUIRE_REP_MATCH=false
// in .env.local, which is only honoured outside production builds. Named
// after the backend's GVERIFY_KYB_REQUIRE_REP_MATCH on purpose, but the two are
// separate switches:
//   - backend flag  = enforcement: KYB needs an approved KYC and the CCCD must
//                     be a legal representative on the certificate;
//   - frontend flag = whether the screen shows the step at all.
// Hide the step only while the backend flag is also off locally, or the
// backend refuses the submission with KYC_REQUIRED.

export function kybIdentityStepEnabled(
  nodeEnv: string | undefined,
  flag: string | undefined,
): boolean {
  if (nodeEnv === "production") return true;
  return flag?.trim().toLowerCase() !== "false";
}

// Read literally from process.env so Next inlines both at build time.
export const KYB_IDENTITY_STEP = kybIdentityStepEnabled(
  process.env.NODE_ENV,
  process.env.NEXT_PUBLIC_GVERIFY_KYB_REQUIRE_REP_MATCH,
);
