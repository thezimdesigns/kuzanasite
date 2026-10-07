import "server-only";

/** Verifies a reCAPTCHA v3 token. Skipped when no secret is configured (local dev). */
export async function verifyRecaptcha(token: string | null | undefined, action: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean; score?: number; action?: string };
    const minScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? 0.5);
    return !!data.success && (data.score ?? 0) >= minScore && data.action === action;
  } catch {
    // Don't lock visitors out if Google is unreachable; rate limits still apply.
    return true;
  }
}
