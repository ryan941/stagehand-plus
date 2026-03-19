import { Stagehand } from "@browserbasehq/stagehand";
import { v4 as uuidv4 } from "uuid";

export interface SessionConfig {
  modelName: string;
  modelApiKey: string;
  modelBaseUrl?: string;
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

    const headless = config.headless !== undefined ? config.headless : true;

    const modelName = config.modelName || process.env.MODEL_NAME || "gpt-4o";
    const apiKey = config.modelApiKey || process.env.MODEL_API_KEY || "";

    const modelConfig: Record<string, unknown> = {
      modelName,
      apiKey,
    };
    if (config.modelBaseUrl) {
      modelConfig.baseURL = config.modelBaseUrl;
    }

    const stagehand = new Stagehand({
      env: "LOCAL",
      model: modelConfig as any,
      localBrowserLaunchOptions: {
        ...config.browser?.launchOptions,
        headless,
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
    try {
      await session.stagehand.close();
    } catch (err) {
      console.warn(`[session] close error: ${(err as Error).message}`);
    }
    this.sessions.delete(sessionId);
    console.log(`[session] ended: ${sessionId}`);
  }

  async endAllSessions(): Promise<void> {
    const ids = Array.from(this.sessions.keys());
    await Promise.allSettled(ids.map((id) => this.endSession(id)));
  }

  getActiveSessions(): number {
    return this.sessions.size;
  }
}
