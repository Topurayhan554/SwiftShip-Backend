import cron from "node-cron";
import { ParcelStatus } from "../../generated/prisma/enums";
import { prisma } from "./prisma";

export const cancelStalePendingParcels = async () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const cancelledParcels = await prisma.parcel.updateMany({
        where: {
          status: ParcelStatus.PENDING,
          createdAt: {
            lt: oneHourAgo,
          },
        },
        data: {
          status: ParcelStatus.CANCELLED,
        },
      });

      if (cancelledParcels.count > 0) {
        console.log(`
        Cron: Auto-cancelled ${cancelledParcels.count} stale pending parcel(s) older than 1 hour
        `);
      }
    } catch (error) {
      console.log("Cron: Failed to auto-cancel stale pending parcels", error);
    }
    console.log("Stale Pending Parcel Cancel cron schedule (every 10 minutes)");
  });
};
