import fs from "node:fs";
import path from "node:path";

const I18N_DIR = path.join(process.cwd(), "lib", "i18n");
const isCheckMode = process.argv.includes("--check");

function sortObject<T>(obj: T): T {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).sort();

  for (const key of keys) {
    sorted[key] = sortObject((obj as Record<string, unknown>)[key]);
  }

  return sorted as T;
}

function processI18nFiles() {
  if (!fs.existsSync(I18N_DIR)) {
    console.error(`Directory not found: ${I18N_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(I18N_DIR).filter((f) => f.endsWith(".json"));
  let hasErrors = false;

  for (const file of files) {
    const filePath = path.join(I18N_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");

    try {
      const parsed = JSON.parse(content);
      const sorted = sortObject(parsed);
      const formatted = JSON.stringify(sorted, null, 2) + "\n";

      if (isCheckMode) {
        if (content !== formatted) {
          console.error(`❌ i18n file is not sorted: lib/i18n/${file}`);
          hasErrors = true;
        } else {
          console.log(`✅ i18n file is correctly sorted: lib/i18n/${file}`);
        }
      } else {
        fs.writeFileSync(filePath, formatted, "utf-8");
        console.log(`✨ Sorted i18n file: lib/i18n/${file}`);
      }
    } catch (err) {
      console.error(`Error parsing JSON file ${file}:`, err);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    if (isCheckMode) {
      console.error(
        "\nRun 'bun run i18n:sort' to automatically sort i18n JSON files.",
      );
    }
    process.exit(1);
  }
}

processI18nFiles();
