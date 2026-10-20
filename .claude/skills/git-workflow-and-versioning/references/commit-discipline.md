# Commit discipline (general practice)

Generic git habits that sit underneath the FundLok-specific rules in `SKILL.md`.

## Atomic commits, one concern each
- Each commit does one logical thing: implement a slice, check it, commit, move on.
- Keep refactors, formatting and behaviour changes in separate commits (ideally separate PRs).
- Size guide: ~100 changed lines is easy to review, ~300 is fine for one logical change, and ~1000 should be split.

## The save-point loop
```
change → tsc + eslint + vitest green? → commit → next change
                └─ red → `git restore` to the last commit → investigate
```

## Change summary (end of a task)
```
CHANGES MADE:
- app/dashboard/_components/loan-application/StepReview.tsx: show backstop date
THINGS I DIDN'T TOUCH (intentionally):
- components/ui/badge.tsx: hardcoded bg-white, separate dark-mode fix
POTENTIAL CONCERNS:
- New i18n key added to en.json and vi.json; VI copy needs a native check
```

## Worktrees for parallel agent work
```bash
git worktree add ../Frontendfundlok-kyc fix/kyc/phone-page-locale
git worktree remove ../Frontendfundlok-kyc   # after merge
```
Each worktree needs its own `bun install`. Run dev servers on different ports.

## Git as a debugger
```bash
git bisect start; git bisect bad HEAD; git bisect good <sha>
git log --oneline -- app/dashboard/
git log -S "apiClient" --oneline
git blame lib/endpoints.ts
```

## Generated files
Commit `bun.lock` (and `package-lock.json` while both exist). Never commit `.next/`, `node_modules/`, `playwright-report/`, `test-results/` or `.env*`.
