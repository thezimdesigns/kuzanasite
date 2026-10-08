import { getBranding } from "@/lib/branding";
import { recaptchaConfig } from "@/lib/recaptcha";
import { RecaptchaProvider } from "@/components/public/use-recaptcha";
import { AnnouncementBanner } from "@/components/public/announcement-banner";
import { MobileTabBar } from "@/components/public/mobile-tab-bar";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { ScrollToTop, SfxListener } from "@/components/public/site-chrome";

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
      <SfxListener />
    </>
  );
}
