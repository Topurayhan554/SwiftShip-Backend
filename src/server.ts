import type { Server } from "http";
import app from "./app";
import config from "./app/config";
import { prisma } from "./app/lib/prisma";

let server: Server;

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    server = app.listen(config.port, () => {
      console.log(`🚀 SwiftShip API running on port ${config.port}`);
      console.log(
        `📍 Base URL: http://localhost:${config.port}${config.api_version}`,
      );
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

main();

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
