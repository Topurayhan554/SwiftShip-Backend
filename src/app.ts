import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import config from "./app/config";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFound } from "./app/middlewares/notFound";
import { generalLimiter } from "./app/middlewares/rateLimiter";
import router from "./routes/router";

const app: Application = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.cors_origin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(generalLimiter);

// Health check
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "SwiftShip Management API is running",
    data: {
      version: config.api_version,
      environment: config.node_env,
    },
  });
});

app.use(config.api_version, router);

app.use(notFound);

app.use(globalErrorHandler);

export default app;
