// cms-urban-cruise/lib/validators.ts
import { z } from "zod";

// ============================================================
// User schemas
// ============================================================
export const UserCreateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Username can only contain letters, numbers, _, ., -"
    ),

  email: z.string().email("Invalid email address").max(100).toLowerCase(),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),

  full_name: z.string().max(100).optional().or(z.literal("")),

  avatar_url: z.string().url().max(500).optional().nullable(),
  avatar_public_id: z.string().max(255).optional().nullable(),

  role_ids: z
    .array(z.number().int().positive())
    .min(1, "At least one role is required"),

  is_active: z.boolean().optional(),

  city_ids: z.array(z.number().int().positive()).optional(),

  city_permissions: z
    .array(
      z.object({
        city_id: z.number().int().positive(),
        permissions: z.array(z.string().max(120)).max(200),
      })
    )
    .optional(),
});

export const UserUpdateSchema = UserCreateSchema.partial().extend({
  role_ids: z.array(z.number().int().positive()).min(1).optional(),
  password: z.string().min(6).max(100).optional(),
});

// ============================================================
// Role schemas
// ============================================================
export const RoleCreateSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  description: z.string().max(500).optional().or(z.literal("")),
  permissions: z.array(z.string().max(120)).max(500).optional(),
  is_active: z.boolean().optional(),
});

export const RoleUpdateSchema = RoleCreateSchema.partial();

// ============================================================
// City schemas — FIXED for image fields + empty strings
// ============================================================
export const CityCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),

  state: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .or(z.literal("")),

  country: z
    .string()
    .max(100)
    .optional()
    .nullable()
    .or(z.literal("")),

  code: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .or(z.literal("")),

  description: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal("")),

  // Image fields — no .url() because Cloudinary URLs can have tracking params
  image_url: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal("")),

  image_public_id: z
    .string()
    .max(255)
    .optional()
    .nullable()
    .or(z.literal("")),

  is_active: z.boolean().optional(),
});

export const CityUpdateSchema = CityCreateSchema.partial();

// ============================================================
// Helper
// ============================================================
export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: any
): { ok: true; data: z.infer<T> } | { ok: false; error: string } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    return {
      ok: false,
      error: first
        ? `${first.path.join(".")}: ${first.message}`
        : "Invalid input",
    };
  }
  return { ok: true, data: result.data };
}