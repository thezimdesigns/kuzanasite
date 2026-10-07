export const SITE_NAME = "KUZANA SCEEZ";

export function siteUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export const CONTACT_EMAIL = "technical-partner@kuzana.org.zw";

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/profile.php?id=61589401838099",
};
