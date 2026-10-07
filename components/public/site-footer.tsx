import Link from "next/link";
import { Globe, Mail, MapPin } from "lucide-react";
import { CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-green-950 pb-20 text-white/85 lg:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <div className="font-heading text-xl font-extrabold text-white">KUZANA SCEEZ</div>
          <p className="mt-2 text-sm">Sport &amp; Creative Economy Expo of Zimbabwe. #FromTalentToGDP</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-gold-light" aria-hidden /> Bulawayo, Zimbabwe
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-gold-light" aria-hidden />
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Globe className="size-4 text-gold-light" aria-hidden />
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener" className="hover:text-white">
                Facebook
              </a>
            </li>
          </ul>
        </div>
        <FooterLinks
          title="At the event"
          links={[
            ["/live", "KUZANA Live"],
            ["/programme/today", "Today's programme"],
            ["/exhibitors", "Exhibitors"],
            ["/venues", "Venues"],
            ["/plan-your-visit", "Plan your visit"],
            ["/feedback", "Feedback"],
          ]}
        />
        <FooterLinks
          title="Media & more"
          links={[
            ["/media", "Media centre"],
            ["/gallery", "Photo gallery"],
            ["/videos", "Videos"],
            ["/speakers", "Speakers"],
            ["/partners", "Partners"],
            ["/archive", "Archive"],
            ["/privacy", "Privacy"],
          ]}
        />
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} KUZANA SCEEZ. All rights reserved.
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="font-heading font-bold text-white">{title}</div>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
