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

## Not vendored — ours

- **`fundlok-frontend/`** — project-specific conventions and data flow for
  this repo. This is the one to consult before any frontend work here; see the
  pointer in the repo root `AGENTS.md`.

To update the vendored set later, re-clone the source repo at a newer commit
and re-copy. To remove any skill, delete its folder.
