"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Images, MessageSquare, Radio, Store } from "lucide-react";
import { cn } from "@/components/ui";

const TABS = [
  { href: "/live", label: "Live", icon: Radio },
  { href: "/programme/today", label: "Today", icon: CalendarDays },
  { href: "/exhibitors", label: "Exhibitors", icon: Store },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
];

/** Event-time shortcuts, always visible on phones. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Quick links">
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
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
