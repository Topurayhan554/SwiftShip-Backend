import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { AdminController } from "./admin.controller";

const router = Router();

router.get(
  "/dashboard-stats",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getDashboardStats,
);

router.get(
  "/audit-logs",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAuditLogs,
);

export const AdminRoutes = router;
