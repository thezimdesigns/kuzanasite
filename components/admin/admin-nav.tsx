"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Award,
  BarChart3,
  Building2,
  CalendarRange,
  Camera,
  CalendarDays,
  ExternalLink,
  FileText,
  Globe,
  Handshake,
  Images,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Megaphone,
  MessageCircleQuestion,
  Menu,
  MessageSquare,
  Mic2,
  Newspaper,
  PanelBottom,
  Palette,
  QrCode,
  Rss,
  Send,
  Shield,
  Star,
  Store,
  Users,
  Video,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/components/ui";

const ICONS = {
  dashboard: LayoutDashboard,
  editions: CalendarRange,
  capture: Camera,
  events: CalendarDays,
  announcements: Megaphone,
  exhibitors: Store,
  speakers: Mic2,
  venues: Building2,
  galleries: Images,
  videos: Video,
  documents: Newspaper,
  feedback: MessageSquare,
  visitors: Users,
  messages: Send,
  partners: Handshake,
  pages: FileText,
  news: Rss,
  coverage: Globe,
  stats: BarChart3,
  qa: MessageCircleQuestion,
  floorplans: MapIcon,
  credits: Award,
  branding: Palette,
  footer: PanelBottom,
  ratings: Star,
  qr: QrCode,
  users: Shield,
};

export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  editable?: boolean;
  highlight?: boolean;
  hidden?: boolean;
};

export function AdminNav({ items, user }: { items: NavItem[]; user: { name: string; role: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  async function signOut() {
    await authClient.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const links = (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold",
                active(item.href) ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
                item.highlight && !active(item.href) && "text-gold-light",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
              {item.editable === false && <span className="ml-auto text-[0.65rem] font-normal text-white/50">view</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const footer = (
    <div className="space-y-2 border-t border-white/10 pt-3 text-sm">
      <div className="px-3 text-white">
        <p className="font-semibold">{user.name}</p>
        <p className="text-xs text-white/60">{user.role}</p>
      </div>
      <Link href="/" target="_blank" className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10">
        <ExternalLink className="size-4" /> View site
      </Link>
      <button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-white/80 hover:bg-white/10">
        <LogOut className="size-4" /> Sign out
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-green-950 px-4 text-white lg:hidden">
        <Link href="/admin" className="font-heading font-extrabold">
          KUZANA Admin
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/admin/capture" className="rounded-full bg-orange px-3 py-1.5 text-sm font-bold">
            Capture
          </Link>
          <button type="button" onClick={() => setOpenOn(open ? null : pathname)} className="p-2" aria-label="Menu" aria-expanded={open}>
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto bg-green-950 p-3 lg:hidden">
          {links}
          <div className="mt-3">{footer}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto bg-green-950 p-3 lg:flex">
        <Link href="/admin" className="mb-4 px-3 py-2 font-heading text-lg font-extrabold text-white">
          KUZANA Admin
        </Link>
        <nav className="flex-1">{links}</nav>
        {footer}
      </aside>
    </>
  );
}
