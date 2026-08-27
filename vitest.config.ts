import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules",
      ".next",
      ".next-e2e",
      "dist",
      ".claude",
      // Playwright owns e2e/ — its specs import @playwright/test and
      // cannot run under Vitest. `bun run test:e2e` runs them.
      "e2e/**",
    ],
  },
  resolve: {
    // Mirror tsconfig "@/*" -> "./*" so imports resolve in tests.
    alias: { "@": root },
  },
});
