import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { ParcelController } from "./parcel.controller";
import { ParcelValidation } from "./parcel.validation";
import { validatedRequest } from "../../middlewares/validateRequest";

const router = Router();

router.post(
  "/",
  auth(Role.CUSTOMER),
  validatedRequest(ParcelValidation.CreateParcelZodSchema),
  ParcelController.createParcel,
);

router.get(
  "/",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN, Role.SUPER_ADMIN),
  ParcelController.getAllParcels,
);

router.get(
  "/:id",
  auth(Role.CUSTOMER, Role.COURIER, Role.ADMIN, Role.SUPER_ADMIN),
  ParcelController.getParcelById,
);

router.patch(
  "/:id",
  auth(Role.CUSTOMER),
  validatedRequest(ParcelValidation.UpdateParcelZodSchema),
  ParcelController.updateParcel,
);

router.delete(
  "/:id",
  auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN),
  ParcelController.cancelParcel,
);

router.patch(
  "/:id/status",
  auth(Role.COURIER, Role.ADMIN, Role.SUPER_ADMIN),
  validatedRequest(ParcelValidation.UpdateParcelStatusZodSchema),
  ParcelController.updateParcelStatus,
);

router.post(
  "/:id/assign",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validatedRequest(ParcelValidation.AssignCourierZodSchema),
  ParcelController.assignCourier,
);

export const ParcelRoutes = router;
