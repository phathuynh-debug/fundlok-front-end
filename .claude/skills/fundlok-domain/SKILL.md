---
name: fundlok-domain
description: >-
  FundLok's product mechanics, mandatory disclosures and compliance-controlled
  language, from the FundLok Handbook v3 (26 Aug 2026) — what the UI is allowed
  to say and must always show. Covers what FundLok is and is not (not a bank,
  not a lender, not a rating agency), how the rate and the 0–100 score work,
  the fixed origination total, daily repayment, relief, extension, the 1.33x
  backstop, what an investor must see before committing, the four mandatory
  never-say/always-say phrasings (EN + VI), the bilingual rule, and brand
  visuals. Use this skill BEFORE writing or editing any user-facing copy, i18n
  string, label, tooltip, badge, chart caption, FAQ, marketing page, error
  message, or any screen that presents a rate, score, return, risk level, fee,
  repayment schedule or fund custody. Pair with `fundlok-frontend` for how the
  code is structured; this one governs what it may say.
---

# FundLok Domain & Voice (Frontend)

Source: **FundLok Handbook v3**, issued 26 August 2026, owner CEO. It is the
source of truth for how we behave; where it conflicts with an older doc, it
wins. If you find a conflict, say so rather than choosing for yourself.

- `fundlok-frontend` → **how** this repo is built (data flow, hooks, tokens).
- `fundlok-domain` (this) → **what** the product actually is and what the UI is
  permitted to say about it.

> Tone here is a compliance control, not a style preference. The same sentence
> has to work for an SME owner, an investor, a bank and a regulator at once.

---

## 1. Three sentences you must be able to defend

1. **Investors provide the capital.** The credit agreement is between the
   investor and the SME. FundLok is not a party to it, does not lend its own
   money, takes no credit risk and guarantees no one gets repaid.
2. **FundLok is not a bank, not a lender, not a rating agency, not a
   collections business** — and no screen may drift toward implying otherwise.
3. **The investor bears the loss** if a business underperforms. We say it
   plainly rather than softening it.

The SME is not buying a fintech product. They are buying stock on the shelf, an
order they can fulfil, payroll that clears, a supplier they can pay early.
Write outcomes, not mechanics, on SME surfaces.

---

## 2. The mechanics, in the words the UI may use

Get these right and most copy writes itself. Backend invariants for the same
mechanics live in the backend repo's `fundlok-domain` skill.

| Mechanic | What the UI may say |
| --- | --- |
| **Rate** | Starts from a reference rate (what commercial banks charge for unsecured lending) and moves with the business's internal score: stronger score → closer to the reference rate. **Capped at the statutory 20%/yr ceiling.** The quoted rate is **all-in — there is no second rate underneath it.** |
| **Score** | A **0–100 internal assessment** that moves the rate between the reference rate and the ceiling. It is a **reference input to a decision**, never a credit rating. See §4. |
| **Total repayable** | **Fixed at signing.** Does not grow because a month went badly, does not shrink because a month went well. Only an extension changes it. |
| **Term** | Declared by the SME — **6 or 12 months. Twelve is the maximum; we never write longer.** |
| **Daily repayment** | A **fixed amount each business day** until the total is cleared — small, predictable, matched to a business that takes money in daily. |
| **Relief (true-up)** | We check the daily amount against verified revenue at intervals. **If revenue fell short, the obligation for that period drops and the facility runs longer. If revenue was strong, we never ask for more.** Relief works in one direction only — down. **Relief extends duration; it never reduces the total owed.** |
| **Missed payment** | One missed day raises a **warning** — not punitive, **not a default**. It moves the facility to a **watchlist**, and it exists so the conversation happens on day one, not month six. |
| **Extension** | If the total is not cleared by the declared term, the facility extends with a fee set so the annualised cost stays what it was at signing. **The investor's expected yield is restored, not increased — nobody profits from the delay.** |
| **Backstop** | A hard deadline at **1.33 × the declared term** (6mo → ~8mo, 12mo → ~16mo) at which **everything still outstanding falls due in full**. It protects the investor by bounding exposure in time, and **the SME knows the date from the day they sign** — so show it. |
| **Ending** | Four outcomes: repaid, repaid early, settled at the backstop, or written down. |
| **Early repayment** | The benefit is **"no prepayment penalty"** — *not* "pay early, pay less". Paying early does **not** reduce the total. **Never sell it as a discount.** |
| **Revenue evidence** | Tax records — VAT declarations and e-invoices. **The signed electronic original only.** Upload UI must reject PDFs, screenshots and spreadsheets, and say why: those can be edited and prove nothing. |
| **Custody** | Funds sit with **custodial bank partners** (plural, unnamed). See §4. |
| **Not financed** | Gambling, alcohol or tobacco as a primary business, weapons/defence. Not negotiable, regardless of the numbers. |

