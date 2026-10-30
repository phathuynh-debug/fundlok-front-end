# Patched deepmerge

Upstream `deepmerge` 4.3.1 (the latest release, 2023) has a prototype-poisoning
bug, GHSA-gcqx-w48m-w2h4, with no fixed version. It reaches us only through the
`shadcn` CLI (a dev dependency). `package.json` → `overrides` points every
`deepmerge` in the tree at this folder.

The change, in `dist/cjs.js` and `dist/umd.js`: `mergeObject()` now skips the
keys `__proto__` and `constructor` in both loops. Before, merging into a
non-object target (e.g. `deepmerge(null, JSON.parse('{"__proto__":{...}}'))`)
let `__proto__` through and replaced the returned object's prototype.

Remove this folder and the override once upstream (or shadcn) ships a fix:
check `npm view deepmerge version` and the advisory page.
