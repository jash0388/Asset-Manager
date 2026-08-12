import { Router } from "express";

const router = Router();

const versionPayload = {
  status: "ok",
  latestVersionCode: 8,
  latestVersionName: "1.7.0",
  downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
  forceUpdate: true,
  releaseNotes: "New Update: Settings & Logout button, Locked class badges, smoother scrolling!",
  appVersion: {
    latestVersionCode: 8,
    latestVersionName: "1.7.0",
    downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
    forceUpdate: true,
    releaseNotes: "New Update: Settings & Logout button, Locked class badges, smoother scrolling!"
  }
};

router.get(["/healthz", "/version", "/app-version", "/app-version-info", "/index", "/index.js", "/"], (_req: any, res: any) => {
  res.json(versionPayload);
});

export default router;
