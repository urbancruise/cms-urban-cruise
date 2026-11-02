import { z } from "zod";

export const QuickCallSubmissionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone_number: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^\+?[0-9\s()-]+$/, "Enter a valid phone number"),
  city: z.string().trim().min(1).max(100).nullable().optional(),
  page_url: z.string().trim().min(1).max(2048).optional(),
});

export const QuickCallUpdateSchema = QuickCallSubmissionSchema.pick({
  name: true,
  phone_number: true,
  city: true,
});
