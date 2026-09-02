import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import env from "./config/env";
// import router from "./routes";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import notFound from "./middlewares/notFound";
import router from "./routes/router";
import { generalLimiter } from "./app/middlewares/rateLimiter";

const app: Application = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN,
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
    message: "Courier & Logistics Management API is running",
    data: {
      version: env.API_VERSION,
      environment: env.NODE_ENV,
    },
  });
});

// API routes
app.use(env.API_VERSION, router);

// 404 handler
app.use(notFound);

app.use(globalErrorHandler);

export default app;
