"use client";

import { createContext, createElement, useCallback, useContext, useEffect, type ReactNode } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const RecaptchaContext = createContext<{ siteKey: string }>({ siteKey: "" });

/** Supplies the runtime reCAPTCHA site key (empty when switched off). */
export function RecaptchaProvider({ siteKey, children }: { siteKey: string; children: ReactNode }) {
  return createElement(RecaptchaContext.Provider, { value: { siteKey } }, children);
}

/** Loads reCAPTCHA v3 on demand and returns a token getter (empty string when switched off). */
export function useRecaptcha() {
  const { siteKey } = useContext(RecaptchaContext);

  useEffect(() => {
    if (!siteKey || document.getElementById("recaptcha-script")) return;
    const s = document.createElement("script");
    s.id = "recaptcha-script";
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    s.async = true;
    document.head.appendChild(s);
  }, [siteKey]);

  return useCallback(
    async (action: string) => {
      if (!siteKey || !window.grecaptcha) return "";
      try {
        return await new Promise<string>((resolve, reject) =>
          window.grecaptcha!.ready(() => window.grecaptcha!.execute(siteKey, { action }).then(resolve, reject)),
        );
      } catch {
        return "";
      }
    },
    [siteKey],
  );
}
