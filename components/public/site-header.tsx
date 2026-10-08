"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CalendarDays, ChevronDown, Map as MapIcon, Menu, Radio, Search, Store, X } from "lucide-react";
import { isActivePath, NAV_GROUPS, PRIMARY_NAV, QUICK_NAV } from "@/lib/nav";
import { SfxToggle } from "@/components/public/site-chrome";
import { cn } from "@/components/ui";

const QUICK_ICONS = {
  "/live": Radio,
  "/programme/today": CalendarDays,
  "/map": MapIcon,
  "/exhibitors": Store,
} as const;

/**
 * Header: four direct links plus an "Explore" mega menu on desktop;
 * a slide-in drawer with quick tiles and grouped links on phones.
 */
export function SiteHeader({ logoUrl }: { logoUrl: string }) {
  const pathname = usePathname();
  // Panels remember the page they were opened on, so they close on navigation.
  const [megaOn, setMegaOn] = useState<string | null>(null);
  const [drawerOn, setDrawerOn] = useState<string | null>(null);
  const mega = megaOn === pathname;
  const drawer = drawerOn === pathname;
  const megaId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const exploreActive = NAV_GROUPS.some((g) => g.links.some((l) => isActivePath(pathname, l.href))) && !PRIMARY_NAV.some((l) => isActivePath(pathname, l.href));

  // Escape closes either panel; clicking outside closes the mega menu.
  useEffect(() => {
    if (!mega && !drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOn(null);
        setDrawerOn(null);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (mega && headerRef.current && !headerRef.current.contains(e.target as Node)) setMegaOn(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [mega, drawer]);

  // The page behind the drawer should not scroll.
  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  return (
    <header ref={headerRef} className="header-scroll sticky top-0 z-40 border-b border-line bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center gap-4 px-4 sm:h-[4.75rem] sm:px-6">
        <Link href="/" className="flex shrink-0 items-center" aria-label="KUZANA SCEEZ home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="KUZANA SCEEZ" width={180} height={74} className="h-14 w-auto sm:h-[3.75rem]" />
        </Link>

        {/* Desktop bar */}
        <nav className="ml-4 hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Main">
          {PRIMARY_NAV.map((n) => {
            const active = isActivePath(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-[var(--radius-control)] px-3 py-2 font-heading text-[0.95rem] font-semibold transition-colors",
                  active ? "text-green-900" : "text-ink hover:bg-cream-dark hover:text-green-900",
                  "after:absolute after:inset-x-3 after:-bottom-[0.9rem] after:h-[3px] after:rounded-full after:bg-orange after:transition-transform after:duration-300",
                  active ? "after:scale-x-100" : "after:scale-x-0",
                )}
              >
                {n.href === "/live" && <span className="live-dot inline-block size-2 rounded-full bg-orange" aria-hidden />}
                {n.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMegaOn(mega ? null : pathname)}
            aria-expanded={mega}
            aria-controls={megaId}
            className={cn(
              "inline-flex items-center gap-1 rounded-[var(--radius-control)] px-3 py-2 font-heading text-[0.95rem] font-semibold transition-colors",
              mega ? "bg-green-900 text-white" : exploreActive ? "text-green-900" : "text-ink hover:bg-cream-dark hover:text-green-900",
            )}
          >
            Explore <ChevronDown className={cn("size-4 transition-transform duration-300", mega && "rotate-180")} />
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/search"
            className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] text-green-900 transition-colors hover:bg-green-100"
            aria-label="Search"
          >
            <Search className="size-5" />
          </Link>
          <Link
            href="/register"
            data-sfx="drum"
            className="hidden rounded-[var(--radius-control)] bg-orange-dark px-4 py-2.5 font-heading text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-orange-deeper active:scale-[0.98] sm:inline-flex"
          >
            Register as a visitor
          </Link>
          <button
            type="button"
            onClick={() => setDrawerOn(drawer ? null : pathname)}
            className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] border border-line px-3 font-heading text-sm font-semibold text-green-900 transition-colors hover:border-green-800 lg:hidden"
            aria-expanded={drawer}
            aria-controls="site-drawer"
          >
            <Menu className="size-5" /> Menu
          </button>
        </div>
      </div>

      {/* Desktop mega menu */}
      {mega && (
        <div id={megaId} className="absolute inset-x-0 top-full hidden border-b border-line bg-white shadow-[0_24px_48px_-24px_rgb(0_81_45/0.35)] lg:block">
          <div className="mx-auto grid max-w-6xl animate-[fade-up_0.35s_var(--ease-out-expo)_both] grid-cols-4 gap-8 px-6 py-8 motion-reduce:animate-none">
            {NAV_GROUPS.map((g) => (
              <div key={g.title}>
                <p className="mb-3 font-heading text-sm font-bold text-orange-dark">{g.title}</p>
                <ul className="space-y-1">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className={cn(
                          "group block rounded-[var(--radius-control)] px-2.5 py-2 transition-colors hover:bg-cream",
                          isActivePath(pathname, l.href) && "bg-green-100",
                        )}
                      >
                        <span className="flex items-center gap-1 font-heading font-semibold text-ink group-hover:text-green-900">
                          {l.label}
                          <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                        </span>
                        {l.hint && <span className="block text-xs text-muted">{l.hint}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-line bg-cream">
            <div className="mx-auto max-w-6xl px-6 py-3">
              <div className="max-w-xs">
                <SfxToggle />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone drawer. Portalled to <body>: the header's backdrop-filter would otherwise trap a fixed element inside it. */}
      {drawer &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" id="site-drawer">
            <button
              type="button"
              className="absolute inset-0 animate-[fade-in_0.25s_ease-out_both] bg-green-950/50 backdrop-blur-[2px]"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => setDrawerOn(null)}
            />
            <div className="absolute inset-y-0 right-0 flex w-[min(24rem,92vw)] animate-[drawer-in_0.35s_var(--ease-out-expo)_both] flex-col bg-white shadow-2xl motion-reduce:animate-none">
              <div className="flex h-[4.5rem] items-center justify-between border-b border-line px-4">
                <span className="font-heading text-lg font-extrabold text-green-900">Menu</span>
                <button
                  type="button"
                  onClick={() => setDrawerOn(null)}
                  className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] text-green-900 hover:bg-green-100"
                  aria-label="Close menu"
                  autoFocus
                >
                  <X className="size-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-8">
                <ul className="grid grid-cols-2 gap-2">
                  {QUICK_NAV.map((q) => {
                    const Icon = QUICK_ICONS[q.href as keyof typeof QUICK_ICONS];
                    const active = isActivePath(pathname, q.href);
                    return (
                      <li key={q.href}>
                        <Link
                          href={q.href}
                          className={cn(
                            "flex h-full flex-col gap-2 rounded-[var(--radius-card)] p-3.5 font-heading font-bold transition-[background-color,transform] active:scale-[0.98]",
                            active ? "bg-green-900 text-white" : "bg-green-100 text-green-900",
                          )}
                        >
                          <Icon className={cn("size-6", !active && "text-orange-dark")} aria-hidden />
                          {q.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {NAV_GROUPS.map((g) => (
                  <details key={g.title} className="group mt-3 border-b border-line" open={g.links.some((l) => isActivePath(pathname, l.href))}>
                    <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-heading text-base font-bold text-green-900 [&::-webkit-details-marker]:hidden">
                      {g.title}
                      <ChevronDown className="size-5 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <ul className="pb-3">
                      {g.links.map((l) => (
                        <li key={l.href}>
                          <Link
                            href={l.href}
                            aria-current={isActivePath(pathname, l.href) ? "page" : undefined}
                            className={cn(
                              "block rounded-[var(--radius-control)] px-3 py-2.5",
                              isActivePath(pathname, l.href) ? "bg-green-100 font-semibold text-green-900" : "text-ink active:bg-cream-dark",
                            )}
                          >
                            {l.label}
                            {l.hint && <span className="block text-xs text-muted">{l.hint}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
                <Link
                  href="/register"
                  data-sfx="drum"
                  className="mt-5 flex items-center justify-center rounded-[var(--radius-control)] bg-orange-dark px-4 py-3 font-heading font-bold text-white active:scale-[0.98]"
                >
                  Register as a visitor
                </Link>
                <div className="mt-6 rounded-[var(--radius-card)] bg-cream p-3.5">
                  <SfxToggle />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
