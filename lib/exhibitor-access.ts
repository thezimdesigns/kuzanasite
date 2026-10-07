import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * The public exhibitor registration form is unlisted: it only opens with the
 * access code printed in the QR codes handed out at the exhibition.
 */
export function exhibitorCodeValid(code: string | null | undefined) {
  const expected = process.env.EXHIBITOR_ACCESS_CODE;
  if (!expected) return true;
  if (!code) return false;
  const a = Buffer.from(code.trim().toUpperCase());
  const b = Buffer.from(expected.trim().toUpperCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

export function exhibitorRegistrationPath() {
  const code = process.env.EXHIBITOR_ACCESS_CODE;
  return code ? `/exhibitors/register?code=${encodeURIComponent(code)}` : "/exhibitors/register";
}
