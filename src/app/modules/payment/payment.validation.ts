import z from "zod";

const InitiatePaymentZodSchema = z.object({
  parcelId: z.string().min(1, "Parcel ID is required"),
});

export const PaymentValidation = {
  InitiatePaymentZodSchema,
};
