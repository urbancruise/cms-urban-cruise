import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

const DEFAULT_ROBOTS = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /forgot-password
Disallow: /reset-password`;

interface RobotsRule {
  userAgent: string | string[];
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
  other?: Record<string, string | string[] | number>;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [rows] = (await pool.query(
    `SELECT setting_value FROM seo_settings
     WHERE setting_key = 'robots_txt_content'
     LIMIT 1`
  )) as any;
  const content = (rows as Array<{ setting_value: string }>)[0]?.setting_value;
  return parseRobots(content || DEFAULT_ROBOTS);
}

function parseRobots(content: string): MetadataRoute.Robots {
  const rules: RobotsRule[] = [];
  const sitemaps: string[] = [];
  let host: string | undefined;
  let current: RobotsRule | null = null;
  let hasDirective = false;

  const ensureRule = () => {
    if (!current) current = { userAgent: "*" };
    return current;
  };
  const flushRule = () => {
    if (current && (hasDirective || rules.length === 0)) rules.push(current);
    current = null;
    hasDirective = false;
  };

  for (const sourceLine of content.split(/\r?\n/)) {
    const line = sourceLine.split("#", 1)[0].trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (!value) continue;

    if (key === "user-agent") {
      if (hasDirective) flushRule();
      if (!current) {
        current = { userAgent: value };
      } else {
        const agents = Array.isArray(current.userAgent)
          ? current.userAgent
          : [current.userAgent];
        agents.push(value);
        current.userAgent = agents;
      }
      continue;
    }
    if (key === "sitemap") {
      sitemaps.push(value);
      continue;
    }
    if (key === "host") {
      host = value;
      continue;
    }

    const activeRule = ensureRule();
    if (key === "allow" || key === "disallow") {
      const values = activeRule[key] || [];
      values.push(value);
      activeRule[key] = values;
    } else if (key === "crawl-delay") {
      const delay = Number(value);
      if (Number.isFinite(delay) && delay >= 0) {
        activeRule.crawlDelay = delay;
      } else {
        (activeRule.other ||= {})[sourceLine.slice(0, separator).trim()] = value;
      }
    } else {
      (activeRule.other ||= {})[sourceLine.slice(0, separator).trim()] = value;
    }
    hasDirective = true;
  }
  flushRule();

  const result: MetadataRoute.Robots = {
    rules: rules.length
      ? rules
      : [{ userAgent: "*", allow: "/" }],
    sitemap: sitemaps.length
      ? sitemaps
      : `${env.WEBSITE_ORIGIN.replace(/\/$/, "")}/sitemap.xml`,
  };
  if (host) result.host = host;
  return result;
}
