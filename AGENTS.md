<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Follow this repo's conventions

Before writing or editing **any** frontend code in this repo — adding a
feature, calling an API, creating a component, wiring state, adding i18n
strings, styling, or touching auth/routing — consult the **`fundlok-frontend`**
skill (`.claude/skills/fundlok-frontend/SKILL.md`). It documents the project's
data flow and patterns so new code matches what's already here instead of
reinventing conventions.

The load-bearing rules, in one breath (the skill has the detail and the why):

- **Data flow is one direction:** `lib/endpoints.ts` → `services/*.service.ts`
  → `hooks/use-*.ts` (React Query) → components. Components never call
  `apiClient`/`fetch` directly.
- **Server state → React Query** (keyed by a `*Keys` factory). **Local UI state
  → `useState` + React Context** — never put server data in `useState`, and
  don't use React Query for ephemeral UI state.
- **Share local state with a Context provider**, not prop-drilling, once a
  feature splits into many sub-components (see
  `app/dashboard/_components/loan-application/`).
- **i18n:** add every key to **both** `lib/i18n/en.json` and `vi.json`; fill
  `{placeholder}` via `.replace()`.
- **Styling:** use semantic theme tokens (`bg-card`, `text-foreground`,
  `bg-primary`…). **Never hardcode `bg-white`/`text-black` for surfaces** — it
  breaks dark mode.
- **Auth:** httpOnly cookies via the `/api` proxy (no frontend tokens); users
  pick a role at `/select-role` after login (`role` is optional on `User`).
- **Verify before done:** `npx tsc --noEmit` and `npx eslint <changed files>`
  must both be clean.

# Follow the handbook

Before writing or editing **any user-facing copy** — an i18n string, label,
tooltip, badge, chart caption, FAQ answer, marketing page, error message — or
any screen that presents a **rate, score, return, risk level, fee, repayment
schedule or fund custody**, consult the **`fundlok-domain`** skill
(`.claude/skills/fundlok-domain/SKILL.md`). It encodes the FundLok Handbook v3:
what the product actually is and what the UI is permitted to say about it.

The rules that get people in trouble:

- **Never promise a return.** Targets, ranges and scenarios only — never a bare
  point figure, never "guaranteed", "risk-free" or "protected capital".
- **Never use rating language** ("chấm điểm", "credit score") — in **either**
  `en.json` **or** `vi.json`. Say "điểm doanh nghiệp và lãi suất tham khảo".
- **Never name a custodial bank** — "custodial bank partners", plural and
  unnamed — and never say "FundLok never holds funds"; say we hold _instruction
  rights within bank-enforced conditions_.
- **Never imply we are a bank or a licensed lender**, and never discuss our
  regulatory framework externally.
- **Investor listings must show** the score, the verified revenue behind it, how
  fresh that data is, the fees, concentration risks, the data gaps, the
  **backstop date**, and that the investor bears the loss.
- **Early repayment is "no prepayment penalty", never a discount** — the total
  repayable is fixed at signing.

`fundlok-frontend` governs **how** the code is written; `fundlok-domain` governs
**what it may say**. Both apply.

## Workflow skills available

Beyond `fundlok-frontend` (repo conventions) and `fundlok-domain` (handbook
rules), `.claude/skills/` also holds a set
of general **engineering-workflow** skills vendored from
[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) — process
guidance for the whole lifecycle. Reach for the relevant one when the task fits;
notably:

- Building/changing UI → `frontend-ui-engineering`
- Implementing logic or fixing a bug → `test-driven-development`,
  `incremental-implementation`
- Before merging / checking CI → `ci-check-and-fix`, `code-review-and-quality`,
  `code-simplification`, `security-and-hardening`
- Debugging → `debugging-and-error-recovery`
- Planning a larger change → `spec-driven-development`,
  `planning-and-task-breakdown`

`fundlok-frontend` always wins on **how this repo is built**, `fundlok-domain`
on **what we are allowed to say**; these cover **how to work**. See
`.claude/skills/VENDORED.md` for the full list and provenance.
