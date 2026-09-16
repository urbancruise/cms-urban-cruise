import { NextResponse } from "next/server";

// ============================================================
// Adds Cache-Control + ETag to a JSON response.
// ============================================================
export function cachedJson(
  data: any,
  {
    ttl = 30,
    swr = 120,
    status = 200,
  }: { ttl?: number; swr?: number; status?: number } = {}
) {
  const body = JSON.stringify(data);
  const etag = `"${Buffer.from(body).length}-${hashString(body)}"`;

  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `private, max-age=${ttl}, stale-while-revalidate=${swr}`,
      ETag: etag,
    },
  });
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}