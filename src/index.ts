#!/usr/bin/env node
import { loadSettings, applySettingsToEnv, initConfig, CONFIG_FILE } from "./config";
import dotenv from "dotenv";
import { resolve } from "path";

// Config loading priority (highest to lowest):
// 1. Per-request headers
// 2. .env file in current working directory
// 3. ~/.stagehand-plus/settings.json
// 4. Environment variables

// Load global settings first (lowest priority)
const settings = loadSettings();
applySettingsToEnv(settings);

// Then load .env which overrides global settings
dotenv.config({ path: resolve(process.cwd(), ".env") });

// Handle CLI flags
const args = process.argv.slice(2);

if (args.includes("--init")) {
  initConfig();
  process.exit(0);
}

if (args.includes("--update") || args.includes("--version") || args.includes("-v")) {
  import("./updater").then((m) => {
    if (args.includes("--update")) {
      m.selfUpdate();
    } else {
      m.showVersion();
    }
  });
} else {
  // Start server only when no CLI-only flags are present
  import("./server").then((m) => m.startServer());
}
