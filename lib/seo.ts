import type { Metadata } from "next";

/** Shown when a shared page has no picture of its own (1200×630). */
export const DEFAULT_SHARE_IMAGE = {
  url: "/brand/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "The KUZANA SCEEZ Creative Economy Conference stage at ZITF, Bulawayo",
};

type Share = {
  /** The page's own picture (absolute or site path); the default is used when empty. */
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
};

/**
 * Open Graph + Twitter card metadata that always carries a picture.
 * Next.js replaces the whole openGraph block when a page sets one, so every
 * page that customises sharing goes through here instead of setting it directly.
 */
export function shareMetadata({ image, imageAlt, type = "website", publishedTime }: Share = {}): Pick<Metadata, "openGraph" | "twitter"> {
  const images = image ? [{ url: image, alt: imageAlt ?? "" }] : [DEFAULT_SHARE_IMAGE];
  return {
    openGraph: {
      siteName: "KUZANA SCEEZ",
      locale: "en_GB",
      type,
      ...(publishedTime && { publishedTime }),
      images,
    },
    twitter: { card: "summary_large_image", images: images.map((i) => i.url) },
  };
}

/**
 * A schema.org Offer from a ticket's free-text price ("US$10", "$5", "Free",
 * "US$10 / ZiG 260": the first amount wins). Returns null when the text has no
 * price we can state truthfully, rather than guessing.
 */
export function ticketOffer(ticket: { name?: string | null; price: string | null; url?: string | null; soldOut?: boolean }, pageUrl: string, ended: boolean) {
  const text = ticket.price?.trim();
  if (!text) return null;
  const base = {
    "@type": "Offer",
    ...(ticket.name && { name: ticket.name }),
    url: ticket.url || pageUrl,
    // Availability only means something while tickets could still be bought.
    ...(!ended && { availability: ticket.soldOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock" }),
  };
  if (/^free\b/i.test(text)) return { ...base, price: 0, priceCurrency: "USD" };
  const amount = text.match(/\d+(?:[.,]\d{1,2})?/);
  if (!amount) return null;
  const before = text.slice(0, amount.index);
  const currency = /zi?g|zwg/i.test(before) ? "ZWG" : /zar|\bR\s*$/i.test(before) ? "ZAR" : /\$|usd/i.test(before) ? "USD" : null;
  if (!currency) return null;
  return { ...base, price: Number(amount[0].replace(",", ".")), priceCurrency: currency };
}
