import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Any alternate Next.js dist dirs (e.g., .next-e2e, .next-perf)
    ".next-*/**",
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
    "vbsec-reports/**",
    ".vbsec-tmp/**",
    // Separate package with its own tsconfig-less Workers runtime.
    "party/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
