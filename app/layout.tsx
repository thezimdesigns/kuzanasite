import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Open_Sans } from "next/font/google";
import { siteUrl } from "@/lib/site";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "KUZANA SCEEZ 2026 | Sport & Creative Economy Expo of Zimbabwe",
    template: "%s | KUZANA SCEEZ",
  },
  description:
    "KUZANA SCEEZ 2026: live programme, exhibitors, media and visitor information for the sport, creative economy and investment platform in Bulawayo, 7–11 October 2026.",
  openGraph: {
    siteName: "KUZANA SCEEZ",
    type: "website",
    images: ["/brand/hero-collage.png"],
  },
  icons: { icon: "/brand/kuzana-icon.png", apple: "/brand/kuzana-icon.png" },
};

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
