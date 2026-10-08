import "server-only";

/**
 * reCAPTCHA v3 is off unless RECAPTCHA_ENABLED=true and both keys are set.
 * Toggle it in Coolify and restart; no rebuild is needed.
 */
export function recaptchaConfig() {
  const siteKey = process.env.RECAPTCHA_SITE_KEY ?? "";
  const enabled = process.env.RECAPTCHA_ENABLED === "true" && !!siteKey && !!process.env.RECAPTCHA_SECRET_KEY;
  return { enabled, siteKey: enabled ? siteKey : "" };
}

/** Verifies a reCAPTCHA v3 token. Always passes while reCAPTCHA is switched off. */
export async function verifyRecaptcha(token: string | null | undefined, action: string) {
  if (!recaptchaConfig().enabled) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY!,
        response: token,
      }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as {
      success?: boolean;
      score?: number;
      action?: string;
    };
    const minScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? 0.5);
    return !!data.success && (data.score ?? 0) >= minScore && data.action === action;
  } catch {
    // Don't lock visitors out if Google is unreachable; rate limits still apply.
    return true;
  }
}
