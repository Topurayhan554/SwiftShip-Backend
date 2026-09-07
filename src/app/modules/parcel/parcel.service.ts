import httpStatus from "http-status";
import { ParcelStatus, Role } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  ALLOWED_STATUS_TRANSITIONS,
  PARCEL_SEARCHABLE_FIELDS,
} from "./parcel.constant";
import type {
  IAssignCourierPayload,
  ICreateParcelPayload,
  IParcelFilters,
  IUpdateParcelPayload,
  IUpdateParcelStatusPayload,
} from "./parcel.interface";
import { calculateParcelFee, generateTrackingId } from "../../utils/parcel";

const createParcel = async (
  senderId: string,
  payload: ICreateParcelPayload,
) => {
  const fee = calculateParcelFee(payload.weightKg);

  const parcel = await prisma.parcel.create({
    data: {
      trackingId: generateTrackingId(),
      senderId,
      parcelType: payload.parcelType,
      description: payload.description,
      weightKg: payload.weightKg,
      fee,
      pickupAddress: payload.pickupAddress,
      pickupLat: payload.pickupLat,
      pickupLng: payload.pickupLng,
      deliveryAddress: payload.deliveryAddress,
      deliveryLat: payload.deliveryLat,
      deliveryLng: payload.deliveryLng,
      receiverName: payload.receiverName,
      receiverPhone: payload.receiverPhone,
      status: ParcelStatus.PENDING,
    },
  });

  await prisma.parcelStatusLog.create({
    data: {
      parcelId: parcel.id,
      status: ParcelStatus.PENDING,
      note: "Parcel booked by customer",
      changedById: senderId,
    },
  });

  return parcel;
};

const getAllParcels = async (
  filters: IParcelFilters,
  page: number,
  limit: number,
  requester: { userId: string; role: Role },
) => {
  const { status, parcelType, searchTerm } = filters;

  const andConditions: Record<string, unknown>[] = [{ deletedAt: null }];

  if (requester.role === Role.CUSTOMER) {
    andConditions.push({ senderId: requester.userId });
  } else if (requester.role === Role.COURIER) {
    andConditions.push({ courierId: requester.userId });
  }

  if (status) andConditions.push({ status });
  if (parcelType) andConditions.push({ parcelType });

  if (searchTerm) {
    andConditions.push({
      OR: PARCEL_SEARCHABLE_FIELDS.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  const whereCondition = { AND: andConditions };
  const skip = (page - 1) * limit;

  const [parcels, total] = await Promise.all([
    prisma.parcel.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, email: true, phone: true } },
        courier: {
          select: { id: true, name: true, phone: true, vehicleType: true },
        },
      },
    }),
    prisma.parcel.count({ where: whereCondition }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: parcels,
  };
};

const getParcelById = async (
  id: string,
  requester: { userId: string; role: Role },
) => {
  const parcel = await prisma.parcel.findFirst({
    where: { id, deletedAt: null },
    include: {
      sender: { select: { id: true, name: true, email: true, phone: true } },
      courier: {
        select: { id: true, name: true, phone: true, vehicleType: true },
      },
      statusLogs: { orderBy: { createdAt: "asc" } },
      payment: true,
    },
  });

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  const isOwner = parcel.senderId === requester.userId;
  const isAssignedCourier = parcel.courierId === requester.userId;
  const isAdmin =
    requester.role === Role.ADMIN || requester.role === Role.SUPER_ADMIN;

  if (!isOwner && !isAssignedCourier && !isAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have access to this parcel",
    );
  }

  return parcel;
};

const updateParcel = async (
  id: string,
  senderId: string,
  payload: IUpdateParcelPayload,
) => {
  const parcel = await prisma.parcel.findFirst({
    where: { id, deletedAt: null },
  });

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  if (parcel.senderId !== senderId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only edit your own parcels",
    );
  }

  if (parcel.status !== ParcelStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Parcel can only be edited while it is still pending",
    );
  }

  const updatedParcel = await prisma.parcel.update({
    where: { id },
    data: payload,
  });

  return updatedParcel;
};

const cancelParcel = async (
  id: string,
  requester: { userId: string; role: Role },
) => {
  const parcel = await prisma.parcel.findFirst({
    where: { id, deletedAt: null },
  });

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  const isOwner = parcel.senderId === requester.userId;
  const isAdmin =
    requester.role === Role.ADMIN || requester.role === Role.SUPER_ADMIN;

  if (!isOwner && !isAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only cancel your own parcels",
    );
  }

  const cancellableStatuses: ParcelStatus[] = [
    ParcelStatus.PENDING,
    ParcelStatus.APPROVED,
  ];

  if (!cancellableStatuses.includes(parcel.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Parcel can no longer be cancelled at its current status",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.parcel.update({
      where: { id },
      data: { status: ParcelStatus.CANCELLED, deletedAt: new Date() },
    });

    await tx.parcelStatusLog.create({
      data: {
        parcelId: id,
        status: ParcelStatus.CANCELLED,
        note: "Cancelled by " + (isAdmin ? "admin" : "customer"),
        changedById: requester.userId,
      },
    });

    return updated;
  });

  return result;
};

const updateParcelStatus = async (
  id: string,
  requester: { userId: string; role: Role },
  payload: IUpdateParcelStatusPayload,
) => {
  const parcel = await prisma.parcel.findFirst({
    where: { id, deletedAt: null },
  });

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  const isAssignedCourier = parcel.courierId === requester.userId;
  const isAdmin =
    requester.role === Role.ADMIN || requester.role === Role.SUPER_ADMIN;

  if (!isAssignedCourier && !isAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only the assigned courier or an admin can update parcel status",
    );
  }

  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[parcel.status];

  if (!allowedNextStatuses.includes(payload.status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot change status from ${parcel.status} to ${payload.status}`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.parcel.update({
      where: { id },
      data: {
        status: payload.status,
        ...(payload.status === ParcelStatus.DELIVERED && {
          actualDelivery: new Date(),
        }),
      },
    });

    await tx.parcelStatusLog.create({
      data: {
        parcelId: id,
        status: payload.status,
        note: payload.note,
        changedById: requester.userId,
      },
    });

    return updated;
  });

  return result;
};

const assignCourier = async (id: string, payload: IAssignCourierPayload) => {
  const parcel = await prisma.parcel.findFirst({
    where: { id, deletedAt: null },
  });

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  if (parcel.status !== ParcelStatus.APPROVED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only approved parcels can be assigned to a courier",
    );
  }

  const courier = await prisma.user.findFirst({
    where: { id: payload.courierId, role: Role.COURIER, deletedAt: null },
  });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier not found");
  }

  if (!courier.isAvailable) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Selected courier is currently unavailable",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.parcel.update({
      where: { id },
      data: { courierId: courier.id, status: ParcelStatus.ASSIGNED },
    });

    await tx.parcelStatusLog.create({
      data: {
        parcelId: id,
        status: ParcelStatus.ASSIGNED,
        note: `Assigned to courier ${courier.name}`,
        changedById: courier.id,
      },
    });

    return updated;
  });

  return result;
};

export const ParcelService = {
  createParcel,
  getAllParcels,
  getParcelById,
  updateParcel,
  cancelParcel,
  updateParcelStatus,
  assignCourier,
};
