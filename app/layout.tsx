import type { Metadata, Viewport } from "next";
import { shareMetadata } from "@/lib/seo";
import { Bricolage_Grotesque, Open_Sans } from "next/font/google";
import { siteUrl } from "@/lib/site";
import { editionDates, getSiteState } from "@/lib/edition";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Every page reads live programme data, so render per request.
export const dynamic = "force-dynamic";

/** Default title and description follow the edition: the event during its week, the next edition the rest of the year. */
export async function generateMetadata(): Promise<Metadata> {
  const { phase, current, next } = await getSiteState().catch(() => ({ phase: "between" as const, current: null, next: null }));
  const e = phase === "live" ? current : next;
  const when = e ? `${editionDates(e)}, Bulawayo` : "Bulawayo, Zimbabwe";
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: e ? `KUZANA SCEEZ ${e.year} | Sport & Creative Economy Expo of Zimbabwe` : "KUZANA SCEEZ | Sport & Creative Economy Expo of Zimbabwe",
      template: "%s | KUZANA SCEEZ",
    },
    description:
      phase === "live" && e
        ? `KUZANA SCEEZ ${e.year}: live programme, exhibitors, media and visitor information for the sport, creative economy and investment platform in ${when}.`
        : `KUZANA SCEEZ, the Sport & Creative Economy Expo of Zimbabwe: stories, series and opportunities all year${e ? `, and the next edition on ${when}` : ""}.`,
    ...shareMetadata(),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/brand/kuzana-icon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: "/brand/apple-touch-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#00512d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${bricolage.variable} ${openSans.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
