import { Router } from "express";
import { AuthRoutes } from "../app/modules/auth/auth.route";
import { UserRoutes } from "../app/modules/user/user.route";
import { ParcelRoutes } from "../app/modules/parcel/parcel.route";
import { PaymentRoutes } from "../app/modules/payment/payment.routes";
import { AdminRoutes } from "../app/modules/admin/admin.route";
import { ReviewRoutes } from "../app/modules/review/review.routes";

const router = Router();

interface IModuleRoute {
  path: string;
  route: Router;
}

const moduleRoutes: IModuleRoute[] = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/parcels", route: ParcelRoutes },
  { path: "/payments", route: PaymentRoutes },
  { path: "/admin", route: AdminRoutes },
  { path: "/reviews", route: ReviewRoutes },
];

moduleRoutes.forEach((moduleRoute) =>
  router.use(moduleRoute.path, moduleRoute.route),
);

export default router;
