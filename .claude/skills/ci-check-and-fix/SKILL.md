---
name: ci-check-and-fix
description: Automatically run all CI pipeline checks (i18n sorting, styling/Prettier, ESLint, TypeScript type checking, unit tests, build) and auto-fix any issues found.
---

# CI Check and Auto-Fix Skill

This skill automates running all continuous integration (CI) pipeline checks for the `fundlok-frontend` repository, automatically fixing any styling, formatting, i18n, or linting issues, and guiding the resolution of any remaining errors.

## Workflow Instructions

When activated (or when the user prompts to check CI or auto-fix CI), follow these steps in order:

### Step 1: Run Auto-Fixers
Run the automated repair commands first to eliminate formatting, styling, and i18n sorting errors automatically:

1. **Auto-Sort i18n JSON Keys**:
   ```bash
   bun run i18n:sort
   ```
2. **Auto-Format Code with Prettier**:
   ```bash
   bun run format
   ```
3. **Auto-Fix ESLint Issues**:
   ```bash
   bun run lint:fix
   ```

### Step 2: Run CI Validation Pipeline Checks
Run each CI pipeline check to ensure full compliance:

1. **i18n Sorting Check**:
   ```bash
   bun run i18n:check
   ```
2. **Code Styling Check (Prettier)**:
   ```bash
   bun run lint:style
   ```
3. **ESLint Linting Check**:
   ```bash
   bun run lint
   ```
4. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
5. **Unit Tests Check**:
   ```bash
   bun run test
   ```
6. **Next.js Production Build Check**:
   ```bash
   bun run build
   ```

### Step 3: Resolve Remaining Failures
If any check in Step 2 fails:
1. Inspect the command output for exact file names and error tracebacks.
2. Fix the underlying root causes (e.g., fix TypeScript type mismatches, unhandled errors, or failing test assertions).
3. Re-run the failing check to verify clean exit with code 0.
