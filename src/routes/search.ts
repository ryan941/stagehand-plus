import { Router, Request, Response } from "express";
import { tavily } from "@tavily/core";

function headerString(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || "";
  return val || "";
}

export function createSearchRouter(): Router {
  const router = Router();

  // POST /v1/search
  router.post("/", async (req: Request, res: Response) => {
    try {
      const apiKey =
        headerString(req.headers["x-tavily-api-key"]) ||
        process.env.TAVILY_API_KEY ||
        "";

      if (!apiKey) {
        res.status(400).json({
          success: false,
          data: {
            error:
              "Tavily API key required. Set x-tavily-api-key header or TAVILY_API_KEY env var.",
          },
        });
        return;
      }

      const client = tavily({ apiKey });

      const {
        query,
        searchDepth,
        topic,
        maxResults,
        includeAnswer,
        includeRawContent,
        includeDomains,
        excludeDomains,
        timeRange,
      } = req.body;

      if (!query) {
        res.status(400).json({
          success: false,
          data: { error: "query is required" },
        });
        return;
      }

      const result = await client.search(query, {
        ...(searchDepth && { searchDepth }),
        ...(topic && { topic }),
        ...(maxResults && { maxResults }),
        ...(includeAnswer !== undefined && { includeAnswer }),
        ...(includeRawContent !== undefined && { includeRawContent }),
        ...(includeDomains && { includeDomains }),
        ...(excludeDomains && { excludeDomains }),
        ...(timeRange && { timeRange }),
      });

      res.json({
        success: true,
        data: {
          query: result.query,
          answer: result.answer || null,
          responseTime: result.responseTime,
          results: result.results.map((r) => ({
            title: r.title,
            url: r.url,
            content: r.content,
            score: r.score,
            rawContent: r.rawContent || null,
          })),
        },
      });
    } catch (err: any) {
      console.error("[search] error:", err);
      res.status(500).json({ success: false, data: { error: err.message } });
    }
  });

  return router;
}
