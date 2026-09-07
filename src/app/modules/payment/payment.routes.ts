import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";
import { validatedRequest } from "../../middlewares/validateRequest";

const router = Router();

router.post(
  "/bkash/initiate",
  auth(Role.CUSTOMER),
  validatedRequest(PaymentValidation.InitiatePaymentZodSchema),
  PaymentController.initiateBkashPayment,
);

// bKash redirects the customer's browser here directly — no auth middleware
router.get("/bkash/callback", PaymentController.bkashCallback);

router.get(
  "/my-payments",
  auth(Role.CUSTOMER),
  PaymentController.getMyPayments,
);

router.get(
  "/all-payments",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  PaymentController.getAllPayments,
);

router.get(
  "/:paymentId",
  auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN),
  PaymentController.getSinglePayment,
);

export const PaymentRoutes = router;
