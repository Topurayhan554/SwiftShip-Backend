import type { Server } from "http";
import app from "./app";
import { prisma } from "./app/lib/prisma";
import config from "./app/config";
import { redisClient } from "./app/lib/redis";
import { transporter } from "./app/lib/nodemailer";
import {
  seedSuperAdmin,
  seedTesterAdmin,
  seedTesterCourier,
} from "./app/utils/seed";
import { cancelStalePendingParcels } from "./app/lib/cron";

const PORT = config.port;

let server: Server;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");

    await redisClient.connect();
    console.log("Redis Connected Successfully");

    // await transporter.verify();
    // console.log("Nodemailer Connected Successfully");

    await seedSuperAdmin();
    await seedTesterAdmin();
    await seedTesterCourier();

    // await cancelStalePendingParcels();

    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

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
