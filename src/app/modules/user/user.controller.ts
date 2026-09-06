import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserService } from "./user.service";

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getMyProfile(req.user!.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile fetched successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateMyProfile(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, "No file provided");
  }

  const userId = req.user!.userId;
  const result = await UserService.uploadProfileImage(req.file.buffer, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile image uploaded successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const filters = {
    role: req.query.role as string | undefined,
    status: req.query.status as string | undefined,
    searchTerm: req.query.searchTerm as string | undefined,
  };

  const result = await UserService.getAllUsers(filters, page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAvailableCouriers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAvailableCouriers();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Available couriers fetched successfully",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateUserStatus(
    req.params.id,
    req.body.status,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateUserRole(req.params.id, req.body.role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User role updated successfully",
    data: result,
  });
});

const updateCourierAvailability = catchAsync(
  async (req: Request, res: Response) => {
    const result = await UserService.updateCourierAvailability(
      req.user!.userId,
      req.body.isAvailable,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Availability updated successfully",
      data: result,
    });
  },
);

export const UserController = {
  getMyProfile,
  updateMyProfile,
  uploadProfileImage,
  getAllUsers,
  getAvailableCouriers,
  updateUserStatus,
  updateUserRole,
  updateCourierAvailability,
};
