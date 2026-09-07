import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../config";
import { AppError } from "../utils/AppError";
import { Prisma } from "../../generated/prisma/client";

interface IErrorSource {
  path?: string;
  message: string;
}

export const globalErrorHandler = async (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (config.node_env === "development") {
    console.log("Error from Global Error Handler", err);
  }

  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errors: IErrorSource[] = [{ message: "Something went wrong" }];

  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "You have provided incorrect field type or missing fields";
    errors = [{ message }];
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = httpStatus.BAD_REQUEST;
    if (err.code === "P2002") {
      const field = (err.meta?.target as string[])?.join(", ") || "field";
      message = "Duplicate Key Error";
      errors = [{ path: field, message: `${field} already exists` }];
    } else if (err.code === "P2003") {
      message = "Foreign key constraint failed";
      errors = [{ message }];
    } else if (err.code === "P2025") {
      statusCode = httpStatus.NOT_FOUND;
      message =
        "An operation failed because it depends on one or more records that were required but not found.";
      errors = [{ message }];
    } else {
      message = "Database error";
      errors = [{ message: err.message }];
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = httpStatus.UNAUTHORIZED;
      message =
        "Authentication failed against database server. Please check your credentials";
    } else if (err.errorCode === "P1001") {
      statusCode = httpStatus.BAD_REQUEST;
      message = "Can't reach database server";
    } else {
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      message = "Database initialization error";
    }
    errors = [{ message }];
  } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = "Error occurred during query execution";
    errors = [{ message }];
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = [{ message: err.message }];
  } else if (err.name === "JsonWebTokenError") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Invalid token";
    errors = [{ message: "Invalid or malformed token" }];
  } else if (err.name === "TokenExpiredError") {
    statusCode = httpStatus.UNAUTHORIZED;
    message = "Token expired";
    errors = [{ message: "Access token has expired" }];
  } else if (err instanceof Error) {
    message = err.message;
    errors = [{ message: err.message }];
  }

  res.status(statusCode).json({
    success: false,
    message: config.node_env === "development" ? message : message,
    errors,
    stack: config.node_env === "development" ? err.stack : undefined,
  });
};
