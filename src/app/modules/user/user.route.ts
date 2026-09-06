import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { upload } from "../../lib/multer";
import { auth } from "../../middlewares/auth";

import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";
import { validatedRequest } from "../../middlewares/validateRequest";

const router = Router();

router.get(
  "/me",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getMyProfile,
);

router.patch(
  "/me",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN, Role.SUPER_ADMIN),
  validatedRequest(UserValidation.UpdateProfileZodSchema),
  UserController.updateMyProfile,
);

router.patch(
  "/profile-image",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN, Role.SUPER_ADMIN),
  upload.single("profileImage"),
  UserController.uploadProfileImage,
);

router.patch(
  "/courier/availability",
  auth(Role.COURIER),
  validatedRequest(UserValidation.UpdateCourierAvailabilityZodSchema),
  UserController.updateCourierAvailability,
);

router.get(
  "/couriers",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getAvailableCouriers,
);

router.get("/", auth(Role.ADMIN, Role.SUPER_ADMIN), UserController.getAllUsers);

router.patch(
  "/:id/status",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validatedRequest(UserValidation.UpdateUserStatusZodSchema),
  UserController.updateUserStatus,
);

router.patch(
  "/:id/role",
  auth(Role.SUPER_ADMIN),
  validatedRequest(UserValidation.UpdateUserRoleZodSchema),
  UserController.updateUserRole,
);

export const UserRoutes = router;
