"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
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
    <header className="header-scroll sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="KUZANA SCEEZ home">
          <Image src="/brand/kuzana-sceez.png" alt="KUZANA SCEEZ" width={132} height={48} priority className="h-11 w-auto" />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
          {NAV.filter((n) => PRIMARY.includes(n.href)).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "relative inline-flex items-center px-3 py-2 font-heading text-sm font-semibold transition-colors",
                "after:absolute after:inset-x-3 after:bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-orange after:transition-transform after:duration-300 after:ease-[var(--ease-out-expo)]",
                isActive(n.href) ? "text-green-900 after:scale-x-100" : "text-ink after:scale-x-0 hover:text-green-800 hover:after:scale-x-100",
              )}
              aria-current={isActive(n.href) ? "page" : undefined}
            >
              {n.href === "/live" && <span className="live-dot mr-1.5 inline-block size-2 rounded-full bg-orange" aria-hidden />}
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] text-green-900 transition-colors hover:bg-green-100"
            aria-label="Search"
          >
            <Search className="size-5" />
          </Link>
          <Link
            href="/register"
            className="hidden rounded-[var(--radius-control)] bg-orange-dark px-4 py-2 font-heading text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-orange-deeper active:scale-[0.98] sm:inline-flex"
          >
            Register as a visitor
          </Link>
          <button
            type="button"
            onClick={() => setOpenOn(open ? null : pathname)}
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] text-green-900 transition-colors hover:bg-green-100"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="site-menu" className="animate-[fade-up_0.3s_var(--ease-out-expo)_both] border-t border-line bg-white motion-reduce:animate-none" aria-label="All pages">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-1 px-4 py-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-4">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className={cn(
                    "block rounded-[var(--radius-control)] px-3 py-2.5 font-heading font-semibold transition-colors",
                    isActive(n.href) ? "bg-green-100 text-green-900" : "hover:bg-cream-dark",
                  )}
                >
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/register" className="block rounded-[var(--radius-control)] px-3 py-2.5 font-heading font-semibold text-orange-dark hover:bg-cream-dark">
                Register as a visitor
              </Link>
            </li>
            <li>
              <Link href="/archive" className="block rounded-[var(--radius-control)] px-3 py-2.5 font-heading font-semibold hover:bg-cream-dark">
                Archive
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
