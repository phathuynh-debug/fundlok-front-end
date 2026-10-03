// Deploys party/ (the live-notification relay) to our own Cloudflare account.
//
// Runs at the end of `npm run build`, so it rides on the Vercel production
// deploy and reads its configuration from Vercel's own environment variables
// (nothing to enter in GitHub). It never makes the frontend build fail: the
// relay is an enhancement and the bell falls back to polling, so a problem here
// is logged loudly and the build carries on.
//
// Needs these in Vercel's Production environment:
//   NEXT_PUBLIC_PARTYKIT_HOST   the hostname the relay is served on, no scheme
//                               (e.g. realtime.fundlok.com) -- also what the app
//                               connects to, so there is one value, not two
//   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN   ("Edit Cloudflare Workers")
//   PARTYKIT_JWT_SECRET, PARTYKIT_PUBLISH_SECRET  same values as the backend's
import { spawnSync } from "node:child_process";
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

const install = run(["ci", "--no-audit", "--no-fund"]);
const deploy =
  install.status === 0
    ? run([
        "exec",
        "--",
        "partykit",
        "deploy",
        "--domain",
        process.env.NEXT_PUBLIC_PARTYKIT_HOST,
        "--var",
        `PARTYKIT_JWT_SECRET=${process.env.PARTYKIT_JWT_SECRET}`,
        `PARTYKIT_PUBLISH_SECRET=${process.env.PARTYKIT_PUBLISH_SECRET}`,
      ])
    : install;

if (deploy.status === 0) {
  console.log(`${tag} deployed to ${process.env.NEXT_PUBLIC_PARTYKIT_HOST}`);
} else {
  console.warn(
    `${tag} DEPLOY FAILED (see log above). The frontend build continues; the bell uses polling until this succeeds.`,
  );
}
process.exit(0);
