import "server-only";
import { parseLatLng, type LatLng } from "@/lib/geo";

const SHORT_LINK = /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//i;

/**
 * Resolves a pasted Google Maps link to coordinates. Short share links
 * (maps.app.goo.gl/…) are followed once to read the full URL.
 */
export async function resolveMapLink(input: string | null | undefined): Promise<{ point: LatLng | null; url: string | null }> {
  const raw = input?.trim();
  if (!raw) return { point: null, url: null };
  const direct = parseLatLng(raw);
  if (direct) return { point: direct, url: /^https?:\/\//.test(raw) ? raw : null };
  if (!SHORT_LINK.test(raw)) return { point: null, url: /^https?:\/\//.test(raw) ? raw : null };
  try {
    let url = raw;
    for (let hop = 0; hop < 4; hop++) {
      // Only ever request Google's own hosts.
      if (!/(^|\.)(google\.[a-z.]+|goo\.gl|g\.co)$/i.test(new URL(url).hostname)) break;
      const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
      const next = res.headers.get("location");
      if (!next) break;
      url = new URL(next, url).toString();
      const point = parseLatLng(url);
      if (point) return { point, url: raw };
    }
  } catch {
    // Offline or blocked: keep the link, coordinates can be added by hand.
  }
  return { point: null, url: raw };
}
