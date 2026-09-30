// import { NextRequest, NextResponse } from "next/server";
// import pool from "@/lib/db";
// import { requireApiKey, withCors } from "@/lib/public-auth";
// import { rateLimit } from "@/lib/rate-limit";

// export async function OPTIONS() {
//   return withCors(new NextResponse(null, { status: 204 }));
// }

// export async function GET(request: NextRequest) {
//   try {
//     const rl = rateLimit(request, { windowMs: 60_000, max: 300 });
//     if (!rl.ok) return withCors(rl.response);

//     const auth = await requireApiKey(request);
//     if (!auth.ok) {
//       return withCors(
//         NextResponse.json({ error: auth.error }, { status: 401 })
//       );
//     }

//     const { searchParams } = new URL(request.url);
//     const citySlug = (searchParams.get("city") || "").trim().toLowerCase();

//     if (!citySlug) {
//       return withCors(
//         NextResponse.json(
//           { error: "Query param 'city' is required" },
//           { status: 400 }
//         )
//       );
//     }

//     // Find city
//     const [cityRows] = (await pool.query(
//       `SELECT id, name, state, country, code
//        FROM cities
//        WHERE LOWER(name) = ? AND is_active = 1
//        LIMIT 1`,
//       [citySlug]
//     )) as any;

//     const city = (cityRows as any[])[0];
//     if (!city) {
//       return withCors(
//         NextResponse.json(
//           { error: `City '${citySlug}' not found or inactive` },
//           { status: 404 }
//         )
//       );
//     }

//     // Fetch published sections
//     const [rows] = (await pool.query(
//       `SELECT section_key, content, updated_at
//        FROM site_home_content
//        WHERE city_id = ? AND status = 'published'`,
//       [city.id]
//     )) as any;

//     const sections: Record<string, any> = {};
//     let latestUpdate = new Date(0);

//     for (const row of rows as any[]) {
//       sections[row.section_key] =
//         typeof row.content === "string"
//           ? JSON.parse(row.content)
//           : row.content;

//       const rowDate = new Date(row.updated_at);
//       if (rowDate > latestUpdate) latestUpdate = rowDate;
//     }

//     return withCors(
//       NextResponse.json(
//         {
//           city: {
//             slug: citySlug,
//             name: city.name,
//             state: city.state,
//             code: city.code,
//           },
//           sections,
//           updatedAt: latestUpdate.toISOString(),
//         },
//         {
//           headers: {
//             "Cache-Control":
//               "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
//           },
//         }
//       )
//     );
//   } catch (err: any) {
//     console.error("[public/home] error:", err);
//     return withCors(
//       NextResponse.json(
//         { error: "Internal server error" },
//         { status: 500 }
//       )
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireApiKey, withCors } from "@/lib/public-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// ============================================================
// Normalize a section key from the DB into the canonical form
// expected by the public website.
//
// Accepts (case-insensitive, ignores dashes/underscores):
//   vehiclebudget, vehicleBudget, vehicle-budget,
//   vehicle_for_every_budget, vehicles-budget, vehicleBudgetSection
//   → "vehiclebudget"
// ============================================================
function normalizeSectionKey(raw: string): string {
  const clean = raw
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, "");

  // Map aliases to canonical keys
  const aliases: Record<string, string> = {
    hero: "hero",
    quickcall: "quickcall",
    getaquickcall: "quickcall",
    about: "about",
    aboutus: "about",
    howitworks: "howitworks",
    howitwork: "howitworks",
    vehiclebudget: "vehiclebudget",
    vehiclesbudget: "vehiclebudget",
    vehicleforeverybudget: "vehiclebudget",
    groupsize: "groupsize",
    vehiclesgroupsize: "groupsize",
    vehicleforeverygroupsize: "groupsize",
    occasion: "occasion",
    vehicleforeveryoccasion: "occasion",
    whychoose: "whychoose",
    whychooseurbancruise: "whychoose",
    testimonials: "testimonials",
    faq: "faq",
    faqs: "faq",
    servicelocations: "servicelocations",
    vehiclerentalserviceinindia: "servicelocations",
    partners: "partners",
    ourtrustedpartners: "partners",
    downloadapp: "downloadapp",
  };

  return aliases[clean] || clean;
}

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { windowMs: 60_000, max: 300 });
    if (!rl.ok) return withCors(rl.response);

    const auth = await requireApiKey(request);
    if (!auth.ok) {
      return withCors(
        NextResponse.json({ error: auth.error }, { status: 401 })
      );
    }

    const { searchParams } = new URL(request.url);
    const citySlug = (searchParams.get("city") || "").trim().toLowerCase();

    if (!citySlug) {
      return withCors(
        NextResponse.json(
          { error: "Query param 'city' is required" },
          { status: 400 }
        )
      );
    }

    // Find city
    const [cityRows] = (await pool.query(
      `SELECT id, name, state, country, code
       FROM cities
       WHERE LOWER(name) = ? AND is_active = 1
       LIMIT 1`,
      [citySlug]
    )) as any;

    const city = (cityRows as any[])[0];
    if (!city) {
      return withCors(
        NextResponse.json(
          { error: `City '${citySlug}' not found or inactive` },
          { status: 404 }
        )
      );
    }

    // Fetch published sections
    const [rows] = (await pool.query(
      `SELECT section_key, content, updated_at
       FROM site_home_content
       WHERE city_id = ? AND status = 'published'`,
      [city.id]
    )) as any;

    const sections: Record<string, any> = {};
    let latestUpdate = new Date(0);

    for (const row of rows as any[]) {
      const canonicalKey = normalizeSectionKey(row.section_key);

      const parsedContent =
        typeof row.content === "string"
          ? JSON.parse(row.content)
          : row.content;

      // If two rows normalize to the same canonical key,
      // prefer the most recently updated one.
      const existing = sections[canonicalKey];
      if (
        existing &&
        new Date(row.updated_at) <= new Date(existing.__updated_at || 0)
      ) {
        continue;
      }

      sections[canonicalKey] = {
        ...parsedContent,
        __updated_at: row.updated_at,
      };

      const rowDate = new Date(row.updated_at);
      if (rowDate > latestUpdate) latestUpdate = rowDate;
    }

    // Strip the internal __updated_at marker before returning
    for (const key of Object.keys(sections)) {
      delete sections[key].__updated_at;
    }

    return withCors(
      NextResponse.json(
        {
          city: {
            slug: citySlug,
            name: city.name,
            state: city.state,
            code: city.code,
          },
          sections,
          updatedAt: latestUpdate.toISOString(),
        },
        {
          headers: {
            "Cache-Control":
              "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
          },
        }
      )
    );
  } catch (err: any) {
    console.error("[public/home] error:", err);
    return withCors(
      NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      )
    );
  }
}
