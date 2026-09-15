import type { MetadataRoute } from "next";
import { getEnv } from "@/config/env";
export const dynamic = "force-dynamic";
export default function sitemap(): MetadataRoute.Sitemap {
  const env = getEnv();
  return env.DEMO_MODE
    ? []
    : [
        "",
        "/studios",
        "/about",
        "/gallery",
        "/location",
        "/reviews",
        "/privacy",
        "/terms",
        "/cancellation",
      ].map((path) => ({ url: `${env.APP_URL}${path}` }));
}
