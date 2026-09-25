"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineCheckCircle,
  MdOutlineWarning,
  MdOutlineError,
  MdOutlineAutoFixHigh,
  MdOutlineDelete,
} from "react-icons/md";

// ============================================================
// Types
// ============================================================
interface ParsedBlock {
  index: number;
  text: string;
  data: any | null;
  error: string | null;
  type: string;
}

interface SchemaEditorProps {
  value: string; // raw textarea content
  onChange: (value: string) => void;
  /** Called with the parsed array after every commit */
  onParsedChange?: (parsed: any[] | null, hasError: boolean) => void;
}

// ============================================================
// Presets
// ============================================================
const PRESETS: { label: string; emoji: string; json: string }[] = [
  {
    label: "FAQ",
    emoji: "❓",
    json: `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Your question here?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Your answer here."
      }
    }
  ]
}`,
  },
  {
    label: "Product",
    emoji: "📦",
    json: `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product name",
  "description": "Product description",
  "image": ["https://example.com/image.png"],
  "brand": {
    "@type": "Brand",
    "name": "Urban Cruise"
  },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "INR",
    "lowPrice": "0",
    "offerCount": "1"
  }
}`,
  },
  {
    label: "Travel Agency",
    emoji: "🚐",
    json: `{
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "name": "Urban Cruise",
  "image": "https://urbancruise.in/logo.png",
  "url": "https://urbancruise.in/",
  "telephone": "+91-98765-43210",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "B-14, Gali no. 10, Shashi Garden",
    "addressLocality": "Delhi",
    "postalCode": "110091",
    "addressCountry": "IN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 28.6105303,
    "longitude": 77.2948251
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "06:00",
    "closes": "23:30"
  }
}`,
  },
  {
    label: "Local Business",
    emoji: "📍",
    json: `{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Urban Cruise",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Delhi",
    "addressCountry": "IN"
  },
  "telephone": "+91-98765-43210"
}`,
  },
  {
    label: "Breadcrumb",
    emoji: "🧭",
    json: `{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://urbancruise.in"
    }
  ]
}`,
  },
  {
    label: "Organization",
    emoji: "🏢",
    json: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Urban Cruise",
  "url": "https://urbancruise.in",
  "logo": "https://urbancruise.in/logo.png"
}`,
  },
  {
    label: "WebSite",
    emoji: "🌐",
    json: `{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Urban Cruise",
  "url": "https://urbancruise.in"
}`,
  },
];

// ============================================================
// Parse helpers
// ============================================================
function splitBlocks(raw: string): string[] {
  return raw
    .split(/^\s*---\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean);
}

function parseBlocks(raw: string): ParsedBlock[] {
  const parts = splitBlocks(raw);
  return parts.map((text, index) => {
    try {
      const data = JSON.parse(text);
      const type = Array.isArray(data)
        ? "Array"
        : data?.["@type"] || "Unknown";
      return { index, text, data, error: null, type };
    } catch (err: any) {
      return {
        index,
        text,
        data: null,
        error: err.message || "Invalid JSON",
        type: "Invalid",
      };
    }
  });
}

// ============================================================
// Main component
// ============================================================
export default function SchemaEditor({
  value,
  onChange,
  onParsedChange,
}: SchemaEditorProps) {
  const [formatError, setFormatError] = useState<string | null>(null);

  const blocks = useMemo(() => parseBlocks(value), [value]);
  const hasError = blocks.some((b) => b.error);

  // Notify parent of parse result — runs AFTER commit, never during render
  useEffect(() => {
    if (!onParsedChange) return;

    if (blocks.length === 0) {
      onParsedChange(null, false);
      return;
    }
    if (hasError) {
      onParsedChange(null, true);
      return;
    }
    onParsedChange(
      blocks.map((b) => b.data),
      false
    );
  }, [blocks, hasError, onParsedChange]);

  // ----------------------------------------------------------
  // Actions
  // ----------------------------------------------------------
  const insertPreset = (json: string) => {
    setFormatError(null);
    const trimmed = value.trim();
    const next = trimmed ? `${trimmed}\n\n---\n\n${json}` : json;
    onChange(next);
  };

  const formatAll = () => {
    setFormatError(null);
    if (blocks.length === 0) return;
    if (hasError) {
      setFormatError("Fix JSON errors before formatting");
      return;
    }
    const formatted = blocks
      .map((b) => JSON.stringify(b.data, null, 2))
      .join("\n\n---\n\n");
    onChange(formatted);
  };

  const removeBlock = (index: number) => {
    const next = blocks
      .filter((b) => b.index !== index)
      .map((b) => b.text)
      .join("\n\n---\n\n");
    onChange(next);
  };

  const clearAll = () => {
    if (!confirm("Clear all schema blocks?")) return;
    onChange("");
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  const totalChars = value.length;
  const okCount = blocks.filter((b) => !b.error).length;

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-medium text-slate-700 mr-1">
          Insert preset:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => insertPreset(p.json)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors"
            title={`Insert ${p.label} schema`}
          >
            <span>{p.emoji}</span>
            {p.label}
          </button>
        ))}

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={formatAll}
            disabled={blocks.length === 0 || hasError}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Pretty-print all blocks"
          >
            <MdOutlineAutoFixHigh className="w-3.5 h-3.5" />
            Format
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={blocks.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <MdOutlineDelete className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-slate-500">
            <span className="font-semibold text-slate-800">
              {blocks.length}
            </span>{" "}
            block{blocks.length !== 1 ? "s" : ""}
            {blocks.length > 0 && (
              <>
                {" "}
                ·{" "}
                <span className="font-semibold text-green-600">
                  {okCount}
                </span>{" "}
                valid
                {hasError && (
                  <>
                    {" "}
                    ·{" "}
                    <span className="font-semibold text-red-600">
                      {blocks.length - okCount}
                    </span>{" "}
                    invalid
                  </>
                )}
              </>
            )}
          </span>
          <span className="text-slate-400">{totalChars} chars</span>
        </div>

        {hasError ? (
          <span className="flex items-center gap-1 text-red-600 font-medium">
            <MdOutlineError className="w-3.5 h-3.5" />
            Fix errors before saving
          </span>
        ) : blocks.length > 0 ? (
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <MdOutlineCheckCircle className="w-3.5 h-3.5" />
            All blocks valid
          </span>
        ) : (
          <span className="flex items-center gap-1 text-slate-400">
            <MdOutlineWarning className="w-3.5 h-3.5" />
            No schema (optional)
          </span>
        )}
      </div>

      {/* ── Textarea ── */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={18}
        spellCheck={false}
        placeholder={`Paste one or more JSON-LD blocks, separated by ---.

Example:

{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  ...
}

---

{
  "@context": "https://schema.org",
  "@type": "Product",
  ...
}`}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
      />

      {formatError && (
        <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg">
          {formatError}
        </div>
      )}

      {/* ── Block summary list ── */}
      {blocks.length > 0 && (
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/40">
          {blocks.map((b) => (
            <div
              key={b.index}
              className="flex items-center gap-2 px-3 py-2 text-xs"
            >
              {b.error ? (
                <MdOutlineError className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              ) : (
                <MdOutlineCheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              )}

              <span className="font-mono text-slate-400 flex-shrink-0">
                #{b.index + 1}
              </span>

              {b.error ? (
                <span className="text-red-600 truncate flex-1">
                  {b.error}
                </span>
              ) : (
                <>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                    {b.type}
                  </span>
                  <span className="text-slate-500 truncate flex-1">
                    {Array.isArray(b.data)
                      ? `${b.data.length} items`
                      : b.data?.name ||
                        b.data?.headline ||
                        b.data?.["@id"] ||
                        "—"}
                  </span>
                </>
              )}

              <button
                type="button"
                onClick={() => removeBlock(b.index)}
                className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 flex-shrink-0"
                title="Remove this block"
              >
                <MdOutlineDelete className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-slate-400">
        Separator: a line containing only{" "}
        <code className="bg-slate-100 px-1 rounded">---</code>. Each block is
        stored as a separate entry and rendered as its own{" "}
        <code className="bg-slate-100 px-1 rounded">
          &lt;script type=&quot;application/ld+json&quot;&gt;
        </code>{" "}
        tag on the public page.
      </p>
    </div>
  );
}