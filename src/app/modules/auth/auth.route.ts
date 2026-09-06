import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";

import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";
import { validatedRequest } from "../../middlewares/validateRequest";

const router = Router();

router.post(
  "/register",
  validatedRequest(UserValidation.RegisterZodSchema),
  AuthController.registerUser,
);

router.post(
  "/verify-email",
  validatedRequest(UserValidation.VerifyEmailZodSchema),
  AuthController.verifyUserEmail,
);

router.post(
  "/login",
  validatedRequest(UserValidation.LoginZodSchema),
  AuthController.loginUser,
);

router.get(
  "/me",
  auth(Role.ADMIN, Role.COURIER, Role.CUSTOMER, Role.SUPER_ADMIN),
  AuthController.getMe,
);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/google", AuthController.googleLogin);

router.post(
  "/forgot-password",
  validatedRequest(UserValidation.ForgotPasswordZodSchema),
  AuthController.forgotPassword,
);

router.post(
  "/reset-password",
  validatedRequest(UserValidation.ResetPasswordZodSchema),
  AuthController.resetPassword,
);

export const AuthRoutes = router;
