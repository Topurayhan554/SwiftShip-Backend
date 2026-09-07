import dotenv from "dotenv";
import { SignOptions } from "jsonwebtoken";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  node_env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  api_version: process.env.API_VERSION || "/api/v1",

  database_url: process.env.DATABASE_URL,

  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,

  jwt_access_expires_in: (process.env.JWT_ACCESS_EXPIRES_IN ||
    "1d") as SignOptions["expiresIn"],
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_refresh_expires_in: (process.env.JWT_REFRESH_EXPIRES_IN ||
    "7d") as SignOptions["expiresIn"],
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  super_admin_name: process.env.SUPER_ADMIN_NAME,
  super_admin_email: process.env.SUPER_ADMIN_EMAIL,
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD,

  tester_admin_name: process.env.TESTER_ADMIN_NAME,
  tester_admin_email: process.env.TESTER_ADMIN_EMAIL,
  tester_admin_password: process.env.TESTER_ADMIN_PASSWORD,

  tester_courier_name: process.env.TESTER_COURIER_NAME,
  tester_courier_email: process.env.TESTER_COURIER_EMAIL,
  tester_courier_password: process.env.TESTER_COURIER_PASSWORD,

  redis_user: process.env.REDIS_USER,
  redis_password: process.env.REDIS_PASSWORD,
  redis_host: process.env.REDIS_HOST,
  redis_port: process.env.REDIS_PORT,

  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,

  google_client_id: process.env.GOOGLE_CLIENT_ID,

  email_sender: process.env.EMAIL_SENDER,

  smtp_user: process.env.SMTP_USER,
  smtp_password: process.env.SMTP_PASSWORD,

  bkash_username: process.env.BKASH_USERNAME as string,
  bkash_password: process.env.BKASH_PASSWORD as string,
  bkash_app_key: process.env.BKASH_APP_KEY as string,
  bkash_app_secret: process.env.BKASH_APP_SECRET as string,
  bkash_base_url: process.env.BKASH_BASE_URL as string,
  bkash_callback_url: process.env.BKASH_CALLBACK_URL as string,

  cors_origin: process.env.CORS_ORIGIN || "http://localhost:3000",
};
