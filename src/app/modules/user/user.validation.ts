import z from "zod";

const UpdateProfileZodSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().min(6).optional(),
  profileImage: z.string().url().optional(),
});

const UpdateUserStatusZodSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"]),
});

const UpdateCourierAvailabilityZodSchema = z.object({
  isAvailable: z.boolean(),
});

const UpdateUserRoleZodSchema = z.object({
  role: z.enum(["CUSTOMER", "COURIER", "ADMIN"]),
});

export const UserValidation = {
  UpdateProfileZodSchema,
  UpdateUserStatusZodSchema,
  UpdateCourierAvailabilityZodSchema,
  UpdateUserRoleZodSchema,
};
