import { Router, type Request, type Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router = Router();

router.get("/healthz", (_req: any, res: any) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/app-version", (_req: any, res: any) => {
  res.json({
    latestVersionCode: 2,
    latestVersionName: "1.1.0",
    downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
    forceUpdate: false,
    releaseNotes: "New Update: Visual Tick/Cross attendance buttons & roll number sorting!"
  });
});

export default router;
