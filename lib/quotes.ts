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
  city: z.string().trim().min(1).max(100).nullable().optional(),
  page_url: z.string().trim().min(1).max(2048).optional(),
};

function citySlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getQuoteCityFromPageUrl(
  pageUrl: string,
  activeCities: string[]
): string | null {
  let pathname: string;
  try {
    pathname = new URL(pageUrl, "http://localhost").pathname;
  } catch {
    return null;
  }

  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (!firstSegment) return null;

  let decodedSegment: string;
  try {
    decodedSegment = decodeURIComponent(firstSegment);
  } catch {
    return null;
  }
  const slug = citySlug(decodedSegment);
  return activeCities.find((name) => citySlug(name) === slug) ?? null;
}

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
    full_name: contactFields.full_name.optional(),
    phone_number: phoneNumber.optional(),
    city: contactFields.city,
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase())
      .nullable()
      .optional(),
    message: tripFields.message,
    pickup_address: z.string().trim().min(1).max(500).nullable().optional(),
    pickup_date: z.iso.date().nullable().optional(),
    drop_address: z.string().trim().min(1).max(500).nullable().optional(),
    drop_date: z.iso.date().nullable().optional(),
    travel_itinerary: z.string().trim().min(1).max(5000).nullable().optional(),
    passenger_count: z.number().int().min(1).max(500).nullable().optional(),
    luggage_count: z.number().int().min(0).max(500).nullable().optional(),
    vehicle_category: z
      .enum(["Economy", "Premium", "Royal", "Royal VIP"])
      .nullable()
      .optional(),
    vehicle_name: z.string().trim().min(1).max(150).nullable().optional(),
    status: z.enum(["draft", "submitted"]).optional(),
  })
  .refine(
    (quote) =>
      quote.pickup_date == null ||
      quote.drop_date == null ||
      quote.drop_date >= quote.pickup_date,
    {
      message: "Drop date must be on or after the pickup date",
      path: ["drop_date"],
    }
  );

export const QuoteEditableFields = [
  "full_name",
  "phone_number",
  "city",
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
