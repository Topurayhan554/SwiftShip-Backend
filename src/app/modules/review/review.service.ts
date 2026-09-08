import httpStatus from "http-status";
import { ParcelStatus } from "../../../generated/prisma/enums";
import type { IQuery } from "../../interfaces";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import type { ICreateReviewPayload } from "./review.interface";

const createReview = async (userId: string, payload: ICreateReviewPayload) => {
  const parcel = await prisma.parcel.findFirst({
    where: { id: payload.parcelId, deletedAt: null },
    include: { review: true },
  });

  if (!parcel) {
    throw new AppError(httpStatus.NOT_FOUND, "Parcel not found");
  }

  if (parcel.senderId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only review your own parcels",
    );
  }

  if (parcel.status !== ParcelStatus.DELIVERED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You can only review a delivered parcel",
    );
  }

  if (parcel.review) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This parcel has already been reviewed",
    );
  }

  if (!parcel.courierId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This parcel has no assigned courier to review",
    );
  }

  const review = await prisma.review.create({
    data: {
      parcelId: parcel.id,
      userId,
      rating: payload.rating,
      comment: payload.comment,
    },
  });

  return review;
};

const getCourierReviews = async (courierId: string, query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const whereCondition = {
    parcel: { courierId },
  };

  const [reviews, total, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: whereCondition,
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        parcel: { select: { trackingId: true } },
      },
    }),
    prisma.review.count({ where: whereCondition }),
    prisma.review.aggregate({
      where: whereCondition,
      _avg: { rating: true },
    }),
  ]);

  return {
    data: reviews,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    averageRating: aggregate._avg.rating ?? 0,
  };
};

const getMyReviews = async (userId: string, query: IQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        parcel: { select: { trackingId: true, deliveryAddress: true } },
      },
    }),
    prisma.review.count({ where: { userId } }),
  ]);

  return {
    data: reviews,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const ReviewService = {
  createReview,
  getCourierReviews,
  getMyReviews,
};
