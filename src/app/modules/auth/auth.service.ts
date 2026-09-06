import bcrypt from "bcryptjs";
import crypto from "crypto";
import ejs from "ejs";
import httpStatus from "http-status";
import type { TokenPayload } from "google-auth-library";
import type { JwtPayload } from "jsonwebtoken";
import path from "path";
import {
  AuthProvider,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { googleClient } from "../../lib/googleAuth";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt";
import type {
  IForgotPasswordPayload,
  IGoogleLoginPayload,
  ILoginUserPayload,
  IRegisterUserPayload,
  IRequestUser,
  IResetPasswordPayload,
  IVerifyEmailPayload,
} from "./auth.interface";

const registerUser = async (payload: IRegisterUserPayload) => {
  const { name, password, role, phone, courier } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({ where: { email } });

  if (isUserExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User with this email already exists",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  const expirationSeconds = 5 * 60;

  const otpKey = `user-registration-otp:${email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(otpKey, otpValue, {
    expiration: { type: "EX", value: expirationSeconds },
  });

  const registrationDataKey = `user-registration-data:${email}`;
  const redisUserDataPayload = {
    name,
    email,
    password: hashedPassword,
    role,
    phone,
    courier,
  };

  await redisClient.set(
    registrationDataKey,
    JSON.stringify(redisUserDataPayload),
    {
      expiration: { type: "EX", value: expirationSeconds },
    },
  );

  const templatePath = path.join(
    process.cwd(),
    "src/templates/registration-user-otp.ejs",
  );

  const templateData = {
    name,
    email,
    otp: otpValue,
    expirationMinutes: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Email Verification",
    html,
  });
};

const verifyUserEmail = async (payload: IVerifyEmailPayload) => {
  const { otp } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExist = await prisma.user.findUnique({ where: { email } });

  if (isUserExist?.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (isUserExist?.isEmailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email already verified");
  }

  if (isUserExist?.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  const otpKey = `user-registration-otp:${email}`;
  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
  }

  await redisClient.del(otpKey);

  const registrationDataKey = `user-registration-data:${email}`;
  const redisUserData = await redisClient.get(registrationDataKey);

  if (!redisUserData) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Registration session expired, please register again",
    );
  }

  const registerPayload: IRegisterUserPayload & { password: string } =
    JSON.parse(redisUserData);

  const createdUser = await prisma.user.create({
    data: {
      name: registerPayload.name,
      email: registerPayload.email,
      password: registerPayload.password,
      phone: registerPayload.phone,
      role: registerPayload.role,
      status: UserStatus.ACTIVE,
      authProvider: AuthProvider.CREDENTIALS,
      isEmailVerified: true,
      ...(registerPayload.role === Role.COURIER && {
        vehicleType: registerPayload.courier?.vehicleType,
        licenseNumber: registerPayload.courier?.licenseNumber,
      }),
    },
  });

  await redisClient.del(registrationDataKey);

  const templatePath = path.join(
    process.cwd(),
    "src/templates/user-welcome-email.ejs",
  );

  const html = await ejs.renderFile(templatePath, { name: createdUser.name });

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject: "Welcome to SwiftShip",
    html,
  });

  const { password: _password, ...user } = createdUser;

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return { user, accessToken, refreshToken };
};

const loginUser = async (payload: ILoginUserPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  if (user.password === null && user.googleId !== null) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account is registered with Google. Please log in with Google.",
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return { accessToken, refreshToken };
};

const getMe = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: { id: user.userId },
    omit: { password: true },
  });

  if (!isUserExists) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return isUserExists;
};

const refreshToken = async (token: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      config.node_env === "development"
        ? verifiedRefreshToken.error
        : "Invalid refresh token",
    );
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({ where: { id: data.userId } });

  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "User is inactive or not found",
    );
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return { accessToken, refreshToken };
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
  let googleIdTokenPayload: TokenPayload | null | undefined = null;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });

    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    console.log("Google ID Token Verification Failed", error);
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired Google ID token",
    );
  }

  if (!googleIdTokenPayload) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Invalid or expired Google ID token",
    );
  }

  if (!googleIdTokenPayload.email) {
    throw new AppError(httpStatus.BAD_REQUEST, "Google email not found");
  }

  if (!googleIdTokenPayload.name) {
    throw new AppError(httpStatus.BAD_REQUEST, "Google user name not found");
  }

  const ifExistWithGoogleAuth = await prisma.user.findUnique({
    where: {
      email: googleIdTokenPayload.email,
      googleId: googleIdTokenPayload.sub,
    },
  });

  let user = ifExistWithGoogleAuth;

  if (!ifExistWithGoogleAuth) {
    const ifExistWithCredentials = await prisma.user.findUnique({
      where: {
        email: googleIdTokenPayload.email,
        authProvider: AuthProvider.CREDENTIALS,
      },
    });

    if (ifExistWithCredentials) {
      if (!ifExistWithCredentials.isEmailVerified) {
        throw new AppError(httpStatus.FORBIDDEN, "Email not verified");
      }

      if (ifExistWithCredentials.status === UserStatus.BLOCKED) {
        throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
      }

      if (ifExistWithCredentials.status === UserStatus.DELETED) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
      }

      user = await prisma.user.update({
        where: { id: ifExistWithCredentials.id },
        data: { googleId: googleIdTokenPayload.sub },
      });
    } else {
      // Google-only registration defaults to CUSTOMER —
      // Courier/Admin accounts require explicit onboarding
      user = await prisma.user.create({
        data: {
          name: googleIdTokenPayload.name,
          email: googleIdTokenPayload.email,
          role: Role.CUSTOMER,
          googleId: googleIdTokenPayload.sub,
          authProvider: AuthProvider.GOOGLE,
          isEmailVerified: true,
        },
      });

      const templatePath = path.join(
        process.cwd(),
        "src/templates/user-welcome-email.ejs",
      );

      const html = await ejs.renderFile(templatePath, { name: user.name });

      await transporter.sendMail({
        from: config.email_sender,
        to: user.email,
        subject: "Welcome to SwiftShip",
        html,
      });
    }
  }

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (user.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in,
  );

  return { accessToken, refreshToken };
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const { email } = payload;

  const isUserExist = await prisma.user.findUnique({ where: { email } });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
  }

  if (isUserExist.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (!isUserExist.isEmailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User not verified");
  }

  if (isUserExist.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  if (
    isUserExist.googleId &&
    isUserExist.authProvider === AuthProvider.GOOGLE
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account uses Google login",
    );
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const key = `forgot-password-otp:${isUserExist.email}`;
  const expirationSeconds = 5 * 60;

  await redisClient.set(key, otp, {
    expiration: { type: "EX", value: expirationSeconds },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/templates/forgot-password.ejs",
  );

  const html = await ejs.renderFile(templatePath, {
    name: isUserExist.name,
    otp,
    expirationMinutes: expirationSeconds / 60,
  });

  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExist.email,
    subject: "Forgot Password",
    html,
  });
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  const { email, otp, newPassword } = payload;

  const isUserExist = await prisma.user.findUnique({ where: { email } });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
  }

  if (isUserExist.status === UserStatus.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "User is blocked");
  }

  if (!isUserExist.isEmailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "User not verified");
  }

  if (isUserExist.status === UserStatus.DELETED) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is deleted");
  }

  if (
    isUserExist.googleId &&
    isUserExist.authProvider === AuthProvider.GOOGLE
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This account uses Google login",
    );
  }

  const key = `forgot-password-otp:${isUserExist.email}`;
  const redisOtp = await redisClient.get(key);

  if (!redisOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  if (redisOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
  }

  const hashedNewPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: { email: isUserExist.email },
    data: { password: hashedNewPassword },
  });

  await redisClient.del([key]);

  const templatePath = path.join(
    process.cwd(),
    "src/templates/reset-password-success.ejs",
  );

  const html = await ejs.renderFile(templatePath, { name: isUserExist.name });

  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExist.email,
    subject: "Password Changed",
    html,
  });
};

export const AuthService = {
  registerUser,
  verifyUserEmail,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
  forgotPassword,
  resetPassword,
};
