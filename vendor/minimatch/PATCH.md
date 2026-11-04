# Vendored `minimatch` 3.1.5 with `GHSA-g3hv-75wg-m249` hardening

Upstream `minimatch` 3.x (`3.1.5`, ISC license) is required by ESLint 9 and its plugins (`@eslint/config-array`, `@eslint/eslintrc`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react`), which expect the CommonJS v3 default function export (`const minimatch = require('minimatch')`).

GitHub Advisory [`GHSA-g3hv-75wg-m249`](https://github.com/advisories/GHSA-g3hv-75wg-m249) flags all registry versions `<11.0.1` for potential Denial of Service via `globParts` / globstar amplification.

Changes over upstream `minimatch@3.1.5`:
1. Deduplicate `globSet` and bound expanded pattern rows by `braceExpandMax` (default `100,000`) in `Minimatch.prototype.make`.
2. Collapse adjacent `**` segments in `globParts` during `make()` so repeated `/**/**` sequences cannot amplify `bodySegments`.
3. Track visited `(bodyIndex, fileIndex)` pairs via a `tried` `Set` in `Minimatch.prototype._matchGlobStarBodySections` (backported from `minimatch@11.0.4`) to prevent exponential backtracking across globstar sections.
