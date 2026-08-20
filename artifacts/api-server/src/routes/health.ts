import { Router } from "express";

const router = Router();

const versionPayload = {
  status: "ok",
  latestVersionCode: 8,
  latestVersionName: "1.8.0",
  downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
  forceUpdate: false,
  releaseNotes: "v1.8.0: New Stitch UI + Incharge login (4-digit keys), dark navy design!",
  appVersion: {
    latestVersionCode: 8,
    latestVersionName: "1.8.0",
    downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
    forceUpdate: false,
    releaseNotes: "v1.8.0: New Stitch UI + Incharge login (4-digit keys), dark navy design!"
  }
};

router.get(["/healthz", "/version", "/app-version", "/app-version-info", "/index", "/index.js", "/"], (_req: any, res: any) => {
  res.json(versionPayload);
});

export default router;
