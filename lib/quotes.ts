import { z } from "zod";

const phoneNumber = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^\+?[0-9\s()-]+$/, "Enter a valid phone number");

const contactFields = {
  full_name: z.string().trim().min(1).max(120),
  phone_number: phoneNumber,
};

const tripFields = {
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  message: z.string().trim().max(1000).nullable().optional(),
  pickup_address: z.string().trim().min(1).max(500),
  pickup_date: z.iso.date(),
  drop_address: z.string().trim().min(1).max(500),
  drop_date: z.iso.date(),
  travel_itinerary: z.string().trim().min(1).max(5000),
  passenger_count: z.number().int().min(1).max(500),
  luggage_count: z.number().int().min(0).max(500),
  vehicle_category: z.enum(["Economy", "Premium", "Royal", "Royal VIP"]),
  vehicle_name: z.string().trim().min(1).max(150),
};

export const QuoteContactSchema = z.object(contactFields);

export const QuoteSubmissionSchema = z
  .object({ ...contactFields, ...tripFields })
  .refine((quote) => quote.drop_date >= quote.pickup_date, {
    message: "Drop date must be on or after the pickup date",
    path: ["drop_date"],
  });

export const QuoteUpdateSchema = z
  .object({
    ...contactFields,
    ...tripFields,
    status: z.enum(["draft", "submitted"]).optional(),
  })
  .partial();

export const QuoteEditableFields = [
  "full_name",
  "phone_number",
  "email",
  "message",
  "pickup_address",
  "pickup_date",
  "drop_address",
  "drop_date",
  "travel_itinerary",
  "passenger_count",
  "luggage_count",
  "vehicle_category",
  "vehicle_name",
] as const;
