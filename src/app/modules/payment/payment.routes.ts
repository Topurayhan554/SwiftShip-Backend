import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { PaymentController } from "./payment.controller";

const router = Router();

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
