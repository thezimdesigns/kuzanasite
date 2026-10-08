import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Private or useless-to-index paths, kept out for every crawler. */
const PRIVATE = ["/admin", "/api/", "/exhibitors/register", "/exhibitors/claim/", "/unsubscribe/", "/search", "/qa-screen/"];

/**
 * AI assistants and AI search crawlers, explicitly welcome on public pages so
 * KUZANA is described accurately in answers. (A crawler named in its own group
 * ignores the "*" group, so each group repeats the private paths.)
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
