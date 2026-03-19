import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { SessionManager } from "../session-manager";

function headerString(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || "";
  return val || "";
}

export function createSessionRouter(manager: SessionManager): Router {
  const router = Router();

  // POST /v1/sessions/start
  router.post("/start", async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const modelApiKey =
        headerString(req.headers["x-model-api-key"]) || process.env.MODEL_API_KEY || "";
      const modelBaseUrl =
        headerString(req.headers["x-model-base-url"]) || body.modelBaseUrl || process.env.MODEL_BASE_URL || "";

      const { sessionId } = await manager.startSession({
        modelName: body.modelName || process.env.MODEL_NAME || "gpt-4o",
        modelApiKey,
        modelBaseUrl: modelBaseUrl || undefined,
        headless: body.browser?.launchOptions?.headless,
        browser: body.browser,
        systemPrompt: body.systemPrompt,
        domSettleTimeoutMs: body.domSettleTimeoutMs,
        selfHeal: body.selfHeal,
      });

      res.json({
        success: true,
        data: {
          available: true,
          sessionId,
          cdpUrl: null,
        },
      });
    } catch (err: any) {
      console.error("[start] error:", err);
      res.status(500).json({
        success: false,
        data: { error: err.message },
      });
    }
  });

  // POST /v1/sessions/:sessionId/navigate
  router.post("/:sessionId/navigate", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId as string;
      const stagehand = manager.getSession(sessionId);
      if (!stagehand) {
        res.status(404).json({ success: false, data: { error: "session not found" } });
        return;
      }

      const { url, options } = req.body;
      if (!url) {
        res.status(400).json({ success: false, data: { error: "url is required" } });
        return;
      }

      const waitUntil = options?.waitUntil || "load";
      const timeout = options?.timeout;

      const page = stagehand.context.activePage();
      if (!page) {
        res.status(500).json({ success: false, data: { error: "no active page" } });
        return;
      }

      await page.goto(url, {
        waitUntil: waitUntil as "load" | "domcontentloaded" | "networkidle",
        ...(timeout ? { timeoutMs: timeout } : {}),
      });

      res.json({
        success: true,
        data: {
          result: null,
          actionId: uuidv4(),
        },
      });
    } catch (err: any) {
      console.error("[navigate] error:", err);
      res.status(500).json({ success: false, data: { error: err.message } });
    }
  });

  // POST /v1/sessions/:sessionId/act
  router.post("/:sessionId/act", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId as string;
      const stagehand = manager.getSession(sessionId);
      if (!stagehand) {
        res.status(404).json({ success: false, data: { error: "session not found" } });
        return;
      }

      const { input, options } = req.body;

      // input can be a string or an action object
      const instruction = typeof input === "string" ? input : input?.description || "";

      const actOptions: Record<string, unknown> = {};
      if (options?.timeout) actOptions.timeout = options.timeout;
      if (options?.variables) actOptions.variables = options.variables;
      if (options?.model) {
        const model =
          typeof options.model === "string"
            ? { modelName: options.model }
            : options.model;
        actOptions.model = model;
      }

      const result = await stagehand.act(instruction, actOptions as any);

      res.json({
        success: true,
        data: {
          result: {
            actionDescription: result.actionDescription || instruction,
            actions: result.actions || [],
            message: result.message || "Action completed",
            success: result.success,
          },
          actionId: uuidv4(),
        },
      });
    } catch (err: any) {
      console.error("[act] error:", err);
      res.status(500).json({ success: false, data: { error: err.message } });
    }
  });

  // POST /v1/sessions/:sessionId/observe
  router.post("/:sessionId/observe", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId as string;
      const stagehand = manager.getSession(sessionId);
      if (!stagehand) {
        res.status(404).json({ success: false, data: { error: "session not found" } });
        return;
      }

      const { instruction } = req.body;

      const actions = await stagehand.observe(
        instruction || "Find all interactive elements on the page"
      );

      res.json({
        success: true,
        data: {
          result: actions.map((a) => ({
            description: a.description || "",
            selector: a.selector || "",
            method: a.method || "",
            arguments: a.arguments || [],
          })),
          actionId: uuidv4(),
        },
      });
    } catch (err: any) {
      console.error("[observe] error:", err);
      res.status(500).json({ success: false, data: { error: err.message } });
    }
  });

  // POST /v1/sessions/:sessionId/extract
  router.post("/:sessionId/extract", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId as string;
      const stagehand = manager.getSession(sessionId);
      if (!stagehand) {
        res.status(404).json({ success: false, data: { error: "session not found" } });
        return;
      }

      const { instruction, schema } = req.body;
      const inst = instruction || "Extract data from the page";

      let result: unknown;
      if (schema) {
        // extract(instruction, schema) for structured extraction
        result = await (stagehand as any).extract(inst, schema);
      } else {
        // extract(instruction) returns { extraction: string }
        result = await stagehand.extract(inst);
      }

      res.json({
        success: true,
        data: {
          result,
          actionId: uuidv4(),
        },
      });
    } catch (err: any) {
      console.error("[extract] error:", err);
      res.status(500).json({ success: false, data: { error: err.message } });
    }
  });

  // POST /v1/sessions/:sessionId/agentExecute
  router.post("/:sessionId/agentExecute", async (req: Request, res: Response) => {
    try {
      const sessionId = req.params.sessionId as string;
      const stagehand = manager.getSession(sessionId);
      if (!stagehand) {
        res.status(404).json({ success: false, data: { error: "session not found" } });
        return;
      }

      const { executeOptions, agentConfig } = req.body;
      const instruction = executeOptions?.instruction || "";
      const maxSteps = executeOptions?.maxSteps;

      const agentOpts: Record<string, unknown> = {};
      if (agentConfig?.model) {
        const model =
          typeof agentConfig.model === "string"
            ? { modelName: agentConfig.model }
            : agentConfig.model;
        agentOpts.model = model;
      }

      const agent = stagehand.agent(agentOpts as any);
      const result = await agent.execute({
        instruction,
        ...(maxSteps ? { maxSteps } : {}),
      } as any);

      res.json({
        success: true,
        data: {
          result: {
            actions: (result as any).actions || [],
            completed: (result as any).completed ?? true,
            message: (result as any).message || "Agent completed",
            success: (result as any).success ?? true,
            metadata: (result as any).metadata || {},
            usage: (result as any).usage || {},
          },
        },
      });
    } catch (err: any) {
      console.error("[agentExecute] error:", err);
      res.status(500).json({ success: false, data: { error: err.message } });
    }
  });

  // POST /v1/sessions/:sessionId/end
  router.post("/:sessionId/end", async (req: Request, res: Response) => {
    try {
      await manager.endSession(req.params.sessionId as string);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[end] error:", err);
      res.status(500).json({ success: false, data: { error: err.message } });
    }
  });

  return router;
}
