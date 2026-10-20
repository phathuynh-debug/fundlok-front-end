---
name: git-workflow-and-versioning
description: >-
  FundLok frontend git and PR workflow: `production` and `preview` are Vercel
  deploy branches you never commit to directly, `TYPE/AREA/DESC` branch
  names, `type(scope): …` commit messages, the CI gates every PR must pass
  (i18n sort, Prettier, ESLint, build, Vitest, Playwright e2e; run locally
  with `bun run ci`), the automated `chore/trigger-vercel-deploy-*` PRs to
  leave alone, and linking the backend spec when a change consumes a new API.
  Use this whenever you are about to create a branch, stage or commit, write
  a commit message or PR description, merge or rebase, or resolve a conflict
  in this repo, even when the user only says "commit this", "make a branch"
  or "open a PR".
---

# Git Workflow — FundLok frontend

Pushing to `production` deploys the live site on Vercel, and pushing to
`preview` deploys the preview environment. This workflow keeps every change
small, reviewable and reversible before it gets there.

## Deploy branches

`.github/workflows/frontend-ci.yml` runs on every PR and on push to
`production`/`preview`:

| Job | Command (local equivalent) |
|---|---|
| i18n Check | `bun run i18n:check` (fix: `bun run i18n:sort`) |
| Lint Styling | `bun run lint:style` (fix: `bun run format`) |
| Lint | `bun run lint` (fix: `bun run lint:fix`) |
| Build | `bun run build` |
| Unit Tests | `bun run test` (Vitest) |
| e2e | `bun run test:e2e` (Playwright, uses the stub API) |

After all of them pass on a push, `enforce-author` checks that the latest
commit's author is the Vercel owner. If it isn't, the workflow itself
creates and rebase-merges a `chore/trigger-vercel-deploy-<branch>` PR. Those
branches and PRs are automation: don't base work on them, rebase onto them,
or "clean them up".

Because of that:

- Work on a topic branch cut from an up-to-date `production`. Don't commit to
  `production` or `preview` yourself. The next push ships it.
- Don't push, open, or merge a PR unless the human asks in this session. A
  merge to `production` is a production deploy.
- Never force-push `production` or `preview`.

## Branch names

`<type>/<area>/<short-kebab-description>`, matching the repo's history:

| type | examples |
|---|---|
| `feat` | `feat/dashboard/loan-application-stepper` |
| `fix` | `fix/auth/resend-verification-turnstile` |
| `chore` / `refactor` / `test` | `chore/deps/next-upgrade`, `test/kyc/phone-page-locale` |

`<area>` is the route segment or feature folder (`auth`, `dashboard`, `kyc`,
`i18n`, `landing`). Skip it only for genuinely repo-wide changes.

## Commit messages

Conventional Commits with a scope, written as the user-visible change:

```
fix(auth): send a Turnstile token with resend-verification
refactor(i18n): render locale switcher options as anchor tags for SEO crawlability
test(kyc): mock usePathname for the locale switcher on the phone page
```

Use the body for the *why*. Commit each working increment separately.

## Production hotfixes

A direct push to `production` isn't faster: it runs the same CI before
Vercel deploys. When the live site breaks:

- If a recent deploy caused it, suggest Vercel's instant rollback to the
  previous production deployment first.
- Fix on `fix/<area>/<desc>`, and add a Vitest or Playwright test that
  reproduces the bug in the same commit. A test deferred to "later" never
  gets written.

## Before every commit

The husky pre-commit hook runs `lint-staged` (`eslint --fix` on staged
JS/TS). It doesn't sort i18n, run Prettier or type-check, so before pushing:

```bash
git status && git diff --staged
git diff --staged | grep -inE "secret|api_key|token|BEGIN .*PRIVATE"
bun run ci            # all CI checks + auto-fix for i18n/format/lint (scripts/ci.ts)
```

At minimum, `npx tsc --noEmit` and `npx eslint <changed files>` must be clean
(AGENTS.md). If you added i18n strings, they must exist in **both**
`lib/i18n/en.json` and `vi.json`, sorted. `.env*` files never get staged.

## Cross-repo changes

The API contract lives in the backend repo's
`docs/specs/<module>/<feature>.md` (FundLok repo). If a frontend change
consumes a new or changed endpoint, link that spec in the PR. If the
endpoint or field doesn't exist in an ACCEPTED spec yet, say so instead of
inventing the shape in `lib/endpoints.ts`. Backend `app/auth/` and the
OpenAPI contract are shared between Phat and Edward and need both to agree.

## PR description

```markdown
## What / why
<one paragraph; screenshots for visual changes, light + dark>

**Backend spec:** FundLok docs/specs/<module>/<feature>.md | n/a
**Copy:** new/changed user-facing strings checked against `fundlok-domain` | none

## Checks
- `bun run ci` green (i18n, style, lint, types, unit, build)
- e2e: <ran `bun run test:e2e` | relying on CI>

## Not touched (intentionally)
- <adjacent issue noticed but out of scope>
```

## More

- `references/commit-discipline.md`: atomic commits, the save-point loop,
  worktrees for parallel agents, and `git bisect`/`blame`.
