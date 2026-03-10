import { Router, Request, Response } from "express";
import Firecrawl from "@mendable/firecrawl-js";

function headerString(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || "";
  return val || "";
}

export function createScrapeRouter(): Router {
  const router = Router();

  // POST /v1/scrape
  router.post("/", async (req: Request, res: Response) => {
    try {
      const apiKey =
        headerString(req.headers["x-firecrawl-api-key"]) ||
        process.env.FIRECRAWL_API_KEY ||
        "";

      if (!apiKey) {
        res.status(400).json({
          success: false,
          data: {
            error:
              "FireCrawl API key required. Set x-firecrawl-api-key header or FIRECRAWL_API_KEY env var.",
          },
        });
        return;
      }

      const firecrawl = new Firecrawl({ apiKey });

      const {
        url,
        formats,
        onlyMainContent,
        includeTags,
        excludeTags,
        waitFor,
        timeout,
        mobile,
        jsonOptions,
      } = req.body;

      if (!url) {
        res.status(400).json({
          success: false,
          data: { error: "url is required" },
        });
        return;
      }

      const options: Record<string, unknown> = {};
      if (formats) options.formats = formats;
      else options.formats = ["markdown"];
      if (onlyMainContent !== undefined)
        options.onlyMainContent = onlyMainContent;
      if (includeTags) options.includeTags = includeTags;
      if (excludeTags) options.excludeTags = excludeTags;
      if (waitFor) options.waitFor = waitFor;
      if (timeout) options.timeout = timeout;
      if (mobile !== undefined) options.mobile = mobile;
      if (jsonOptions) options.json = jsonOptions;

      const doc = await firecrawl.scrape(url, options as any);

      res.json({
        success: true,
        data: {
          markdown: (doc as any).markdown || null,
          html: (doc as any).html || null,
          rawHtml: (doc as any).rawHtml || null,
          links: (doc as any).links || null,
          metadata: (doc as any).metadata || null,
          json: (doc as any).json || null,
        },
      });
    } catch (err: any) {
      console.error("[scrape] error:", err);
      res.status(500).json({ success: false, data: { error: err.message } });
    }
  });

  return router;
}
