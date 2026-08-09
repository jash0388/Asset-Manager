import { Router } from "express";

const router = Router();

const versionPayload = {
  status: "ok",
  latestVersionCode: 4,
  latestVersionName: "1.3.0",
  downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
  forceUpdate: false,
  releaseNotes: "New Update: Complete student name & roll number visibility fix!",
  appVersion: {
    latestVersionCode: 4,
    latestVersionName: "1.3.0",
    downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
    forceUpdate: false,
    releaseNotes: "New Update: Complete student name & roll number visibility fix!"
  }
};

router.get("/healthz", (_req: any, res: any) => {
  res.json(versionPayload);
});

router.get("/version", (_req: any, res: any) => {
  res.json(versionPayload);
});

router.get("/app-version", (_req: any, res: any) => {
  res.json(versionPayload);
});

router.get("/app-version-info", (_req: any, res: any) => {
  res.json(versionPayload);
});

export default router;