---

## 3. What an investor must see before committing

Any listing, opportunity card or pre-commitment flow must surface **all** of:

- the score / rating
- the verified revenue behind it
- **how fresh that data is**
- the expected repayment pattern
- **the fees**
- concentration risks
- **the gaps in the data**
- what happens if the business underperforms — and that the **investor bears
  the loss**
- the **backstop date** (disclosed on every listing)

Two presentation rules:

- **Returns are ranges and scenarios. Never a single precise figure, never a
  guarantee.** "Expected", "target" and "projected" are fine; a bare number
  presented as the outcome is not.
- **Never present an expectation as a promise.** If a component can only render
  one number, render it with its range or an explicit "target, not guaranteed"
  qualifier.

---

## 4. The four mandatory phrasings

These are required in every screen, message, document and conversation. Each
one protects us from being read as performing a licensed activity, or from
committing to something unsigned.

| Never say | Always say | Because |
| --- | --- | --- |
| "chấm điểm doanh nghiệp / dòng tiền / tín dụng", "credit scoring", "credit rating" | **"Điểm doanh nghiệp và lãi suất tham khảo"** (business score and reference rate). Where a "we do not do this" list exists, add **"Không phải công ty xếp hạng tín nhiệm."** | We are not a credit rating company — a licensed activity. "Chấm điểm" reads as issuing a rating; "điểm tham khảo" reads as an input to the investor's own decision. |
| "FundLok never holds funds" / "FundLok không bao giờ giữ tiền" | **"FundLok is not the owner of the funds, has no right to draw on them for its own purposes, and holds only instruction rights within conditions the bank enforces."** | The first is a claim that can be broken. The second describes a verifiable mechanism. |
| Naming a specific custodial bank | **"custodial bank partners" / "đối tác ngân hàng lưu ký"** — plural and unnamed. | Nothing is signed. Naming a bank over-commits us and hands anyone a checkable, disprovable fact. |
| Naming or debating the regulatory framework we build to | **"We operate as a technology and arranger platform within reviewed legal boundaries."** | Raising it invites a question we do not need to open. Route specifics to the CEO. |

---

## 5. Never, on any surface

Stop and ask if a string is about to do any of these.

- **Promise a return.** No guaranteed yield, no "risk-free", no "protected
  capital". Targets, ranges and scenarios only.
- **Imply principal protection** — a reserve, a guarantee, an insurance-like
  safety net. We do not offer one.
- **Claim licensed status.** Not a bank, not a licensed lender. Watch for
  sentences that drift there, including reassurance copy.
- **Name a custodial bank.**
- **Use rating language** in any form (see §4).
- **Say approval is certain**, that no documents are needed, that there is no
  risk, or that everyone qualifies.
- **Use pressure in collections copy.** The first question on a missed payment
  is *what happened*, not *when will you pay*. Diagnose before escalating.
- **Show an internal figure** — costs, margins, pricing inputs, projections —
  on any external surface, even approximately, even to be helpful.
- **Improvise about legal structure.** "Let me get you a precise answer" is
  always acceptable and always better.

### The same message, badly and well

| Do not write | Write |
| --- | --- |
| "Safe SME yield, guaranteed double-digit returns, backed by our reserve fund." | "Risk-graded SME financing with monitored repayment. Returns are targets, not guarantees, and the investor bears the credit risk." |
| "No documents needed — approved in 24 hours, no collateral, no risk." | "A faster process built on documents you already have. No hard collateral, with risk managed through verified data, pricing and monitoring." |
| "We hold your money safely at [named bank] and never touch it." | "Funds sit with our custodial bank partners. FundLok does not own them and cannot draw on them — we hold instruction rights within conditions the bank enforces." |

---

## 6. Voice

