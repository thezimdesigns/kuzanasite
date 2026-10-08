import type { Metadata } from "next";
import { getBranding } from "@/lib/branding";
import { NotFoundContent } from "@/components/public/not-found-content";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { MobileTabBar } from "@/components/public/mobile-tab-bar";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** For URLs that match no route at all; brings its own header and footer. */
export default async function NotFound() {
  const { logoUrl } = await getBranding();
  return (
    <>
      <SiteHeader logoUrl={logoUrl} />
      <main id="main" className="min-h-[60vh]">
        <NotFoundContent />
      </main>
      <SiteFooter />
      <MobileTabBar />
    </>
  );
}
