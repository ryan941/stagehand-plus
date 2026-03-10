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

// Handle --init flag
if (process.argv.includes("--init")) {
  initConfig();
  process.exit(0);
}

import express from "express";
import { SessionManager } from "./session-manager";
import { createSessionRouter } from "./routes/sessions";
import { createHealthRouter } from "./routes/health";
import { createSearchRouter } from "./routes/search";
import { createScrapeRouter } from "./routes/scrape";

const PORT = parseInt(process.env.PORT || "9090", 10);

const app = express();
app.use(express.json());

const manager = new SessionManager();

// Routes
app.use("/health", createHealthRouter(manager));
app.use("/v1/sessions", createSessionRouter(manager));
app.use("/v1/search", createSearchRouter());
app.use("/v1/scrape", createScrapeRouter());

// Graceful shutdown
async function shutdown() {
  console.log("\n[server] shutting down...");
  await manager.endAllSessions();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

app.listen(PORT, () => {
  console.log(`[server] stagehand-plus listening on http://localhost:${PORT}`);
  console.log(`[server] health: http://localhost:${PORT}/health`);
  console.log(`[server] config: ${CONFIG_FILE}`);
});
