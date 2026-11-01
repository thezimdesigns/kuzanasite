"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, History, House, Images, MessageSquare, Radio, Sparkles, Store, type LucideIcon } from "lucide-react";
import { visibleNav, type NavPhase, type NavYears } from "@/lib/nav";
import { cn } from "@/components/ui";

const ICONS: Record<string, LucideIcon> = {
  "/live": Radio,
  "/programme/today": CalendarDays,
  "/exhibitors": Store,
  "/gallery": Images,
  "/feedback": MessageSquare,
  "/": House,
  "/stories": BookOpen,
  "/take-part": Sparkles,
};

/** Event-time shortcuts, always visible on phones. */
export function MobileTabBar({ hiddenNav = [], phase = "live", years }: { hiddenNav?: string[]; phase?: NavPhase; years?: NavYears }) {
  const pathname = usePathname();
  const tabs = visibleNav(hiddenNav, phase, years).tabs;
  if (!tabs.length) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Quick links">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map(({ href, label }) => {
          const Icon = ICONS[href] ?? History;
          const active = pathname === href || (href !== "/programme/today" && pathname.startsWith(`${href}/`));
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn("flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-semibold", active ? "text-orange-dark" : "text-green-900")}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
