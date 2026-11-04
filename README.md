This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## SEO management setup

Run `database.sql` against the CMS database to create the SEO tables. The script
uses `CREATE TABLE IF NOT EXISTS`, so it can also be re-run on an existing
database to add tables that are missing.

The Google Search Console and Google Analytics reports use a Google service
account. Enable the Search Console API and Google Analytics Data API in Google
Cloud, add the service-account email as a user in the Search Console property
and GA4 property, then configure this server-only environment variable:

```text
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","client_email":"...","private_key":"..."}
```

Keep the complete service-account JSON in the deployment environment; do not
commit it or expose it as a `NEXT_PUBLIC_*` variable. Set the Search Console
property URL and GA4 property ID under SEO Settings. Core Web Vitals measurements
use real PageSpeed Insights field data; `GOOGLE_PAGESPEED_API_KEY` is optional
but recommended to avoid public API quota limits. Enable the PageSpeed Insights
API in Google Cloud, create an API key restricted to that API, and set
`GOOGLE_PAGESPEED_API_KEY` in the server environment (or `.env.local` for local
development). Restart the app after changing the environment. Each measurement
run issues at most two PageSpeed requests concurrently. Only pages with
available field data receive numeric Core Web Vitals results.

## Website blog CMS

The Website Blog editor stores posts with a title, editable URL slug, paragraph, uploaded image,
one or more vehicle categories, one or more cities, and draft/published status.
The paragraph field supports rich-text formatting and inline image uploads.
For an existing CMS database, run
`migrations/20261103_create_website_blogs.sql` followed by
`migrations/20261103_add_website_blog_cities.sql` and
`migrations/20261104_add_website_blog_slug.sql`. New databases get the
complete table from `database.sql`. Published posts appear on assigned city
blog pages; the global `/blog` page continues to show all published posts.
The Urban Cruise website uses its server-side `CMS_API_URL` and `CMS_API_KEY`
to load them.

The public SEO API (`/api/public/seo?path=/your-page`) returns page metadata,
global defaults, active structured data, saved page content and image SEO data,
robots directives, and public verification/tracking IDs. The Urban Cruise
website consumes this API server-side for its existing routes and renders page
metadata in the HTML `<head>` and configured schemas as JSON-LD. Configure the
website's server-only `CMS_API_URL` and `CMS_API_KEY` to connect it to this CMS.
The CMS sitemap and `robots.txt` routes use the SEO records and saved robots
directives from the database.

## Get a Quote API

Run the `quote_requests` section in `database.sql` to create the table before
using these endpoints. Quote APIs use the CMS API key for website-to-CMS
requests; keep that key on the website server and never expose it in browser
code.

1. When the customer clicks **Verify**, save their contact details:

   `POST /api/public/quotes`

   ```json
   {
     "full_name": "A Customer",
     "phone_number": "+91 9876543210",
     "page_url": "/gurugram/get-a-quotation-route-infomation"
   }
   ```

   Send the key in the `x-api-key` header. The response includes `quote_id` and
   a one-time `quote_token`; keep both temporarily for the next step. This step
   saves a draft only; it does not perform OTP verification. Send the city for
   The CMS reads the first URL path segment (here, `gurugram`) and matches it
   against active CMS cities. Browser requests can use the `Referer` header;
   server-to-server website requests should include `page_url` as shown. This
   website location is separate from the trip's pickup and drop-off addresses.

