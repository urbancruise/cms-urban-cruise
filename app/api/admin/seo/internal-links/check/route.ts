import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { env } from "@/lib/env";
import { requireSeoAccess } from "@/lib/auth-guard";
import { respondError } from "@/lib/api-error";
import { HttpError } from "@/lib/http-error";
import { rateLimit } from "@/lib/rate-limit";

interface InternalLink {
  id: number;
  target_path: string;
}

async function isTargetBroken(targetPath: string, origin: URL): Promise<boolean> {
  let target: URL;
  try {
    target = new URL(targetPath, origin);
  } catch {
    return true;
  }
  if (target.origin !== origin.origin) return true;

  try {
    let response = await fetch(target, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(target, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      await response.body?.cancel();
    }
    return response.status >= 400;
  } catch {
    return true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 5 });
    if (!rl.ok) return rl.response;
    await requireSeoAccess(request);

    const origin = new URL(env.WEBSITE_ORIGIN);
    const [rows] = (await pool.query(
      `SELECT id, target_path
       FROM seo_internal_links
       ORDER BY id
       LIMIT 500`
    )) as any;
    const links = rows as InternalLink[];
    let broken = 0;

    for (let i = 0; i < links.length; i += 10) {
      const batch = links.slice(i, i + 10);
      const results = await Promise.all(
        batch.map(async (link) => ({
          id: link.id,
          isBroken: await isTargetBroken(link.target_path, origin),
        }))
      );
      for (const result of results) {
        await pool.query(
          `UPDATE seo_internal_links
           SET is_broken = ?, last_checked_at = NOW()
           WHERE id = ?`,
          [result.isBroken ? 1 : 0, result.id]
        );
        if (result.isBroken) broken += 1;
      }
    }

    return NextResponse.json({
      success: true,
      checked: links.length,
      broken,
      websiteOrigin: origin.origin,
    });
  } catch (err) {
    if (err instanceof TypeError) {
      return NextResponse.json(
        { error: "WEBSITE_ORIGIN must be a valid absolute URL." },
        { status: 500 }
      );
    }
    if (err instanceof HttpError && err.status === 503) {
      return respondError(err, "POST /api/admin/seo/internal-links/check");
    }
    return respondError(err, "POST /api/admin/seo/internal-links/check");
  }
}
