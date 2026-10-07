import { createSign } from "node:crypto";
import { HttpError } from "@/lib/http-error";

interface GoogleServiceAccount {
  client_email: string;
  private_key: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
}

interface GoogleApiError {
  error?: {
    message?: string;
  };
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
  scope: string;
}

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
let cachedToken: CachedToken | null = null;

function getServiceAccount(): GoogleServiceAccount {
  const value = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!value) {
    throw new HttpError(
      503,
      "Google reporting is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON on the server."
    );
  }

  let credentials: GoogleServiceAccount;
  try {
    credentials = JSON.parse(value) as GoogleServiceAccount;
  } catch {
    throw new HttpError(503, "GOOGLE_SERVICE_ACCOUNT_JSON must contain valid JSON.");
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new HttpError(
      503,
      "Google service account JSON must include client_email and private_key."
    );
  }
  return credentials;
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

export async function getGoogleAccessToken(scope: string): Promise<string> {
  if (
    cachedToken?.scope === scope &&
    cachedToken.expiresAt > Date.now() + 60_000
  ) {
    return cachedToken.accessToken;
  }

  const credentials = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(
    JSON.stringify({
      iss: credentials.client_email,
      scope,
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const unsignedToken = `${header}.${claims}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  let signature: string;
  try {
    signature = signer.sign(credentials.private_key).toString("base64url");
  } catch {
    throw new HttpError(503, "The Google service account private key is invalid.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsignedToken}.${signature}`,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new HttpError(502, "Google authentication failed. Check the service account configuration.");
  }

  const result = (await response.json()) as GoogleTokenResponse;
  cachedToken = {
    accessToken: result.access_token,
    expiresAt: Date.now() + result.expires_in * 1000,
    scope,
  };
  return result.access_token;
}

export async function googleApiPost<T>(
  url: string,
  accessToken: string,
  body: unknown
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    let message = `Google API request failed with status ${response.status}.`;
    try {
      const result = (await response.json()) as GoogleApiError;
      if (result.error?.message) message = result.error.message;
    } catch {
      // Keep the status-based error when Google returns a non-JSON response.
    }
    throw new HttpError(response.status === 401 ? 502 : response.status, message);
  }

  return (await response.json()) as T;
}

export function defaultGoogleDateRange() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  const format = (date: Date) => date.toISOString().slice(0, 10);
  return { startDate: format(start), endDate: format(end) };
}
