import express from "express";
import cors from "cors";
import * as pinoHttpModule from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { seed } from "./seed.js";

const pinoHttp: any = (pinoHttpModule as any).default ?? (pinoHttpModule as any).pinoHttp ?? pinoHttpModule;

const app = express();

app.use((req: any, res: any, next: any) => {
  const p = (req.originalUrl || req.url || "").split("?")[0].toLowerCase();
  if (p === "/api/version" || p === "/api/app-version" || p === "/api/healthz" || p === "/api/check-update" || p === "/version" || p === "/app-version") {
    res.json({
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
    });
    return;
  }
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use((req: any, _res: any, next: any) => {
  if (req.body && typeof req.body === "object") {
    req._vercelBody = req.body;
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req: any, _res: any, next: any) => {
  if ((!req.body || Object.keys(req.body).length === 0) && req._vercelBody) {
    req.body = req._vercelBody;
  }
  next();
});

app.use((req: any, _res: any, next: any) => {
  const original = req.headers["x-forwarded-uri"] || req.headers["x-matched-path"];
  if (original && typeof original === "string") {
    req.url = original;
  }
  next();
});

app.use("/api", router);
app.use(router);

// Express JSON Error Handler (must have 4 arguments so Express knows it's an error handler)
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("API Express Error:", err);
  const status = typeof err.status === "number" ? err.status : 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

// Catch-all route to handle unmatched paths with clean JSON response instead of HTML 404
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    headers: req.headers
  });
});

// seed().catch((err) => logger.error({ err }, "Seed failed"));

export default app;
