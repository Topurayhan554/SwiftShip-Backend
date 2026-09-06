import z from "zod";

const RegisterZodSchema = z.object({
  name: z
    .string("Not a string")
    .min(2, "Name must be at least 2 characters")
    .max(50),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be minimum 8 characters long")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least 1 special character",
    ),
  phone: z.string().optional(),
  role: z.enum(["CUSTOMER", "COURIER"]),
  courier: z
    .object({
      vehicleType: z.string().optional(),
      licenseNumber: z.string().optional(),
    })
    .optional(),
});

const VerifyEmailZodSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z.string().length(6),
});

const LoginZodSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

const ForgotPasswordZodSchema = z.object({
  email: z.email(),
});

const ResetPasswordZodSchema = z.object({
  email: z.email(),
  newPassword: z
    .string()
    .min(8, "Password must be minimum 8 characters long")
    .regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least 1 special character",
    ),
  otp: z.string().length(6),
});

export const UserValidation = {
  RegisterZodSchema,
  VerifyEmailZodSchema,
  LoginZodSchema,
  ForgotPasswordZodSchema,
  ResetPasswordZodSchema,
};
