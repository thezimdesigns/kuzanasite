"use client";

import { useCallback, useEffect } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/** Loads reCAPTCHA v3 on demand and returns a token getter (empty string when not configured). */
export function useRecaptcha() {
  useEffect(() => {
    if (!SITE_KEY || document.getElementById("recaptcha-script")) return;
    const s = document.createElement("script");
    s.id = "recaptcha-script";
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return useCallback(async (action: string) => {
    if (!SITE_KEY || !window.grecaptcha) return "";
    try {
      return await new Promise<string>((resolve, reject) =>
        window.grecaptcha!.ready(() => window.grecaptcha!.execute(SITE_KEY, { action }).then(resolve, reject)),
      );
    } catch {
      return "";
    }
  }, []);
}
