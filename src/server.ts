import express from "express";
import { writeFileSync, unlinkSync } from "fs";
import { SessionManager } from "./session-manager";
import { createSessionRouter } from "./routes/sessions";
import { createHealthRouter } from "./routes/health";
import { createSearchRouter } from "./routes/search";
import { createScrapeRouter } from "./routes/scrape";
import { CONFIG_FILE, PID_FILE } from "./config";

export function startServer(): void {
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
  function removePidFile() {
    try { unlinkSync(PID_FILE); } catch {}
  }

  async function shutdown() {
    console.log("\n[server] shutting down...");
    removePidFile();
    await manager.endAllSessions();
    process.exit(0);
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  app.listen(PORT, () => {
    writeFileSync(PID_FILE, process.pid.toString());
    console.log(`[server] stagehand-plus listening on http://localhost:${PORT}`);
    console.log(`[server] health: http://localhost:${PORT}/health`);
    console.log(`[server] config: ${CONFIG_FILE}`);
  });
}
