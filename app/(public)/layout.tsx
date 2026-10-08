import { getBranding } from "@/lib/branding";
import { SOCIAL_LINKS, siteUrl } from "@/lib/site";
import { recaptchaConfig } from "@/lib/recaptcha";
import { RecaptchaProvider } from "@/components/public/use-recaptcha";
import { AnnouncementBanner } from "@/components/public/announcement-banner";
import { MobileTabBar } from "@/components/public/mobile-tab-bar";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { Analytics } from "@/components/public/analytics";
import { FxLayer } from "@/components/public/fx";
import { ScrollToTop } from "@/components/public/site-chrome";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const { logoUrl } = await getBranding();
  const recaptcha = recaptchaConfig();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <AnnouncementBanner />
      <SiteHeader logoUrl={logoUrl} />
      <main id="main" className="min-h-[60vh]">
        <RecaptchaProvider siteKey={recaptcha.siteKey}>{children}</RecaptchaProvider>
      </main>
      <SiteFooter />
      <MobileTabBar />
      <ScrollToTop />
      <FxLayer />
      <Analytics />
      {/* Who runs the site and how to search it, for search engines. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "KUZANA SCEEZ",
              alternateName: "Sport & Creative Economy Expo of Zimbabwe",
              url: siteUrl("/"),
              logo: siteUrl("/brand/kuzana-icon.png"),
              sameAs: Object.values(SOCIAL_LINKS),
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "KUZANA SCEEZ",
              url: siteUrl("/"),
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl("/search")}?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
          ]).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
