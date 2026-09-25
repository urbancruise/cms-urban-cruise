"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr-config";
import Link from "next/link";
import {
  MdOutlineTrendingUp,
  MdOutlineCheckCircle,
  MdOutlineWarning,
  MdOutlineError,
  MdOutlineArrowForward,
  MdOutlineRefresh,
  MdOutlineSearch,
  MdOutlineImage,
  MdOutlineLink,
  MdOutlineLinkOff,
  MdOutlineDescription,
  MdOutlineTitle,
  MdOutlinePublic,
  MdOutlineSmartToy,
  MdOutlineMap,
  MdOutlineSpeed,
} from "react-icons/md";
import { DashboardSkeleton } from "@/app/components/UI/PageSkeletons";

interface SeoStats {
  totalPages: number;
  indexedPages: number;
  noindexPages: number;
  missingMetaTitle: number;
  missingMetaDescription: number;
  missingAltTags: number;
  brokenLinks: number;
  canonicalIssues: number;
  schemaErrors: number;
  sitemapStatus: string;
  robotsStatus: string;
  coreWebVitalsStatus: string;
}

interface DashboardData {
  healthScore: number;
  stats: SeoStats;
}

export default function SeoDashboardPage() {
  const [selectedCity, setSelectedCity] = useState<number | null>(null);

  const { data: citiesData } = useSWR<{ cities: { id: number; name: string }[] }>(
    "/api/admin/cities?active=true",
    fetcher
  );
  const cities = citiesData?.cities || [];

  const url = selectedCity
    ? `/api/admin/seo/dashboard?city_id=${selectedCity}`
    : `/api/admin/seo/dashboard`;

  const { data, isLoading, mutate } = useSWR<DashboardData>(url, fetcher, {
    refreshInterval: 60000,
  });

  if (isLoading && !data) return <DashboardSkeleton />;

  const stats = data?.stats;
  const score = data?.healthScore ?? 0;

  const scoreColor =
    score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-500" : "text-red-600";

  const scoreBg =
    score >= 80
      ? "from-green-50 to-green-100"
      : score >= 60
        ? "from-amber-50 to-amber-100"
        : "from-red-50 to-red-100";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <MdOutlineSearch className="w-8 h-8 text-teal-600" />
            SEO Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Monitor your website&apos;s SEO health and performance
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
          title="Refresh"
        >
          <MdOutlineRefresh className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
          City:
        </span>
        <button
          onClick={() => setSelectedCity(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCity === null
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-700 hover:border-teal-400"
          }`}
        >
          All Cities
        </button>
        {cities.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCity(c.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCity === c.id
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-700 hover:border-teal-400"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div
        className={`rounded-2xl p-8 mb-8 bg-gradient-to-br ${scoreBg} border border-slate-200`}
      >
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/60"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${(score / 100) * 352} 352`}
                  className={scoreColor}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
                <span className="text-xs text-slate-600">/ 100</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">SEO Health Score</h2>
              <p className="text-slate-600 mt-1">
                {score >= 80
                  ? "Excellent — your site is well-optimized"
                  : score >= 60
                    ? "Good — a few improvements needed"
                    : "Needs attention — several issues detected"}
              </p>
            </div>
          </div>

          <Link
            href="/admin/seo/audit"
            className="flex items-center gap-2 px-5 py-3 bg-white text-slate-800 rounded-lg font-medium shadow-sm hover:shadow-md transition-shadow"
          >
            Run Full Audit
            <MdOutlineArrowForward className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={MdOutlineDescription}
          label="Total Pages"
          value={stats?.totalPages ?? 0}
          sub={`${stats?.indexedPages ?? 0} indexed`}
          color="teal"
        />
        <StatCard
          icon={MdOutlineCheckCircle}
          label="Indexed Pages"
          value={stats?.indexedPages ?? 0}
          sub={`${stats?.noindexPages ?? 0} noindex`}
          color="green"
        />
        <StatCard
          icon={MdOutlineTitle}
          label="Missing Meta Title"
          value={stats?.missingMetaTitle ?? 0}
          sub="Pages need attention"
          color="amber"
          href="/admin/seo/pages?filter=missing_title"
        />
        <StatCard
          icon={MdOutlineDescription}
          label="Missing Meta Description"
          value={stats?.missingMetaDescription ?? 0}
          sub="Pages need attention"
          color="amber"
          href="/admin/seo/pages?filter=missing_description"
        />
        <StatCard
          icon={MdOutlineImage}
          label="Missing Alt Tags"
          value={stats?.missingAltTags ?? 0}
          sub="Images need alt text"
          color="amber"
          href="/admin/seo/images?filter=missing_alt"
        />
        <StatCard
          icon={MdOutlineLinkOff}
          label="Broken Links"
          value={stats?.brokenLinks ?? 0}
          sub="Fix immediately"
          color={stats?.brokenLinks ? "red" : "green"}
          href="/admin/seo/internal-links"
        />
        <StatCard
          icon={MdOutlineLink}
          label="Canonical Issues"
          value={stats?.canonicalIssues ?? 0}
          sub="Duplicate content risk"
          color={stats?.canonicalIssues ? "amber" : "green"}
          href="/admin/seo/urls"
        />
        <StatCard
          icon={MdOutlineSmartToy}
          label="Schema Errors"
          value={stats?.schemaErrors ?? 0}
          sub="Structured data issues"
          color={stats?.schemaErrors ? "amber" : "green"}
          href="/admin/seo/schema"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatusCard
          icon={MdOutlineMap}
          label="Sitemap"
          status={stats?.sitemapStatus || "ok"}
          href="/admin/seo/sitemap"
        />
        <StatusCard
          icon={MdOutlinePublic}
          label="Robots.txt"
          status={stats?.robotsStatus || "ok"}
          href="/admin/seo/robots"
        />
        <StatusCard
          icon={MdOutlineSpeed}
          label="Core Web Vitals"
          status={stats?.coreWebVitalsStatus || "ok"}
          href="/admin/seo/cwv"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction
            label="Page SEO"
            href="/admin/seo/pages"
            icon={MdOutlineDescription}
          />
          <QuickAction
            label="Keywords"
            href="/admin/seo/keywords"
            icon={MdOutlineTrendingUp}
          />
          <QuickAction
            label="Issues Center"
            href="/admin/seo/issues"
            icon={MdOutlineError}
          />
          <QuickAction
            label="SEO Settings"
            href="/admin/seo/settings"
            icon={MdOutlineSearch}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: any;
  label: string;
  value: number;
  sub?: string;
  color: "teal" | "green" | "amber" | "red";
  href?: string;
}) {
  const colors = {
    teal: "bg-teal-50 text-teal-600 border-teal-200",
    green: "bg-green-50 text-green-600 border-green-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
  }[color];

  const body = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colors}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        {href && <MdOutlineArrowForward className="w-4 h-4 text-slate-400" />}
      </div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );

  if (href) return <Link href={href}>{body}</Link>;
  return body;
}

