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

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

const allowedOrigins = (config.cors_origin ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

if (config.node_env !== "production") {
  allowedOrigins.push("http://localhost:3000", "http://127.0.0.1:3000");
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(
  `${config.api_version}/parcels/stripe/webhook`,
  express.raw({ type: "application/json" }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(generalLimiter);

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
