import type { MetadataRoute } from "next";
import { getEnv } from "@/config/env";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  const env = getEnv();
  return {
    rules: {
      userAgent: "*",
      disallow: env.DEMO_MODE ? "/" : ["/admin", "/auth", "/booking", "/api"],
    },
    ...(env.DEMO_MODE ? {} : { sitemap: `${env.APP_URL}/sitemap.xml` }),
  };
}