function StatusCard({
  icon: Icon,
  label,
  status,
  href,
}: {
  icon: any;
  label: string;
  status: string;
  href: string;
}) {
  const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
    ok: {
      color: "bg-green-50 text-green-700 border-green-200",
      label: "Healthy",
      icon: MdOutlineCheckCircle,
    },
    warning: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Warning",
      icon: MdOutlineWarning,
    },
    needs_improvement: {
      color: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Needs Improvement",
      icon: MdOutlineWarning,
    },
    error: {
      color: "bg-red-50 text-red-700 border-red-200",
      label: "Error",
      icon: MdOutlineError,
    },
    poor: {
      color: "bg-red-50 text-red-700 border-red-200",
      label: "Poor",
      icon: MdOutlineError,
    },
  };

  const cfg = statusConfig[status] || statusConfig.ok;
  const StatusIcon = cfg.icon;

  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow block"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium border ${cfg.color} flex items-center gap-1`}
        >
          <StatusIcon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>
      <p className="font-semibold text-slate-900">{label}</p>
    </Link>
  );
}

function QuickAction({
  label,
  href,
  icon: Icon,
}: {
  label: string;
  href: string;
  icon: any;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all group"
    >
      <Icon className="w-5 h-5 text-teal-600" />
      <span className="font-medium text-slate-900 text-sm">{label}</span>
      <MdOutlineArrowForward className="w-4 h-4 text-slate-400 group-hover:text-teal-600 ml-auto transition-colors" />
    </Link>
  );
}
