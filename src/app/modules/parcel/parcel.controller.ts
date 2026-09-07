import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ParcelService } from "./parcel.service";

const createParcel = catchAsync(async (req: Request, res: Response) => {
  const senderId = req.user!.userId;
  const result = await ParcelService.createParcel(senderId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Parcel booked successfully",
    data: result,
  });
});

const getAllParcels = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const filters = {
    status: req.query.status as string | undefined,
    parcelType: req.query.parcelType as string | undefined,
    searchTerm: req.query.searchTerm as string | undefined,
  };

  const requester = { userId: req.user!.userId, role: req.user!.role };

  const result = await ParcelService.getAllParcels(
    filters,
    page,
    limit,
    requester,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Parcels fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getParcelById = catchAsync(async (req: Request, res: Response) => {
  const requester = { userId: req.user!.userId, role: req.user!.role };
  const result = await ParcelService.getParcelById(
    req.params.id as string,
    requester,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Parcel fetched successfully",
    data: result,
  });
});

const updateParcel = catchAsync(async (req: Request, res: Response) => {
  const senderId = req.user!.userId;
  const result = await ParcelService.updateParcel(
    req.params.id as string,
    senderId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Parcel updated successfully",
    data: result,
  });
});

const cancelParcel = catchAsync(async (req: Request, res: Response) => {
  const requester = { userId: req.user!.userId, role: req.user!.role };
  const result = await ParcelService.cancelParcel(
    req.params.id as string,
    requester,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Parcel cancelled successfully",
    data: result,
  });
});

const updateParcelStatus = catchAsync(async (req: Request, res: Response) => {
  const requester = { userId: req.user!.userId, role: req.user!.role };
  const result = await ParcelService.updateParcelStatus(
    req.params.id as string,
    requester,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Parcel status updated successfully",
    data: result,
  });
});

const assignCourier = catchAsync(async (req: Request, res: Response) => {
  const result = await ParcelService.assignCourier(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier assigned successfully",
    data: result,
  });
});

export const ParcelController = {
  createParcel,
  getAllParcels,
  getParcelById,
  updateParcel,
  cancelParcel,
  updateParcelStatus,
  assignCourier,
};
