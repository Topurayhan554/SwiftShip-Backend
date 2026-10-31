import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReviewService } from "./review.service";
import { IQuery } from "../../interfaces";
import { Role } from "../../../generated/prisma/enums";
import { AppError } from "../../utils/AppError";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const result = await ReviewService.createReview(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review submitted successfully",
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await ReviewService.getAllReviews(req.query as IQuery);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reviews fetched successfully",
    meta,
    data,
  });
});

const getCourierReviews = catchAsync(async (req: Request, res: Response) => {
  const courierId = req.params.courierId as string;

  if (req.user!.role === Role.COURIER && req.user!.userId !== courierId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only view your own reviews",
    );
  }

  const { data, meta, averageRating } = await ReviewService.getCourierReviews(
    courierId,
    req.query as IQuery,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Courier reviews fetched successfully",
    data: {
      reviews: data,
      averageRating,
    },
    meta,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { data, meta } = await ReviewService.getMyReviews(
    userId,
    req.query as IQuery,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My reviews fetched successfully",
    meta,
    data,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  await ReviewService.deleteReview(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review deleted successfully",
    data: null,
  });
});

const getPublicReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getPublicReviews(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const ReviewController = {
  createReview,
  getAllReviews,
  getCourierReviews,
  getMyReviews,
  getPublicReviews,
  deleteReview,
};
