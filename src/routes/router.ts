import { Router } from "express";
import { AuthRoutes } from "../app/modules/auth/auth.route";
import { UserRoutes } from "../app/modules/user/user.route";
import { ParcelRoutes } from "../app/modules/parcel/parcel.route";

const router = Router();

interface IModuleRoute {
  path: string;
  route: Router;
}

// As each module is built, uncomment and register it here.
// Example:

// import { UserRoutes } from '../modules/user/user.routes';
// import { ParcelRoutes } from '../modules/parcel/parcel.routes';
// import { PaymentRoutes } from '../modules/payment/payment.routes';
// import { AdminRoutes } from '../modules/admin/admin.routes';

const moduleRoutes: IModuleRoute[] = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/parcels", route: ParcelRoutes },
  // { path: '/payments', route: PaymentRoutes },
  // { path: '/admin', route: AdminRoutes },
];

moduleRoutes.forEach((moduleRoute) =>
  router.use(moduleRoute.path, moduleRoute.route),
);

export default router;
