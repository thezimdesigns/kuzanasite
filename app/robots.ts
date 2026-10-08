import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/exhibitors/register", "/exhibitors/claim/", "/unsubscribe/", "/search", "/qa-screen/"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
