import express from "express";
import cors from "cors";
import * as pinoHttpModule from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { seed } from "./seed.js";

const pinoHttp: any = (pinoHttpModule as any).default ?? (pinoHttpModule as any).pinoHttp ?? pinoHttpModule;

const app = express();

const ALLOWED_ORIGINS = [
  "https://qr-attendance-app-eight.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
];

app.use(cors({
  origin: (origin, callback) => {
    // Always allow requests without origin or from any vercel / localhost / valid origin
    if (!origin || origin.includes("vercel.app") || origin.includes("localhost") || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight
app.options(/.*/, (req, res) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all(["/api/auth/app-version", "/api/app-version"], (_req, res) => {
  res.json({
    latestVersionCode: 4,
    latestVersionName: "1.3.0",
    downloadUrl: "https://qr-attendance-app-eight.vercel.app/FacultyApp.apk",
    forceUpdate: false,
    releaseNotes: "New Update: Complete student name & roll number visibility fix!"
  });
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
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// seed().catch((err) => logger.error({ err }, "Seed failed"));

export default app;
