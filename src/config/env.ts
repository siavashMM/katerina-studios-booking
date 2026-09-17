import { z } from "zod";
import { productionContentApproved } from "../content/release";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);
const optionalTrimmedString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).max(512).optional(),
);
const booleanString = (fallback: "true" | "false") =>
  z
    .enum(["true", "false"])
    .default(fallback)
    .transform((value) => value === "true");
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: optionalString,
  DEMO_MODE: booleanString("true"),
  BOOKING_MODE: z.literal("request").default("request"),
  PROPERTY_DATA_VERIFIED: booleanString("false"),
  AUTH0_DOMAIN: optionalString,
  AUTH0_CLIENT_ID: optionalString,
  AUTH0_CLIENT_SECRET: optionalString,
  AUTH0_SECRET: optionalString,
  AUTH0_MFA_CLAIM: z.url().default("https://katerinastudios.example/mfa"),
  AUTH0_TEST_INSECURE: booleanString("false"),
  RESEND_API_KEY: optionalString,
  RESEND_WEBHOOK_SECRET: optionalString,
  EMAIL_FROM: optionalString,
  OWNER_NOTIFICATION_EMAIL: optionalString,
  REAL_EMAIL_TEST: booleanString("false"),
  MEDIA_STORAGE: z.enum(["local", "disabled"]).default("local"),
  ICAL_ENCRYPTION_KEY: optionalString,
  ICAL_EXPORT_SECRET: optionalString,
  GOOGLE_PLACES_API_KEY: optionalTrimmedString,
  GOOGLE_PLACE_ID: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .string()
      .trim()
      .min(1)
      .max(512)
      .regex(/^[A-Za-z0-9_-]+$/)
      .optional(),
  ),
  GOOGLE_MAPS_URL: z.preprocess((value) => (value === "" ? undefined : value), z.url().optional()),
  RATE_LIMIT_SECRET: optionalString,
  RECEIPT_SECRET: optionalString,
  TRUST_PROXY: z.enum(["none", "single", "cloudflare"]).default("none"),
});

export type Environment = z.infer<typeof schema>;

export function parseEnv(input: Record<string, string | undefined>): Environment {
  const result = schema.safeParse(input);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))].join(", ");
    throw new Error(`Invalid configuration: ${names}.`);
  }
  const env = result.data;
  const appUrl = new URL(env.APP_URL);
  if (
    !["https:", "http:"].includes(appUrl.protocol) ||
    appUrl.username ||
    appUrl.password ||
    appUrl.search ||
    appUrl.hash ||
    appUrl.pathname !== "/"
  ) {
    throw new Error("APP_URL must be an origin without a path.");
  }
  if (env.AUTH0_TEST_INSECURE && env.NODE_ENV !== "test") {
    throw new Error("AUTH0_TEST_INSECURE is only available to the test process.");
  }
  if (env.REAL_EMAIL_TEST && env.NODE_ENV !== "development") {
    throw new Error("REAL_EMAIL_TEST is only available in development.");
  }
  if (Boolean(env.GOOGLE_PLACES_API_KEY) !== Boolean(env.GOOGLE_PLACE_ID)) {
    throw new Error("Invalid configuration: GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID.");
  }
  if (env.GOOGLE_MAPS_URL) {
    const googleMapsUrl = new URL(env.GOOGLE_MAPS_URL);
    const googleHost =
      googleMapsUrl.hostname === "google.com" ||
      googleMapsUrl.hostname.endsWith(".google.com") ||
      googleMapsUrl.hostname === "maps.app.goo.gl";
    if (googleMapsUrl.protocol !== "https:" || !googleHost) {
      throw new Error("Invalid configuration: GOOGLE_MAPS_URL.");
    }
  }
  return env;
}

// Read configuration when it is needed. Builds do not need service credentials.
export function getEnv(): Environment {
  return parseEnv(process.env);
}

export function googleReviewsConfigured(env = getEnv()): boolean {
  return Boolean(env.GOOGLE_PLACES_API_KEY && env.GOOGLE_PLACE_ID);
}

export function authConfigured(env = getEnv()): boolean {
  return Boolean(
    env.DATABASE_URL &&
    env.AUTH0_DOMAIN &&
    env.AUTH0_CLIENT_ID &&
    env.AUTH0_CLIENT_SECRET &&
    env.AUTH0_SECRET &&
    /^[a-f\d]{64}$/i.test(env.AUTH0_SECRET),
  );
}

export function authIssuer(env = getEnv()): string {
  if (!env.AUTH0_DOMAIN) throw new Error("AUTH0_DOMAIN is required.");
  const url = new URL(
    env.AUTH0_DOMAIN.includes("://") ? env.AUTH0_DOMAIN : `https://${env.AUTH0_DOMAIN}`,
  );
  if (
    url.protocol !== "https:" &&
    !(
      env.NODE_ENV === "test" &&
      env.AUTH0_TEST_INSECURE &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
  ) {
    throw new Error("The authentication issuer must use HTTPS.");
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/")
    throw new Error("The authentication issuer must be an origin.");
  return `${url.origin}/`;
}

export function readinessIssues(env = getEnv()): string[] {
  const issues: string[] = [];
  if (!env.DATABASE_URL) issues.push("DATABASE_NOT_CONFIGURED");
  if (!env.RATE_LIMIT_SECRET || env.RATE_LIMIT_SECRET.length < 32)
    issues.push("RATE_LIMIT_SECRET_REQUIRED");
  if (!env.RECEIPT_SECRET || env.RECEIPT_SECRET.length < 32) issues.push("RECEIPT_SECRET_REQUIRED");
  if (
    (!env.DEMO_MODE || env.REAL_EMAIL_TEST) &&
    (!env.RESEND_API_KEY || !env.EMAIL_FROM || !env.OWNER_NOTIFICATION_EMAIL)
  )
    issues.push("EMAIL_NOT_CONFIGURED");
  if (!env.DEMO_MODE) {
    if (!productionContentApproved) issues.push("PUBLIC_CONTENT_NOT_APPROVED");
    if (env.DATABASE_URL) {
      try {
        if (new URL(env.DATABASE_URL).searchParams.get("sslmode") !== "verify-full")
          issues.push("DATABASE_VERIFIED_TLS_REQUIRED");
      } catch {
        issues.push("DATABASE_URL_INVALID");
      }
    }
    if (!env.APP_URL.startsWith("https://")) issues.push("APP_URL_HTTPS_REQUIRED");
    if (!env.PROPERTY_DATA_VERIFIED) issues.push("PROPERTY_DATA_NOT_VERIFIED");
    if (!authConfigured(env)) issues.push("AUTH_NOT_CONFIGURED");
    if (!env.RESEND_WEBHOOK_SECRET) issues.push("EMAIL_WEBHOOK_NOT_CONFIGURED");
    if (env.TRUST_PROXY === "none") issues.push("TRUSTED_PROXY_NOT_CONFIGURED");
  }
  return issues;
}
