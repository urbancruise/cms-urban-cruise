export interface SeoScoreInput {
  meta_title?: string | null;
  meta_description?: string | null;
  focus_keyword?: string | null;
  canonical_url?: string | null;
  is_indexable?: boolean | number;
  og_title?: string | null;
  og_image?: string | null;
  schema_json?: unknown;
  word_count?: number | null;
  readability_score?: number | null;
}

export function calculateSeoScore(page: SeoScoreInput): number {
  const title = page.meta_title?.trim() || "";
  const description = page.meta_description?.trim() || "";
  const keyword = page.focus_keyword?.trim().toLocaleLowerCase() || "";
  const schema = page.schema_json;
  let score = 0;

  if (title) score += 15;
  if (title.length >= 30 && title.length <= 60) score += 5;
  if (description) score += 15;
  if (description.length >= 120 && description.length <= 160) score += 5;
  if (keyword) score += 10;
  if (keyword && title.toLocaleLowerCase().includes(keyword)) score += 5;
  if (keyword && description.toLocaleLowerCase().includes(keyword)) score += 5;
  if (page.canonical_url?.trim()) score += 10;
  if (page.is_indexable === true || page.is_indexable === 1) score += 5;
  if (page.og_title?.trim() && page.og_image?.trim()) score += 5;
  if (
    (Array.isArray(schema) && schema.length > 0) ||
    (schema != null && !Array.isArray(schema))
  ) {
    score += 5;
  }
  if ((page.word_count || 0) >= 300) score += 10;
  if ((page.readability_score || 0) >= 60) score += 10;

  return Math.min(score, 100);
}
