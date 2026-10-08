import type { Metadata } from "next";

/** Shown when a shared page has no picture of its own (1200×630). */
export const DEFAULT_SHARE_IMAGE = {
  url: "/brand/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "The KUZANA SCEEZ 2026 Creative Economy Conference stage at ZITF, Bulawayo",
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
