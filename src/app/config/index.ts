import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  api_version: process.env.API_VERSION || "/api/v1",

  database_url: process.env.DATABASE_URL as string,

  jwt_access_secret: process.env.JWT_ACCESS_SECRET as string,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET as string,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,

  super_admin_name: process.env.SUPER_ADMIN_NAME || "Super Admin",
  super_admin_email: process.env.SUPER_ADMIN_EMAIL as string,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD as string,

  tester_admin_name: process.env.TESTER_ADMIN_NAME || "Tester Admin",
  tester_admin_email: process.env.TESTER_ADMIN_EMAIL as string,
  tester_admin_password: process.env.TESTER_ADMIN_PASSWORD as string,

  tester_courier_name: process.env.TESTER_COURIER_NAME || "Tester Courier",
  tester_courier_email: process.env.TESTER_COURIER_EMAIL as string,
  tester_courier_password: process.env.TESTER_COURIER_PASSWORD as string,

  redis_user: process.env.REDIS_USER as string,
  redis_password: process.env.REDIS_PASSWORD as string,
  redis_host: process.env.REDIS_HOST as string,
  redis_port: process.env.REDIS_PORT || "6379",

  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY as string,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET as string,

  google_client_id: process.env.GOOGLE_CLIENT_ID as string,

  smtp_user: process.env.SMTP_USER as string,
  smtp_password: process.env.SMTP_PASSWORD as string,

  cors_origin: process.env.CORS_ORIGIN || "http://localhost:3000",
};
