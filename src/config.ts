import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CONFIG_DIR = join(homedir(), ".stagehand-plus");
const CONFIG_FILE = join(CONFIG_DIR, "settings.json");
const PID_FILE = join(CONFIG_DIR, "stagehand-plus.pid");

export interface Settings {
  port?: number;
  modelName?: string;
  modelApiKey?: string;
  tavilyApiKey?: string;
  firecrawlApiKey?: string;
}

/**
 * Load settings from ~/.stagehand-plus/settings.json
 * These serve as the lowest-priority defaults.
 * Priority: request headers > .env / env vars > settings.json
 */
export function loadSettings(): Settings {
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as Settings;
  } catch (err) {
    console.warn(`[config] failed to read ${CONFIG_FILE}:`, (err as Error).message);
    return {};
  }
}

/**
 * Apply settings as process.env defaults (won't override existing values)
 */
export function applySettingsToEnv(settings: Settings): void {
  const map: Record<string, string | undefined> = {
    PORT: settings.port?.toString(),
    MODEL_NAME: settings.modelName,
    MODEL_API_KEY: settings.modelApiKey,
    TAVILY_API_KEY: settings.tavilyApiKey,
    FIRECRAWL_API_KEY: settings.firecrawlApiKey,
  };

  for (const [key, value] of Object.entries(map)) {
    if (value && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

/**
 * Initialize config directory with a template settings.json
 */
export function initConfig(): void {
  if (existsSync(CONFIG_FILE)) {
    console.log(`[config] ${CONFIG_FILE} already exists`);
    return;
  }

  mkdirSync(CONFIG_DIR, { recursive: true });

  const template: Settings = {
    port: 9090,
    modelName: "gpt-4o",
    modelApiKey: "",
    tavilyApiKey: "",
    firecrawlApiKey: "",
  };

  writeFileSync(CONFIG_FILE, JSON.stringify(template, null, 2) + "\n");
  console.log(`[config] created ${CONFIG_FILE}`);
  console.log("[config] edit it with your API keys, then restart the server");
}

export { CONFIG_DIR, CONFIG_FILE, PID_FILE };
