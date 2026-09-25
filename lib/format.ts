// Pure formatting helpers — no side effects

/**
 * Extract initials from a name.
 * "John Doe" → "JD" ; "Alice" → "AL" ; "" → "?"
 */
export function getInitials(name?: string | null): string {
  if (!name) return "?";
  const clean = name.trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
}

/**
 * Human-readable relative time.
 */
export function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * URL-safe slug from a name.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Role badge Tailwind classes.
 */
export function getRoleBadgeColor(slug?: string | null): string {
  switch (slug?.toLowerCase()) {
    case "admin":
      return "bg-red-50 text-red-700 border border-red-200";
    case "manager":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    default:
      return "bg-teal-50 text-teal-700 border border-teal-200";
  }
}

/**
 * Status badge Tailwind classes.
 */
export function getStatusBadgeColor(isActive: boolean): string {
  return isActive
    ? "bg-teal-50 text-teal-700 border border-teal-200"
    : "bg-slate-100 text-slate-600 border border-slate-200";
}

/**
 * Format Indian date (short).
 */
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format Indian datetime (short).
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a value for display in an activity diff.
 */
export function formatActivityValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) return `[${v.join(", ")}]`;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
