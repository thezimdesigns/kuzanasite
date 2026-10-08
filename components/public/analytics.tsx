import Script from "next/script";

/** GA4 measurement IDs look like G-ABC123XYZ. */
const valid = (id: string | undefined): id is string => !!id && /^G-[A-Z0-9]{4,20}$/.test(id);

/**
 * Google Analytics 4, only when GA_MEASUREMENT_ID is set (read at runtime, so
 * Coolify can switch it on or off with a restart). Public pages only; the
 * admin never loads it. GA4 counts in-app page changes through its
 * "page changes based on browser history" enhanced measurement.
 */
export function Analytics() {
  const id = process.env.GA_MEASUREMENT_ID?.trim();
  if (!valid(id)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`}
      </Script>
    </>
  );
}
