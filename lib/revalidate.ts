// ============================================================
// Notify the public website to revalidate specific cache tags
// and paths after CMS content changes.
// ============================================================

interface RevalidatePayload {
  tags?: string[];
  paths?: string[];
}

export async function revalidateWebsite(payload: RevalidatePayload): Promise<void> {
  const origin = process.env.WEBSITE_ORIGIN;
  const secret = process.env.REVALIDATE_SECRET;

  if (!origin || !secret) {
    console.warn("[revalidate] WEBSITE_ORIGIN or REVALIDATE_SECRET not set");
    return;
  }

  try {
    const res = await fetch(`${origin.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(`[revalidate] failed: ${res.status} ${res.statusText}`);
    } else {
      console.log(`[revalidate] ok →`, payload);
    }
  } catch (err) {
    console.error("[revalidate] error:", err);
  }
}