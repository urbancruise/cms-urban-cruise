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

The public SEO API (`/api/public/seo?path=/your-page`) returns page metadata,
global defaults, active structured data, saved page content and image SEO data,
robots directives, and public verification/tracking IDs. The Urban Cruise
website consumes this API server-side for its existing routes and renders page
metadata in the HTML `<head>` and configured schemas as JSON-LD. Configure the
website's server-only `CMS_API_URL` and `CMS_API_KEY` to connect it to this CMS.
The CMS sitemap and `robots.txt` routes use the SEO records and saved robots
directives from the database.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
