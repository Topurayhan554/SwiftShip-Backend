import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import config from "./app/config";
import router from "./routes/router";
import { notFound } from "./app/middlewares/notFound";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";

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

// Health check
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Courier & Logistics Management API is running",
    data: {
      version: config.api_version,
      environment: config.node_env,
    },
  });
});

// API routes
app.use(config.api_version, router);

// 404 handler
app.use(notFound);

// Global error handler (must be last)
app.use(globalErrorHandler);

export default app;
