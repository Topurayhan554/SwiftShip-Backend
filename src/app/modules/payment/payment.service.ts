import httpStatus from "http-status";
import type { PaymentWhereInput } from "../../../generated/prisma/models";
import { PaymentStatus, PaymentGateway } from "../../../generated/prisma/enums";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middlewares/auth";
import { AppError } from "../../utils/AppError";

const getMyPayments = async (query: IQuery, user: RequestUser) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: PaymentWhereInput[] = [{ userId: user.userId }];

  const payments = await prisma.payment.findMany({
    where: { AND: andConditions },
    take: limit,
    skip,
    orderBy: { [sortBy]: sortOrder },
    include: {
      parcel: {
        select: { trackingId: true, deliveryAddress: true, status: true },
      },
    },
  });

  const total = await prisma.payment.count({ where: { AND: andConditions } });

  return {
    data: payments,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getAllPayments = async (query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder ? query.sortOrder : "desc";

  const andConditions: PaymentWhereInput[] = [];

  if (query.status) {
    andConditions.push({ status: query.status as PaymentStatus });
  }

  if (query.gateway) {
    andConditions.push({ gateway: query.gateway as PaymentGateway });
  }

  const payments = await prisma.payment.findMany({
    where: { AND: andConditions },
    take: limit,
    skip,
    orderBy: { [sortBy]: sortOrder },
    include: {
      parcel: {
        select: { trackingId: true, deliveryAddress: true, status: true },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const total = await prisma.payment.count({ where: { AND: andConditions } });

  return {
    data: payments,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getSinglePayment = async (paymentId: string, user: RequestUser) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      parcel: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment Not Found");
  }

  if (
    payment.userId !== user.userId &&
    user.role !== "ADMIN" &&
    user.role !== "SUPER_ADMIN"
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You Are Not Allowed To View This Payment",
    );
  }

  return payment;
};

export const PaymentServices = {
  getAllPayments,
  getMyPayments,
  getSinglePayment,
};
