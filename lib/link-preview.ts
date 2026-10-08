import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type LinkPreview = {
  title?: string;
  outlet?: string;
  excerpt?: string;
  imageUrl?: string;
  publishedAt?: Date;
};

const PRIVATE = [/^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^0\./, /^::1$/, /^f[cd]/i, /^fe80/i];

async function isPublicHost(host: string) {
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  const addrs = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  return addrs.length > 0 && addrs.every((a) => !PRIVATE.some((re) => re.test(a)));
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();

function meta(html: string, ...names: string[]) {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`,
      "i",
    );
    const m = html.match(re);
    const v = m?.[1] ?? m?.[2];
    if (v) return decode(v);
  }
  return undefined;
}

/**
 * Reads Open Graph details from a public web page so admins only need to paste
 * a link. Some platforms (often Facebook and Instagram) block this; the admin
 * then fills the title by hand.
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  try {
    // Follow redirects by hand so every hop is checked against private addresses.
    let u = new URL(url);
    let res: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      if (!/^https?:$/.test(u.protocol) || !(await isPublicHost(u.hostname))) return {};
      res = await fetch(u, {
        redirect: "manual",
        signal: AbortSignal.timeout(6000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; KUZANA-LinkPreview/1.0)",
          Accept: "text/html",
        },
      });
      const next = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (!next) break;
      u = new URL(next, u);
    }
    if (!res) return {};
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return {};
    // Only the head matters; cap what we read.
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const dec = new TextDecoder();
      while (html.length < 400_000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += dec.decode(value, { stream: true });
        if (html.includes("</head>")) break;
      }
      void reader.cancel();
    }
    const title = meta(html, "og:title", "twitter:title") ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];
    const published = meta(html, "article:published_time", "og:published_time", "date");
    const date = published ? new Date(published) : undefined;
    const image = meta(html, "og:image", "twitter:image");
    return {
      title: title ? decode(title).slice(0, 300) : undefined,
      outlet: meta(html, "og:site_name")?.slice(0, 120),
      excerpt: meta(html, "og:description", "description", "twitter:description")?.slice(0, 400),
      imageUrl: image && /^https?:\/\//.test(image) ? image.slice(0, 1000) : undefined,
      publishedAt: date && !Number.isNaN(date.getTime()) ? date : undefined,
    };
  } catch (e) {
    console.warn("Link preview failed:", url, (e as Error & { cause?: Error }).cause?.message ?? (e as Error).message);
    return {};
  }
}
