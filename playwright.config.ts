import { defineConfig, devices } from "@playwright/test";

// Ports deliberately off the defaults so a suite run never collides with a dev
// server on :3000 or a local FastAPI on :8000.
const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3100);
const STUB_API_PORT = Number(process.env.E2E_STUB_API_PORT ?? 8100);
const baseURL = `http://127.0.0.1:${APP_PORT}`;
/** Shared between the app build and the stub, which asserts what it received. */
const E2E_BACKEND_SECRET = "e2e-backend-secret-not-a-real-key";

const appEnv = {
  // Point the /api rewrite AND proxy.ts's server-side lookups at the stub.
  API_URL: `http://127.0.0.1:${STUB_API_PORT}`,
  NEXT_PUBLIC_APP_URL: baseURL,
  // The app's own escape hatch (hooks/use-turnstile.ts) — with it set, the
  // widget is not rendered and the form carries a "mock-token", so the login
  // flow is testable without automating a CAPTCHA. This is a throwaway build:
  // the flag is NEXT_PUBLIC_, so it bakes into the bundle and must never be set
  // for a deployed build.
  NEXT_PUBLIC_DISABLE_TURNSTILE: "true",
  // Keep the E2E production build out of `.next`, so a run never corrupts a
  // dev server that happens to be running (see next.config.ts).
  NEXT_DIST_DIR: ".next-e2e",
  // A known value, so a spec can assert the proxy actually attaches
  // X-Backend-Secret rather than trusting that it does. Server-only, and this
  // is a throwaway build — it never reaches a bundle or a deployment.
  BACKEND_SECRET_KEY: E2E_BACKEND_SECRET,
  PORT: String(APP_PORT),
};

export default defineConfig({
  testDir: "./e2e/tests",
  // Explicit so Playwright can never pick up a Vitest *.test.ts file.
  testMatch: "**/*.spec.ts",
  // Every spec seeds its own cookie and the stub holds no mutable state, so
  // files are safe to run in parallel.
  fullyParallel: true,
  // A test that only passes on a retry is a flaky test; failing the run on a
  // stray `test.only` keeps that from reaching main.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"], ["html", { open: "never" }]],
  outputDir: "./e2e/.artifacts",

  use: {
    baseURL,
    // Artifacts only for failures — a green run should leave nothing behind.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Vietnamese is the production market, but the app defaults to English and
    // the locale is a cookie, so tests assert against EN and switch explicitly.
    locale: "en-US",
    timezoneId: "Asia/Ho_Chi_Minh",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // The identity photos are taken live (there is no upload), so the
        // browser needs a camera. Chromium's fake device streams a test
        // pattern, and the second flag answers the permission prompt. A spec
        // that wants the camera blocked or missing stubs getUserMedia itself.
        permissions: ["camera"],
        launchOptions: {
          args: [
            "--use-fake-device-for-media-stream",
            "--use-fake-ui-for-media-stream",
          ],
        },
      },
    },
  ],

  // Two servers: the stub API first, then the app pointed at it. Playwright
  // waits for both to answer before the first test runs.
  webServer: [
    {
      command: `bun e2e/stub-api/server.ts`,
      port: STUB_API_PORT,
      env: {
        PORT: String(STUB_API_PORT),
        BACKEND_SECRET_KEY: E2E_BACKEND_SECRET,
      },
      // Never reused, even locally. It starts in milliseconds, so reuse buys
      // nothing — and an orphaned stub from an interrupted run would silently
      // serve stale fixtures, which cost real debugging time once already. With
      // reuse off, a leftover process fails loudly as "port in use" instead:
      //   lsof -ti:8100 | xargs kill
      reuseExistingServer: false,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      // Production build, not `next dev`: `proxy.ts` hard-guards the
      // SKIP_VERIFICATION_GATES bypass on NODE_ENV !== "production", so only a
      // production build exercises the verification gates the suite asserts.
      // CI builds this once in its own step and sets E2E_SKIP_BUILD=1 so the
      // server starts immediately.
      command: process.env.E2E_SKIP_BUILD
        ? "bun run start"
        : "bun run build && bun run start",
      port: APP_PORT,
      env: appEnv,
      reuseExistingServer: !process.env.CI,
      // A cold `next build` is the long pole here.
      timeout: 5 * 60 * 1000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
