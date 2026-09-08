import z from "zod";

const CreateReviewZodSchema = z.object({
  parcelId: z.string().min(1, "Parcel ID is required"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z.string().max(600).optional(),
});

export const ReviewValidation = {
  CreateReviewZodSchema,
};
