import httpStatus from "http-status";
import type { PaymentWhereInput } from "../../../generated/prisma/models";
import { PaymentGateway, PaymentStatus } from "../../../generated/prisma/enums";
import type { IQuery } from "../../interfaces";
import { createBkashPayment, executeBkashPayment } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middlewares/auth";
import { AppError } from "../../utils/AppError";
import config from "../../config";
import { IInitiatePaymentPayload } from "./payment.interface";

const initiateBkashPayment = async (
  user: RequestUser,
  payload: IInitiatePaymentPayload,
) => {
  const parcel = await prisma.parcel.findFirst({
    where: { id: payload.parcelId, deletedAt: null },
    include: { payment: true },
  });

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  if (parcel.senderId !== user.userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only pay for your own parcels",
    );
  }

  if (parcel.payment && parcel.payment.status === PaymentStatus.PAID) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This parcel has already been paid for",
    );
  }

  const bkashResponse = await createBkashPayment({
    amount: parcel.fee,
    merchantInvoiceNumber: parcel.trackingId,
    callbackURL: config.bkash_callback_url,
  });

  const payment = await prisma.payment.upsert({
    where: { parcelId: parcel.id },
    update: {
      amount: parcel.fee,
      gateway: PaymentGateway.BKASH,
      status: PaymentStatus.PENDING,
      sessionId: bkashResponse.paymentID,
    },
    create: {
      parcelId: parcel.id,
      userId: user.userId,
      amount: parcel.fee,
      gateway: PaymentGateway.BKASH,
      status: PaymentStatus.PENDING,
      sessionId: bkashResponse.paymentID,
    },
  });

  return {
    payment,
    bkashURL: bkashResponse.bkashURL,
    paymentID: bkashResponse.paymentID,
  };
};

const handleBkashCallback = async (paymentID: string, status: string) => {
  const payment = await prisma.payment.findFirst({
    where: { sessionId: paymentID },
    include: { parcel: true },
  });

  if (!payment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Payment record not found for this session",
    );
  }

  if (status !== "success") {
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });

    return { success: false, payment: updated };
  }

  const executeResult = await executeBkashPayment(paymentID);

  if (executeResult.transactionStatus !== "Completed") {
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });

    return { success: false, payment: updated };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        transactionId: executeResult.trxID,
        paidAt: new Date(),
      },
    });

    if (payment.parcel.status === "PENDING") {
      await tx.parcel.update({
        where: { id: payment.parcel.id },
        data: { status: "APPROVED" },
      });

      await tx.parcelStatusLog.create({
        data: {
          parcelId: payment.parcel.id,
          status: "APPROVED",
          note: "Auto-approved after successful bKash payment",
          changedById: payment.userId,
        },
      });
    }

    return updatedPayment;
  });

  return { success: true, payment: result };
};

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
  initiateBkashPayment,
  handleBkashCallback,
  getAllPayments,
  getMyPayments,
  getSinglePayment,
};
