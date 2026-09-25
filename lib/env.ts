// Environment validation — fail fast at startup

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val || val.trim() === "") {
    throw new Error(
      `[env] Missing required environment variable: ${key}. ` +
        `Add it to your .env.local file.`
    );
  }
  return val;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

export const env = {
  // DB
  DB_HOST: optionalEnv("DB_HOST", "localhost"),
  DB_USER: optionalEnv("DB_USER", "root"),
  DB_PASSWORD: optionalEnv("DB_PASSWORD", ""),
  DB_NAME: optionalEnv("DB_NAME", "urban_cruise"),

  // JWT — required in production
  JWT_SECRET:
    process.env.NODE_ENV === "production"
      ? requireEnv("JWT_SECRET")
      : optionalEnv("JWT_SECRET", "dev_only_insecure_secret_change_me"),
  JWT_EXPIRES_IN: optionalEnv("JWT_EXPIRES_IN", "7d"),

  // Cookies
  COOKIE_SECURE: optionalEnv("COOKIE_SECURE", "false") === "true",
  IS_PROD: process.env.NODE_ENV === "production",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: optionalEnv("CLOUDINARY_CLOUD_NAME", ""),
  CLOUDINARY_API_KEY: optionalEnv("CLOUDINARY_API_KEY", ""),
  CLOUDINARY_API_SECRET: optionalEnv("CLOUDINARY_API_SECRET", ""),
  CLOUDINARY_UPLOAD_FOLDER: optionalEnv(
    "CLOUDINARY_UPLOAD_FOLDER",
    "urban_cruise/avatars"
  ),

  // Public API
  PUBLIC_API_KEY: optionalEnv("PUBLIC_API_KEY", ""),
  WEBSITE_ORIGIN: optionalEnv("WEBSITE_ORIGIN", "http://localhost:3000"),
  REVALIDATE_SECRET: optionalEnv("REVALIDATE_SECRET", ""),
} as const;