2. On **Submit Enquiry**, send the rest of the form to
   `PUT /api/public/quotes/{quote_id}` with the same `x-api-key` and the
   returned `x-quote-token` header:

   ```json
   {
     "full_name": "A Customer",
     "phone_number": "+91 9876543210",
     "email": "customer@example.com",
     "message": "Optional request",
     "page_url": "/gurugram/get-a-quotation-route-infomation",
     "pickup_address": "Delhi",
     "pickup_date": "2026-11-15",
     "drop_address": "Manali",
     "drop_date": "2026-11-18",
     "travel_itinerary": "Delhi - Manali - Shimla - Delhi",
     "passenger_count": 3,
     "luggage_count": 2,
     "vehicle_category": "Premium",
     "vehicle_name": "Tempo Traveller"
   }
   ```

   Vehicle categories are `Economy`, `Premium`, `Royal`, and `Royal VIP`.
   Include `page_url` in website-to-CMS requests when they are sent server to
   server. The CMS derives the city from its first path segment and stores the
   matching active city name.
   `vehicle_name` is not a fixed list, so the website can add fleet options
   such as Tempo Traveller, Urbania, Mini Bus, Luxury Bus, Semi/Sleeper Bus,
   Luxury Car/SUV, SUV, and Car without changing this API.

CMS admins can manage quotes with the authenticated admin API:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/quotes?status=submitted&city=Delhi&date_from=2026-11-01&date_to=2026-11-30&limit=50&offset=0` | List/search/filter quotes by website city and inclusive received-date range; response includes active city options |
| `GET` | `/api/admin/quotes?city=__unassigned__` | List quotes whose website city has not been provided |
| `POST` | `/api/admin/quotes` | Create a complete quote |
| `GET` | `/api/admin/quotes/{id}` | Read one quote |
| `PUT` | `/api/admin/quotes/{id}` | Update quote fields |
| `DELETE` | `/api/admin/quotes/{id}` | Delete a quote |

The Get a Quote admin list displays six requests per page and supports
previous/next navigation.

These admin endpoints require the CMS admin login cookie. A phone number is
only recorded at the first step; connect an OTP provider separately if actual
phone ownership verification is required.

The Get a Quote admin page displays a toast when a customer verifies their
contact details and another when they submit the completed quote. For an
existing database, run
[`migrations/20261102_create_quote_request_events.sql`](./migrations/20261102_create_quote_request_events.sql)
to enable quote event notifications. Keep the page open to receive new alerts.

For an existing database, run
[`migrations/20261031_add_quote_city.sql`](./migrations/20261031_add_quote_city.sql)
once before deploying this version. Existing quote rows have no website-city
value; only newly submitted quotes (or rows manually backfilled with the
correct website city) can be filtered by their website location.

## Get a Quick Call API

Run [`migrations/20261102_create_quick_call_requests.sql`](./migrations/20261102_create_quick_call_requests.sql)
on an existing database before using the quick call form. Submit the website
form to `POST /api/public/quick-calls` with the CMS API key in the `x-api-key`
header and a JSON body containing `name` and `phone_number`:

```json
{
  "name": "A Customer",
  "phone_number": "+91 9876543210"
}
```

For city-wise filtering, include `page_url` when the request is sent server to
server. Browser requests can use the `Referer` header. The CMS matches the first
URL path segment to an active city. An optional `city` can also be sent when
there is no city in the page URL:

```json
{
  "name": "A Customer",
  "phone_number": "+91 9876543210",
  "page_url": "/gurugram/get-a-quick-call"
}
```

Keep the API key on the website server; do not expose it in browser code. The
admin submissions list is available under **Urban Cruise Website → Get a Quick
Call** and requires the `urbancruise.quickcalls.view` permission. On an existing
database, run [`migrations/20261102_add_quick_call_city.sql`](./migrations/20261102_add_quick_call_city.sql)
to add city storage. Requests submitted before this change have no city and
appear under **City not provided**.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/public/quick-calls` | Save a website quick call request |
| `GET` | `/api/admin/quick-calls?search=...&city=Delhi&date_from=2026-11-01&date_to=2026-11-30&limit=50&offset=0` | List/search/filter quick call requests by city and inclusive date range |
| `PUT` | `/api/admin/quick-calls/:id` | Update a request's name, phone number, or city (admin only) |
| `DELETE` | `/api/admin/quick-calls/:id` | Delete a request (admin only) |

The Get a Quick Call admin list displays nine requests per page and supports
previous/next navigation.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
