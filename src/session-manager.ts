import { Stagehand } from "@browserbasehq/stagehand";
import { v4 as uuidv4 } from "uuid";

export interface SessionConfig {
  modelName: string;
  modelApiKey: string;
  headless?: boolean;
  browser?: {
    type?: string;
    launchOptions?: {
      headless?: boolean;
      executablePath?: string;
      viewport?: { width: number; height: number };
      args?: string[];
      [key: string]: unknown;
    };
  };
  systemPrompt?: string;
  domSettleTimeoutMs?: number;
  selfHeal?: boolean;
}

interface ManagedSession {
  id: string;
  stagehand: Stagehand;
  createdAt: Date;
}

export class SessionManager {
  private sessions = new Map<string, ManagedSession>();

  async startSession(config: SessionConfig): Promise<{ sessionId: string }> {
    const sessionId = uuidv4();

    const headless = false; // always show browser for debugging

    const modelName = config.modelName || process.env.MODEL_NAME || "gpt-4o";
    const apiKey = config.modelApiKey || process.env.MODEL_API_KEY || "";

    const stagehand = new Stagehand({
      env: "LOCAL",
      model: {
        modelName,
        apiKey,
      },
      localBrowserLaunchOptions: {
        ...config.browser?.launchOptions,
        headless, // force override for debugging
      },
      domSettleTimeout: config.domSettleTimeoutMs,
      selfHeal: config.selfHeal,
      systemPrompt: config.systemPrompt,
    });

    await stagehand.init();

    this.sessions.set(sessionId, {
      id: sessionId,
      stagehand,
      createdAt: new Date(),
    });

    console.log(`[session] started: ${sessionId} (model: ${modelName})`);
    return { sessionId };
  }

  getSession(sessionId: string): Stagehand | null {
    return this.sessions.get(sessionId)?.stagehand ?? null;
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Keep browser open for debugging — only remove session tracking
    this.sessions.delete(sessionId);
    console.log(`[session] ended (browser kept open): ${sessionId}`);
  }

  async endAllSessions(): Promise<void> {
    const ids = Array.from(this.sessions.keys());
    await Promise.allSettled(ids.map((id) => this.endSession(id)));
  }

  getActiveSessions(): number {
    return this.sessions.size;
  }
}