| Trait | How it sounds | What to avoid |
| --- | --- | --- |
| Modern | Simple, direct, made for the web. | Corporate jargon, old banking language. |
| Serious | Specific about risk, data and process. | "Get rich", "guaranteed", "instant money". |
| SME-first | Cash flow, inventory, suppliers, payroll, seasons. | Talking only to investors; sounding extractive. |
| Investor-credible | Scenarios, ratings, data sources, disclosures. | Vague yield claims and precise fake numbers. |
| Institution-aware | Complementary, controlled, auditable. | Anti-bank framing, or anything that sounds like a loophole. |

Specific, evidenced and modest. **Describe mechanisms, not miracles.**

---

## 7. Bilingual & i18n

Per `fundlok-frontend`: every key goes into **both** `lib/i18n/en.json` and
`lib/i18n/vi.json`, and `{placeholder}` values are filled with `.replace()`.

On top of that, from the handbook:

- Bilingual when the audience is public and both sides matter — **one language
  leads, the other supports.** Never side by side competing for attention.
- **Vietnamese only** for local partners, SME communities, institutional
  audiences. **English only** for international investors and startup
  programmes.
- **§4 and §5 apply to the Vietnamese string as much as the English one.** A
  clean English key with "chấm điểm" in its Vietnamese twin is a violation.
  When adding or editing a score/rate/return/custody string, check both files.
- Keys carrying risk: anything under `dashboard.smeAnalytics.*`,
  `dashboard.analytics.*`, `dashboard.projectCard.*`,
  `dashboard.projectDetails.*`, `investment.*`, `faqPage.*`, and auth/marketing
  hero copy.

> Known outstanding issue: `dashboard.smeAnalytics.mockNotice` in `vi.json`
> contains "chấm điểm" (`lib/i18n/vi.json:903`). It needs the §4 phrasing.

---

## 8. Brand visuals

- **Dark grounds always** — black or very dark teal. Never place the brand on
  white or light backgrounds (marketing pages, hero sections, share images,
  decks, social).
- **Lime green is the signature accent**, and "Lok" is always set in it. Accent,
  **not body text**.
- The mark is the gradient swirl with the rising arrow: cash flow that cycles,
  a business that grows.
- Imagery: SMEs **as operators** — shops, invoices, dashboards, inventory,
  teams, factories. **Never** cash piles, luxury imagery, payday-loan
  aesthetics, or anything that reads as gambling.
- Premium, high-energy, credible — closer to a growth technology brand than a
  traditional bank. Not playful, not corporate blue.

In-app, this does **not** license hardcoded colours: keep using semantic theme
tokens (`bg-card`, `text-foreground`, `bg-primary`…) exactly as
`fundlok-frontend` requires, so dark mode holds.

---

## 9. Surfaces and who uses them

| Surface | Who | What it does |
| --- | --- | --- |
| SME portal | Business owners, their finance staff | Eligibility, document upload, application status, offer review, repayment view, support. |
| Investor portal | Investors | Onboarding, risk profile, opportunity browsing, commitment, portfolio and repayment reporting. |
| Admin / operations console | FundLok team | Application queue, document verification, rating, committee notes, listing approval, monitoring, servicing actions. |
| Partner portal | Accounting, POS, ERP, advisory partners | Referral submission, status tracking, performance, integration management. |
| Compliance console | Compliance & risk | Identity status, consent records, data access audit, disclosures, incident records. |

**Least-privilege by role** — these audiences do not see the same things. The
role a user picks at `/select-role` decides what renders; never widen a view
"for convenience". And never present the operations view's internal figures on
an SME or investor surface.

Facility lifecycle the UI reflects:
`application → underwriting → offer → listing & funding → disbursement →
active servicing → (watchlist | relief | extension) → repaid | repaid early |
settled at backstop | written down`. States are not skipped and not reversed.

---

## 10. Copy review checklist

Before a string, label or screen ships:

- [ ] No promised/guaranteed return, no principal protection, no "risk-free".
- [ ] Returns shown as ranges or scenarios, never a bare point figure.
- [ ] No rating/"chấm điểm" language — **in both `en.json` and `vi.json`**.
- [ ] No named custodial bank; custody described as instruction rights.
- [ ] No claim or implication of licensed/bank status.
- [ ] No regulatory-framework discussion.
- [ ] Investor-facing? All of §3 is present, backstop included.
- [ ] SME-facing? Framed as their outcome, and honest about the backstop date,
      the fixed total, and that early repayment saves no money.
- [ ] No internal cost/margin/projection figure on an external surface.
- [ ] If unsure about legal structure: escalate, don't phrase around it.
