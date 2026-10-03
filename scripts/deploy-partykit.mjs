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
// Needs these in Vercel's Production environment:
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

if (process.env.VERCEL_ENV !== "production") {
  console.log(`${tag} skipped: not a Vercel production build`);
  process.exit(0);
}

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
    `${tag} skipped: missing ${missing.join(", ")} in Vercel's Production env`,
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
  console.log(`${tag} deployed to ${process.env.NEXT_PUBLIC_PARTYKIT_HOST}`);
} else {
  console.warn(
    `${tag} DEPLOY FAILED (see log above). The frontend build continues; the bell uses polling until this succeeds.`,
  );
}
process.exit(0);
