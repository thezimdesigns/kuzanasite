"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/components/ui";

export const NAV = [
  { href: "/live", label: "Live" },
  { href: "/programme", label: "Programme" },
  { href: "/exhibitors", label: "Exhibitors" },
  { href: "/speakers", label: "Speakers" },
  { href: "/gallery", label: "Gallery" },
  { href: "/videos", label: "Videos" },
  { href: "/media", label: "Media centre" },
  { href: "/venues", label: "Venues" },
  { href: "/plan-your-visit", label: "Plan your visit" },
  { href: "/partners", label: "Partners" },
  { href: "/feedback", label: "Feedback" },
];

const PRIMARY = ["/live", "/programme", "/exhibitors", "/gallery", "/media", "/plan-your-visit"];

export function SiteHeader() {
  const pathname = usePathname();
  // The menu remembers the page it was opened on, so it closes on navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="KUZANA SCEEZ home">
          <Image src="/brand/kuzana-sceez.png" alt="KUZANA SCEEZ" width={132} height={48} priority className="h-11 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.filter((n) => PRIMARY.includes(n.href)).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-full px-3 py-2 font-heading text-sm font-semibold transition-colors",
                isActive(n.href) ? "bg-green-100 text-green-900" : "text-ink hover:text-green-800",
              )}
            >
              {n.href === "/live" && <span className="live-dot mr-1.5 inline-block size-2 rounded-full bg-orange align-middle" />}
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/register"
            className="hidden rounded-full bg-orange px-4 py-2 font-heading text-sm font-bold text-white hover:bg-orange-dark sm:inline-flex"
          >
            Register as a visitor
          </Link>
          <button
            type="button"
            onClick={() => setOpenOn(open ? null : pathname)}
            className="inline-flex size-11 items-center justify-center rounded-full text-green-900 hover:bg-green-100"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="site-menu" className="border-t border-line bg-white" aria-label="All pages">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-1 px-4 py-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-4">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 font-heading font-semibold",
                    isActive(n.href) ? "bg-green-100 text-green-900" : "hover:bg-cream-dark",
                  )}
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/register" className="block rounded-lg px-3 py-2.5 font-heading font-semibold text-orange hover:bg-cream-dark">
                Register as a visitor
              </Link>
            </li>
            <li>
              <Link href="/archive" className="block rounded-lg px-3 py-2.5 font-heading font-semibold hover:bg-cream-dark">
                Archive
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
