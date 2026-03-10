import { Router, Request, Response } from "express";
import { SessionManager } from "../session-manager";

export function createHealthRouter(manager: SessionManager): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      activeSessions: manager.getActiveSessions(),
      uptime: process.uptime(),
    });
  });

  return router;
}
