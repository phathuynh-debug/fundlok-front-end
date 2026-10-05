import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // The E2E suite builds to its own dist dir (next.config.ts) so it never
    // clobbers a running dev server; that output is not source either.
    ".next-e2e/**",
    // Playwright traces, videos and reports.
    "e2e/.artifacts/**",
    "playwright-report/**",
    "blob-report/**",
    "test-results/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".claude/**",
    ".agents/**",
    // Separate package with its own tsconfig-less Workers runtime.
    "party/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
