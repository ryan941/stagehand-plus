import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

function getLocalVersion(): string {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, "..", "package.json"), "utf-8")
  );
  return pkg.version;
}

function getRemoteVersion(): string | null {
  try {
    const result = execSync("npm view stagehand-plus version", {
      encoding: "utf-8",
      timeout: 10000,
    });
    return result.trim();
  } catch {
    return null;
  }
}

export function showVersion(): void {
  const local = getLocalVersion();
  const remote = getRemoteVersion();

  console.log(`stagehand-plus v${local}`);
  if (remote && remote !== local) {
    console.log(`  update available: v${remote} (run: stagehand-plus --update)`);
  }
  process.exit(0);
}

export async function selfUpdate(): Promise<void> {
  const local = getLocalVersion();
  console.log(`[update] current version: v${local}`);

  const remote = getRemoteVersion();
  if (!remote) {
    console.error("[update] failed to check npm registry");
    process.exit(1);
  }

  if (remote === local) {
    console.log("[update] already up to date");
    process.exit(0);
  }

  console.log(`[update] new version available: v${remote}`);
  console.log("[update] updating...");

  try {
    execSync("npm install -g stagehand-plus@latest", {
      stdio: "inherit",
      timeout: 60000,
    });
    console.log(`[update] updated to v${remote}`);
  } catch {
    console.error("[update] failed. try manually: npm install -g stagehand-plus@latest");
    process.exit(1);
  }

  process.exit(0);
}
