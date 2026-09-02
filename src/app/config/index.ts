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

  admin_email: process.env.ADMIN_EMAIL as string,
  admin_password: process.env.ADMIN_PASSWORD as string,

  cors_origin: process.env.CORS_ORIGIN || "http://localhost:3000",
};
