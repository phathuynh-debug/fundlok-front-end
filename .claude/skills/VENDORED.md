# Vendored skills

Most skills in this directory are vendored from the open-source
[`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills)
repository (MIT licensed — see `agent-skills.LICENSE`).

- **Source:** https://github.com/addyosmani/agent-skills
- **Commit:** `54c5adf`
- Each skill was copied as a self-contained folder; the shared `references/`
  and `agents/` files those skills depend on were copied into each skill that
  needs them so paths resolve.

These are **generic engineering-workflow** skills (TDD, code review, shipping,
security, etc.) — process guidance that applies to any project.

## Vendored, then rewritten for FundLok

- **`git-workflow-and-versioning/`**: rewritten 2026-10-20 around this
  repo's `production`/`preview` Vercel deploy branches, CI gates (`bun run
  ci`), branch/commit conventions and cross-repo spec links. Don't overwrite
  it when re-syncing from upstream.

## Vendored from other sources

- **`web-performance-optimization/`**: from
  [`secondsky/claude-skills`](https://github.com/secondsky/claude-skills)
  (`plugins/web-performance-optimization/skills/web-performance-optimization`,
  commit `ba827ce`, MIT; its `LICENSE` is in the folder). Copied as-is on
  2026-10-21. Its examples are generic React Router/webpack/nginx; on this
  Next.js + Vercel app prefer `next/dynamic`, `next/image` and Vercel Speed
  Insights, and don't add its cache-first service worker (it would cache
  signed-in `/api` responses on shared devices).

## Not vendored — ours

- **`fundlok-frontend/`** — project-specific conventions and data flow for
  this repo. This is the one to consult before any frontend work here; see the
  pointer in the repo root `AGENTS.md`.

To update the vendored set later, re-clone the source repo at a newer commit
and re-copy. To remove any skill, delete its folder.
