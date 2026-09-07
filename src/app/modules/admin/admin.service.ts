import {
  ParcelStatus,
  PaymentStatus,
  Role,
} from "../../../generated/prisma/enums";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { IAuditLogFilters, IDashboardStats } from "./admin.interface";

const getDashboardStats = async (): Promise<IDashboardStats> => {
  const [
    totalUsers,
    totalCustomers,
    totalCouriers,
    totalParcels,
    parcelStatusGroups,
    paymentAggregate,
    totalPayments,
    paidPayments,
    pendingPayments,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: Role.CUSTOMER, deletedAt: null } }),
    prisma.user.count({ where: { role: Role.COURIER, deletedAt: null } }),
    prisma.parcel.count({ where: { deletedAt: null } }),
    prisma.parcel.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { status: true },
    }),
    prisma.payment.aggregate({
      where: { status: PaymentStatus.PAID },
      _sum: { amount: true },
    }),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
    prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
  ]);

  const parcelsByStatus: Record<string, number> = {};
  for (const group of parcelStatusGroups) {
    parcelsByStatus[group.status] = group._count.status;
  }

  return {
    totalUsers,
    totalCustomers,
    totalCouriers,
    totalParcels,
    parcelsByStatus,
    totalRevenue: paymentAggregate._sum.amount ?? 0,
    totalPayments,
    paidPayments,
    pendingPayments,
  };
};

const getAuditLogs = async (query: IQuery & IAuditLogFilters) => {
  const limit = query.limit ? Number(query.limit) : 20;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: Record<string, unknown>[] = [];

  if (query.entityType) {
    andConditions.push({ entityType: query.entityType });
  }

  if (query.actorId) {
    andConditions.push({ actorId: query.actorId });
  }

  const whereCondition = andConditions.length ? { AND: andConditions } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereCondition,
      take: limit,
      skip,
      orderBy: { [sortBy]: sortOrder },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where: whereCondition }),
  ]);

  return {
    data: logs,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const AdminService = {
  getDashboardStats,
  getAuditLogs,
};
