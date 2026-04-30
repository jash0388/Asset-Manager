import express from "express";
import cors from "cors";
import * as pinoHttpModule from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { seed } from "./seed.js";

const pinoHttp: any = (pinoHttpModule as any).default ?? (pinoHttpModule as any).pinoHttp ?? pinoHttpModule;

const app = express();

app.use(cors({
  origin: ["https://qr-attendance-app-eight.vercel.app", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

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

app.use("/api", router);

// seed().catch((err) => logger.error({ err }, "Seed failed"));

export default app;
