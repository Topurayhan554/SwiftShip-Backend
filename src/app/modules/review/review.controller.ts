import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReviewService } from "./review.service";
import { IQuery } from "../../interfaces";

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

const getCourierReviews = catchAsync(async (req: Request, res: Response) => {
  const { data, meta, averageRating } = await ReviewService.getCourierReviews(
    req.params.courierId as string,
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

export const ReviewController = {
  createReview,
  getCourierReviews,
  getMyReviews,
};
