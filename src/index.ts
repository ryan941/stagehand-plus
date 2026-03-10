#!/usr/bin/env node
import dotenv from "dotenv";
import { resolve } from "path";

// Load .env from current working directory (where the user runs the command)
dotenv.config({ path: resolve(process.cwd(), ".env") });

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
  console.log(`[server] heybee-stagehand listening on http://localhost:${PORT}`);
  console.log(`[server] health: http://localhost:${PORT}/health`);
});
