// ============================================================
// Notify the public website to revalidate specific cache tags
// and paths after CMS content changes.
// ============================================================

interface RevalidatePayload {
  tags?: string[];
  paths?: string[];
}

const WEBSITE_CONTENT_TAGS = ["cities", "home", "vehicles", "seo", "sitemap"];
const WEBSITE_CONTENT_PATHS = ["/", "/blog", "/sitemap.xml"];

export function getWebsiteBlogRevalidationPaths(
  slugs: string[],
  citySlugs: string[]
): string[] {
  const paths = new Set(WEBSITE_CONTENT_PATHS);
  const validSegment = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const validCitySlugs = citySlugs.filter((slug) => validSegment.test(slug));

  for (const slug of slugs) {
    if (!validSegment.test(slug)) continue;
    paths.add(`/blog/${slug}`);
    for (const citySlug of validCitySlugs) {
      paths.add(`/${citySlug}/blog`);
      paths.add(`/${citySlug}/${slug}`);
    }
  }

  if (slugs.length === 0) {
    for (const citySlug of validCitySlugs) {
      paths.add(`/${citySlug}/blog`);
    }
  }

  return [...paths];
}

export async function revalidateWebsite(payload: RevalidatePayload): Promise<void> {
  const origin = process.env.WEBSITE_ORIGIN;
  const secret = process.env.REVALIDATE_SECRET;

  if (!origin || !secret) {
    console.warn("[revalidate] WEBSITE_ORIGIN or REVALIDATE_SECRET not set");
    return;
  }

  const tags = [...new Set([...WEBSITE_CONTENT_TAGS, ...(payload.tags || [])])];
  const paths = [...new Set([...WEBSITE_CONTENT_PATHS, ...(payload.paths || [])])];
  const revalidation = { tags, paths };

  try {
    const res = await fetch(`${origin.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify(revalidation),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(`[revalidate] failed: ${res.status} ${res.statusText}`);
    } else {
      console.log("[revalidate] ok", revalidation);
    }
  } catch (err) {
    console.error("[revalidate] error:", err);
  }
}