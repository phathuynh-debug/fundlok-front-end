import { spawnSync } from "node:child_process";

interface Step {
  name: string;
  cmd: string;
  args: string[];
  fixCmd?: { cmd: string; args: string[] };
}

const isFixMode = process.argv.includes("--fix");

const fixSteps: { name: string; cmd: string; args: string[] }[] = [
  { name: "Auto-sort i18n JSON keys", cmd: "bun", args: ["run", "i18n:sort"] },
  { name: "Auto-format code (Prettier)", cmd: "bun", args: ["run", "format"] },
  { name: "Auto-fix ESLint issues", cmd: "bun", args: ["run", "lint:fix"] },
];

const checkSteps: Step[] = [
  {
    name: "i18n Sorting Check",
    cmd: "bun",
    args: ["run", "i18n:check"],
  },
  {
    name: "Code Styling Check (Prettier)",
    cmd: "bun",
    args: ["run", "lint:style"],
  },
  {
    name: "ESLint Linting Check",
    cmd: "bun",
    args: ["run", "lint"],
  },
  {
    name: "TypeScript Type Check",
    cmd: "npx",
    args: ["tsc", "--noEmit"],
  },
  {
    name: "Unit Tests Check",
    cmd: "bun",
    args: ["run", "test"],
  },
  {
    name: "Next.js Build Check",
    cmd: "bun",
    args: ["run", "build"],
  },
];

function runCommand(
  cmd: string,
  args: string[],
): { success: boolean; output: string } {
  const result = spawnSync(cmd, args, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
  });

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const combined = (stdout + "\n" + stderr).trim();

  return {
    success: result.status === 0,
    output: combined,
  };
}

function main() {
  console.log("==========================================");
  console.log(
    `🚀 FundLok CI Runner ${isFixMode ? "(Auto-Fix Mode)" : "(Check Mode)"}`,
  );
  console.log("==========================================\n");

  if (isFixMode) {
    console.log("🛠️  Running auto-fixers first...\n");
    for (const fixStep of fixSteps) {
      process.stdout.write(`  • ${fixStep.name}... `);
      const res = runCommand(fixStep.cmd, fixStep.args);
      if (res.success) {
        console.log("✅ Done");
      } else {
        console.log("⚠️ Failed to auto-fix automatically");
      }
    }
    console.log("\n------------------------------------------\n");
  }

  const results: { name: string; success: boolean; output: string }[] = [];
  let totalFailed = 0;

  for (let i = 0; i < checkSteps.length; i++) {
    const step = checkSteps[i];
    process.stdout.write(`[${i + 1}/${checkSteps.length}] ${step.name}... `);

    const res = runCommand(step.cmd, step.args);
    if (res.success) {
      console.log("✅ PASSED");
      results.push({ name: step.name, success: true, output: res.output });
    } else {
      console.log("❌ FAILED");
      totalFailed++;
      results.push({ name: step.name, success: false, output: res.output });
    }
  }

  console.log("\n==========================================");
  console.log("📊 CI Check Summary");
  console.log("==========================================");

  for (const res of results) {
    console.log(` ${res.success ? "✅" : "❌"} ${res.name}`);
  }

  if (totalFailed > 0) {
    console.log(`\n❌ ${totalFailed} check(s) failed.\n`);
    console.log("------------------------------------------");
    console.log("🔍 Detailed Error Output:");
    console.log("------------------------------------------");

    for (const res of results) {
      if (!res.success) {
        console.log(`\n--- [FAILED] ${res.name} ---`);
        console.log(res.output || "No output captured.");
      }
    }

    if (!isFixMode) {
      console.log(
        "\n💡 Tip: Run 'bun run ci:fix' to automatically fix formatting, styling, and i18n issues.",
      );
    }

    process.exit(1);
  } else {
    console.log(`\n🎉 All ${checkSteps.length} CI checks passed cleanly!\n`);
    process.exit(0);
  }
}

main();
