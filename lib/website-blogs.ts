import { z } from "zod";

export const WEBSITE_BLOG_CATEGORIES = [
  "Car & SUVs",
  "Ertiga",
  "Innova Crysta",
  "Hycross",
  "Luxury Cars & SUVs",
  "Mercedes Sprinter",
  "Luxury Vans",
  "Tempo Traveller",
  "Maharaja Tempo Traveller",
  "Urbania",
  "Mini Bus",
  "Luxury Bus",
  "Volvo Bus",
  "Bharat Benz Bus",
  "Bus With Washroom",
  "Sleeper | Semi Sleeper Bus",
] as const;

export const WebsiteBlogInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  paragraph: z.string().trim().min(1, "Paragraph is required").max(60000),
  imageUrl: z.string().trim().url("A blog image is required").max(2048),
  imagePublicId: z.string().trim().max(255).default(""),
  categories: z.array(z.enum(WEBSITE_BLOG_CATEGORIES)).min(1).max(16),
  citySlugs: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    )
    .min(1)
    .max(100),
  status: z.enum(["draft", "published"]),
});

export type WebsiteBlogInput = z.infer<typeof WebsiteBlogInputSchema>;

export function getWebsiteBlogCitySlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

export function areWebsiteBlogCitiesActive(
  citySlugs: string[],
  activeCityNames: string[]
): boolean {
  const activeSlugs = new Set(activeCityNames.map(getWebsiteBlogCitySlug));
  return citySlugs.every((slug) => activeSlugs.has(slug));
}

export function parseBlogCitySlugs(value: unknown): string[] {
  let cities = value;
  if (typeof cities === "string") {
    try {
      cities = JSON.parse(cities);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(cities)) return [];
  return [...new Set(cities.filter(
    (city): city is string =>
      typeof city === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(city)
  ))];
}

export function parseBlogCategories(value: unknown): string[] {
  let categories = value;
  if (typeof categories === "string") {
    try {
      categories = JSON.parse(categories);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(categories)) return [];
  return categories.filter(
    (category): category is (typeof WEBSITE_BLOG_CATEGORIES)[number] =>
      typeof category === "string" &&
      WEBSITE_BLOG_CATEGORIES.includes(
        category as (typeof WEBSITE_BLOG_CATEGORIES)[number]
      )
  );
}
