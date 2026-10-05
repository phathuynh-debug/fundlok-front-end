// Deploys party/ (the live-notification relay) to our own Cloudflare account as
// a Worker with a SQLite-backed Durable Object, using Wrangler.
//
// (The PartyKit CLI cannot do this on a current Cloudflare account: it asks for
// key-value-backed Durable Objects, which Cloudflare no longer creates.)
//
// Runs at the end of `npm run build`, so it rides on the Vercel production
// deploy and reads its configuration from Vercel's own environment variables.
// It never makes the frontend build fail: the relay is an enhancement and the
// bell falls back to polling, so a problem here is logged loudly and the build
// carries on.
//
// Which relay a build deploys:
//   Vercel Production build                 -> worker "fundlok-notifications"
//   Vercel Preview build of the `preview`   -> worker "fundlok-notifications-staging"
//     branch (staging)                         (its own Durable Objects and secrets)
//   anything else (PR previews, local)      -> skipped
// The two workers share no state and no secrets, so staging can never reach
// production rooms.
//
// Needs these in Vercel (Production for the first, Preview for the second; use
// different hostnames and different secrets in each):
//   NEXT_PUBLIC_PARTYKIT_HOST   the hostname the relay is served on, no scheme
//                               (e.g. realtime.fundlok.com) -- also what the app
//                               connects to, so there is one value, not two.
//                               The domain must be a zone in the same Cloudflare
//                               account; Wrangler attaches it and creates the
//                               DNS record and certificate.
//   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN   ("Edit Cloudflare Workers")
//   PARTYKIT_JWT_SECRET, PARTYKIT_PUBLISH_SECRET  same values as the backend's
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const partyDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "party",
);
const tag = "[partykit]";

const isProduction = process.env.VERCEL_ENV === "production";
const isStaging =
  process.env.VERCEL_ENV === "preview" &&
  process.env.VERCEL_GIT_COMMIT_REF === "preview";
if (!isProduction && !isStaging) {
  console.log(
    `${tag} skipped: only the production build and the "preview" branch deploy the relay`,
  );
  process.exit(0);
}
const target = isProduction ? "production" : "staging";

const required = [
  "NEXT_PUBLIC_PARTYKIT_HOST",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "PARTYKIT_JWT_SECRET",
  "PARTYKIT_PUBLISH_SECRET",
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.warn(
    `${tag} skipped (${target}): missing ${missing.join(", ")} in Vercel's ${isProduction ? "Production" : "Preview"} env`,
  );
  process.exit(0);
}

const run = (args) =>
  spawnSync("npm", args, { cwd: partyDir, stdio: "inherit", env: process.env });

// Secrets travel in a private temp file, not on the command line, so they never
// appear in a process listing or the build log.
const secretsDir = mkdtempSync(path.join(tmpdir(), "partykit-"));
const secretsFile = path.join(secretsDir, "secrets.json");
let deploy;
try {
  writeFileSync(
    secretsFile,
    JSON.stringify({
      PARTYKIT_JWT_SECRET: process.env.PARTYKIT_JWT_SECRET,
      PARTYKIT_PUBLISH_SECRET: process.env.PARTYKIT_PUBLISH_SECRET,
    }),
  );
  chmodSync(secretsFile, 0o600);

  const install = run(["ci", "--no-audit", "--no-fund"]);
  deploy =
    install.status === 0
      ? run([
          "exec",
          "--",
          "wrangler",
          "deploy",
          // An empty --env targets the top-level (production) config explicitly.
          "--env",
          isStaging ? "staging" : "",
          // Test hook: compile and check without uploading anything.
          ...(process.env.PARTYKIT_DEPLOY_DRY_RUN === "1" ? ["--dry-run"] : []),
          "--domain",
          process.env.NEXT_PUBLIC_PARTYKIT_HOST,
          "--secrets-file",
          secretsFile,
        ])
      : install;
} finally {
  rmSync(secretsDir, { recursive: true, force: true });
}

if (deploy.status === 0) {
  console.log(
    `${tag} deployed ${target} relay to ${process.env.NEXT_PUBLIC_PARTYKIT_HOST}`,
  );
} else {
  console.warn(
    `${tag} DEPLOY FAILED for ${target} (see log above). The frontend build continues; the bell uses polling until this succeeds.`,
  );
}
process.exit(0);
