// Centralized constants — no magic numbers in code

// Pagination
export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_USERS = 10;
export const PAGE_SIZE_SEO = 50;
export const PAGE_SIZE_SEO_MAX = 500;

// Image uploads
export const MAX_IMAGE_KB = 300;
export const MAX_IMAGE_BYTES = MAX_IMAGE_KB * 1024;
export const MAX_AVATAR_KB = 5000;
export const MAX_AVATAR_BYTES = MAX_AVATAR_KB * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_AUTH_MAX = 5;
export const RATE_LIMIT_ADMIN_MAX = 120;
export const RATE_LIMIT_UPLOAD_MAX = 40;

// UI
export const TOAST_DURATION_MS = 4000;
export const SEARCH_DEBOUNCE_MS = 400;

// Cache
export const SWR_DEDUPE_MS = 5_000;
export const CHUNKED_CACHE_MAX_ENTRIES = 50;

// Auth
export const JWT_COOKIE_NAME = "token";
export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";
