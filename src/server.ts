import { Server } from "http";
import app from "./app";
import env from "./config/env";
import prisma from "./config/prisma";

let server: Server;

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    server = app.listen(env.PORT, () => {
      console.log(`🚀 Courier & Logistics API running on port ${env.PORT}`);
      console.log(
        `📍 Base URL: http://localhost:${env.PORT}${env.API_VERSION}`,
      );
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

main();

// Graceful shutdown & crash safety
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection detected, shutting down...", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception detected, shutting down...", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  if (server) server.close();
});
