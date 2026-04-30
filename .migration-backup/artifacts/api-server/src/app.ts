import express, { type Express } from "express";
import cors from "cors";
import * as pinoHttpModule from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { seed } from "./seed.js";

const pinoHttp: any = (pinoHttpModule as any).default ?? (pinoHttpModule as any).pinoHttp ?? pinoHttpModule;

const app: Express = express();

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

let seedPromise: Promise<void> | null = null;
app.use((req, _res, next) => {
  if (!seedPromise) {
    seedPromise = seed().catch((err) => {
      logger.error({ err }, "Seed failed");
    });
  }
  seedPromise.finally(() => next());
});

if (process.env.NODE_ENV !== "production") {
  seedPromise = seed().catch((err) => logger.error({ err }, "Seed failed"));
}

export default app;
