import { z } from "zod";

// ============================================================
// Input schemas
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

  // ✅ ADD THIS
  avatar_url: z.string().url().max(500).optional().nullable(),

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

export const CityCreateSchema = z.object({
  name: z.string().min(2).max(100),
  state: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional(),
  code: z.string().max(20).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const CityUpdateSchema = CityCreateSchema.partial();

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