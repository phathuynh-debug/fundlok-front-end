# FundLok Launch Risk Register

**Based on:** vbsec re-scan 29 Sep 2026 · **Open:** backend 29, frontend 1 · **Prepared by:** Phat

What was fixed after the vbsec scans, and the open findings the team decided to accept for launch. Each deferred item notes the risk, why it's tolerable at launch, and what keeps it contained.

| Fixed | Accepted for launch |
|---|---|
| **9** (1 of them partly) | **30** (1 critical, 8 high, 9 medium, 12 low) |

## Fixed

| Was | Issue | Fix | Status |
|---|---|---|---|
| Critical | Google sign-in accepted tokens issued to other apps | Tokens must be issued to FundLok's client ID with a verified email | Fixed |
| High | Pre-registered account kept the squatter's credentials after the owner's Google sign-in | First verified OAuth sign-in removes password, sessions, 2FA and passkeys | Fixed |
| High | Google sign-in skipped 2FA and account suspension | Same gates as password login; login page shows the 2FA step | Fixed |
| High | KYC approved someone else's ID card | A CCCD already approved elsewhere goes to manual review; admin review queue built | Partly |
| Medium | Uploads not size-limited (up to 5 GB) | Upload URLs sign the exact size; oversized objects deleted | Fixed |
| Medium | Contact form sent FundLok-branded phishing to any address | Auto-reply has no submitted text; malformed recipients refused | Fixed |
| Medium | Password reset kept existing sessions; link reusable for an hour | Reset signs out every session; each link works once | Fixed |
| Medium | Open redirect in server-side `?next=` | Validated after URL normalisation (shared helper) | Fixed |
| Medium | Open redirect after KYC completion | Same helper on the client | Fixed |

Also shipped with these: Vietnamese text for backend rejection reasons, an escaped new-device sign-in alert, and a signed avatar upload size. All committed to `main` / `production` and pushed.

## Deferred: accepted for launch

"Why tolerable" is the reasoning for accepting the risk at launch volume, not a claim that the issue is harmless. Revisit every item in the first post-launch security sprint.

| Severity | Risk | Why tolerable at launch / containment | Owner |
|---|---|---|---|
| Critical | Leaked provider keys in git history (`.env.bak`) | Only if the keys are rotated at each provider; history purge can follow | Ops |
| High | Microsoft sign-in trusts an editable email (nOAuth) | Not offered in the UI; the backend refuses it while `MICROSOFT_CLIENT_ID` is unset (the default; CI doesn't set it). **Keep it unset in production.** | Phat |
| High | Pre-hijack through password reset | Needs the attacker to register the victim's email first and the victim to use reset. | Shared |
| High | Unlimited 2FA code guesses | Attacker needs the password first; 2FA is optional and rare at launch. Watch repeated 401s on `/auth/login/2fa`. | Shared |
| High | KYC has no liveness check | Needs the victim's ID card photos; duplicates of verified IDs go to manual review. Liveness is a vendor decision (spec OQ2, Edward). | Phat / Edward |
| High | KYB doesn't tie the submitter to the business | Every funding application also passes admin approval and underwriting. | Phat |
| High | Zip bomb in VAT parser | Availability only. Watch worker memory and restarts. | Phat |
| High | Concurrent orders can oversubscribe a listing | Unlikely at launch volume. Reconcile `funded_amount` against orders before each disbursement. | Phat |
| High | Double submit creates two contracts | Admin-only. Create each contract once; check the list before listing. | Edward |
| Medium | No password-login attempt limit; Turnstile off without its secret | Contained only if `CLOUDFLARE_TURNSTILE_SECRET_KEY` is set in production. | Shared |
| Medium | Passkey options table growth; resend-verification inbox flooding | Nuisance/cost only. Watch table size and outbound mail volume. | Shared |
| Medium | Unlimited billable KYC/KYB retries | Cost only. Watch GVerify spend; suspend abusers from the admin console. | Phat |
| Medium | Double disbursement / repayment without an idempotency key | Admin-only. Never retry without checking the ledger first. | Edward |
| Medium | Several locked score runs per application | Admin-only. Lock one run per application. | Edward |
| Medium | Prod deploy action pinned by tag, not SHA | Needs a compromise of Google's official action. Pin in the next CI change. | Ops |
| Low | 12 items: order lookup IDOR; ledger unique constraint; public projects show SME notes/file keys; resend-verification enumeration; refresh-token race; concurrent admin decisions; review status reveals its cause; `SECRET_KEY` visible to Cloud Run viewers; unpinned Docker base; unpinned dev-tool deps; `.gitignore` gap; frontend `/api` proxy origin check | Unusual timing, guessing or elevated cloud access needed, or metadata only. Keep Cloud Run Viewer access to the core team. | Mixed |

## Conditions this register relies on

- `MICROSOFT_CLIENT_ID` is **unset** in production.
- `CLOUDFLARE_TURNSTILE_SECRET_KEY` is **set** in production.
- Backend `GOOGLE_CLIENT_ID` equals the frontend's `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, or Google sign-in breaks.
- Admins follow the one-click rule for contracts, disbursements, repayments and score-run locks until the idempotency fixes land.
- Edward reviews this round's changes to `app/utils/` and the shared `app/auth/`, which went to `main` without a PR.

## Sign-off

| Engineering (Phat) | CTO (Edward) | Date |
|---|---|---|
| | | |

---

*Source: vbsec re-scans of 29 Sep 2026 (`vbsec-reports/scan-2026-09-29-134139.md` in each repo). vbsec is a reference tool and doesn't replace a professional security audit.*
