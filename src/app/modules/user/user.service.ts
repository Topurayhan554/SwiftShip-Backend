import type { UploadApiResponse } from "cloudinary";
import httpStatus from "http-status";
import { Role } from "../../../generated/prisma/enums";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { IUpdateProfilePayload, IUserFilters } from "./user.interface";
import { createAuditLog } from "../../utils/auditLog";

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const updateMyProfile = async (
  userId: string,
  payload: IUpdateProfilePayload,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: payload,
    omit: { password: true },
  });

  return updated;
};

const uploadProfileImage = async (buffer: Buffer, userId: string) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { imagePublicId: true, profileImage: true },
  });

  if (!currentUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const cloudinaryResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "auto", folder: "swiftship/profile-images" },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            if (!result) {
              return reject(new Error("No result returned from Cloudinary"));
            }
            resolve(result);
          },
        )
        .end(buffer);
    },
  );

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profileImage: cloudinaryResult.secure_url,
      imagePublicId: cloudinaryResult.public_id,
    },
    omit: { password: true },
  });

  if (currentUser.imagePublicId) {
    await cloudinary.uploader.destroy(currentUser.imagePublicId);
  }

  return updatedUser;
};

const getAllUsers = async (
  filters: IUserFilters,
  page: number,
  limit: number,
) => {
  const { role, status, searchTerm } = filters;

  const andConditions: Record<string, unknown>[] = [{ deletedAt: null }];

  if (role) andConditions.push({ role });
  if (status) andConditions.push({ status });

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phone: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  const whereCondition = { AND: andConditions };
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      omit: { password: true },
    }),
    prisma.user.count({ where: whereCondition }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data: users,
  };
};

const getAvailableCouriers = async () => {
  const couriers = await prisma.user.findMany({
    where: {
      role: Role.COURIER,
      status: "ACTIVE",
      isAvailable: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      vehicleType: true,
      licenseNumber: true,
    },
    orderBy: { name: "asc" },
  });

  return couriers;
};

const updateUserStatus = async (
  actorId: string,
  userId: string,
  status: "ACTIVE" | "BLOCKED",
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role === Role.SUPER_ADMIN) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Super Admin status cannot be changed",
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status },
    omit: { password: true },
  });

  await createAuditLog({
    actorId,
    action: "USER_STATUS_UPDATE",
    entityType: "User",
    entityId: userId,
    meta: { previousStatus: user.status, newStatus: status },
  });

  return updated;
};

const updateUserRole = async (
  actorId: string,
  userId: string,
  newRole: "CUSTOMER" | "COURIER" | "ADMIN",
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role === Role.SUPER_ADMIN) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Super Admin's role cannot be changed",
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    omit: { password: true },
  });

  await createAuditLog({
    actorId,
    action: "USER_ROLE_UPDATE",
    entityType: "User",
    entityId: userId,
    meta: { previousRole: user.role, newRole },
  });

  return updated;
};

const updateCourierAvailability = async (
  courierId: string,
  isAvailable: boolean,
) => {
  const courier = await prisma.user.findFirst({
    where: { id: courierId, role: Role.COURIER },
  });

  if (!courier) {
    throw new AppError(httpStatus.NOT_FOUND, "Courier not found");
  }

  const updated = await prisma.user.update({
    where: { id: courierId },
    data: { isAvailable },
    omit: { password: true },
  });

  return updated;
};

export const UserService = {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
  getAllUsers,
  getAvailableCouriers,
  updateUserStatus,
  updateUserRole,
  updateCourierAvailability,
};
