import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";

interface ICreateAuditLogPayload {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Prisma.InputJsonValue;
}

export const createAuditLog = async (payload: ICreateAuditLogPayload) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: payload.actorId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        meta: payload.meta,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
