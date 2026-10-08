import type { MentionPlatform } from "@/lib/generated/prisma/enums";

export const PLATFORM_LABELS: Record<MentionPlatform, string> = {
  WEBSITE: "Website",
  NEWS: "News",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  X: "X",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
  RADIO: "Radio",
  TV: "TV",
  OTHER: "Other",
};

/** Guesses the platform from a link's host. */
export function detectPlatform(url: string): MentionPlatform {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "OTHER";
  }
  if (/(^|\.)facebook\.com$|(^|\.)fb\.watch$/.test(host)) return "FACEBOOK";
  if (/(^|\.)instagram\.com$/.test(host)) return "INSTAGRAM";
  if (/(^|\.)(x|twitter)\.com$/.test(host)) return "X";
  if (/(^|\.)youtube\.com$|^youtu\.be$/.test(host)) return "YOUTUBE";
  if (/(^|\.)tiktok\.com$/.test(host)) return "TIKTOK";
  if (/(^|\.)linkedin\.com$/.test(host)) return "LINKEDIN";
  if (/herald|chronicle|newsday|news|zimlive|nehanda|zbc|thezimbabwe|bulawayo24|dailynews|263chat|pindula/.test(host)) return "NEWS";
  return "WEBSITE";
}

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/**
 * Splits items into `n` columns, always adding to the currently shortest
 * column, so the columns end at roughly the same height while reading order
 * stays left to right.
 */
export function balanceColumns<T>(items: T[], n: number, weight: (item: T) => number): T[][] {
  const cols: T[][] = Array.from({ length: n }, () => []);
  const heights = new Array(n).fill(0);
  for (const item of items) {
    const i = heights.indexOf(Math.min(...heights));
    cols[i].push(item);
    heights[i] += weight(item);
  }
  return cols;
}
