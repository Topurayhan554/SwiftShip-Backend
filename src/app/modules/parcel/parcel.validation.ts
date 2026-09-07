import z from "zod";

const CreateParcelZodSchema = z.object({
  parcelType: z
    .enum(["DOCUMENT", "PACKAGE", "FRAGILE", "ELECTRONICS", "OTHER"])
    .default("PACKAGE"),
  description: z.string().max(500).optional(),
  weightKg: z.number().positive("Weight must be a positive number"),

  pickupAddress: z.string().min(5, "Pickup address is too short"),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),

  deliveryAddress: z.string().min(5, "Delivery address is too short"),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),

  receiverName: z.string().min(2, "Receiver name is too short"),
  receiverPhone: z.string().min(6, "Receiver phone is invalid"),
});

const UpdateParcelZodSchema = z.object({
  description: z.string().max(500).optional(),
  pickupAddress: z.string().min(5).optional(),
  deliveryAddress: z.string().min(5).optional(),
  receiverName: z.string().min(2).optional(),
  receiverPhone: z.string().min(6).optional(),
});

const UpdateParcelStatusZodSchema = z.object({
  status: z.enum([
    "APPROVED",
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "DELIVERED",
    "CANCELLED",
    "FAILED",
  ]),
  note: z.string().max(300).optional(),
});

const AssignCourierZodSchema = z.object({
  courierId: z.string().min(1, "Courier ID is required"),
});

export const ParcelValidation = {
  CreateParcelZodSchema,
  UpdateParcelZodSchema,
  UpdateParcelStatusZodSchema,
  AssignCourierZodSchema,
};
