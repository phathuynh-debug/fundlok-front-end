---
name: ci-check-and-fix
description: Automatically run all CI pipeline checks (i18n sorting, styling/Prettier, ESLint, TypeScript type checking, unit tests, build) and auto-fix any issues found using the CLI tool.
---

# CI Check and Auto-Fix Skill

This skill automates running all continuous integration (CI) pipeline checks for the `fundlok-frontend` repository using the unified CI CLI tool (`scripts/ci.ts`), automatically fixing any styling, formatting, i18n, or linting issues, and guiding the resolution of any remaining errors.

## CLI Commands Quick Reference

- **Run all CI checks**:

  ```bash
  bun run ci
  # or
  bun run ci:check
  ```

- **Auto-fix and run all CI checks**:
  ```bash
  bun run ci:fix
  ```

## Workflow Instructions

When activated (or when the user prompts to check CI or auto-fix CI), follow these steps in order:

### Step 1: Run Auto-Fixers & Pipeline Checks via CLI

Execute the unified CI CLI in auto-fix mode:

```bash
bun run ci:fix
```

This command automatically:

1. Sorts all i18n translation JSON keys.
2. Formats all files with Prettier code styling.
3. Applies ESLint auto-fixes.
4. Executes all 6 CI pipeline checks:
   - i18n Sorting Check
   - Code Styling Check (Prettier)
   - ESLint Linting Check
   - TypeScript Type Check
   - Vitest Unit Tests Check
   - Next.js Production Build Check

### Step 2: Resolve Remaining Failures

If any check fails:

1. Inspect the CLI output for exact file names and error tracebacks.
2. Fix the underlying root causes (e.g., fix TypeScript type mismatches, unhandled errors, or failing test assertions).
3. Re-run `bun run ci:check` to verify clean exit with code 0.
