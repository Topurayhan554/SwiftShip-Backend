import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validatedRequest } from "../../middlewares/validateRequest";
import { ReviewController } from "./review.controller";
import { ReviewValidation } from "./review.validation";

const router = Router();

router.post(
  "/",
  auth(Role.CUSTOMER),
  validatedRequest(ReviewValidation.CreateReviewZodSchema),
  ReviewController.createReview,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.getAllReviews,
);

router.get("/my-reviews", auth(Role.CUSTOMER), ReviewController.getMyReviews);

router.get(
  "/courier/:courierId",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.getCourierReviews,
);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.deleteReview,
);

export const ReviewRoutes = router;
