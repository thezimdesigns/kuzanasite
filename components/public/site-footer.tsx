import Link from "next/link";
import { ChevronRight, Mail, MapPin, Phone } from "lucide-react";
import { getFooter } from "@/lib/site-settings";
import { SocialLinks } from "@/components/public/social-links";

/** Footer content is managed in Admin → Footer. */
export async function SiteFooter() {
  const { settings: s, columns } = await getFooter();

  return (
    <footer className="bg-green-950 pb-20 text-white/85 lg:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.2fr_1fr_1fr] sm:px-6">
        <div>
          <div className="font-heading text-xl font-extrabold text-white">KUZANA SCEEZ</div>
          {s["footer.tagline"] && <p className="mt-2 max-w-xs text-sm">{s["footer.tagline"]}</p>}
          <ul className="mt-4 space-y-2 text-sm">
            {s["footer.location"] && (
              <li className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-gold-light" aria-hidden /> {s["footer.location"]}
              </li>
            )}
            {s["footer.email"] && (
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-gold-light" aria-hidden />
                <a href={`mailto:${s["footer.email"]}`} className="break-all transition-colors hover:text-white">
                  {s["footer.email"]}
                </a>
              </li>
            )}
            {s["footer.phone"] && (
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-gold-light" aria-hidden />
                <a href={`tel:${s["footer.phone"].replace(/\s/g, "")}`} className="transition-colors hover:text-white">
                  {s["footer.phone"]}
                </a>
              </li>
            )}
          </ul>
          <SocialLinks
            name="KUZANA SCEEZ"
            className="mt-5"
            urls={{
              facebook: s["footer.facebook"],
              instagram: s["footer.instagram"],
              youtube: s["footer.youtube"],
              linkedin: s["footer.linkedin"],
              x: s["footer.x"],
            }}
          />
        </div>
        <FooterLinks title={s["footer.col1Title"]} links={columns[0]} />
        <FooterLinks title={s["footer.col2Title"]} links={columns[1]} />
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()} KUZANA SCEEZ. All rights reserved. Website by{" "}
        <a
          href="https://www.nhimbe.org"
          target="_blank"
          rel="noopener"
          className="font-semibold text-white underline decoration-white/30 underline-offset-2 transition-colors hover:decoration-gold-light"
        >
          Nhimbe Trust
        </a>
        .
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: { id: string; label: string; href: string; newTab: boolean }[] }) {
  if (!links.length) return null;
  return (
    <div>
      <div className="font-heading font-bold text-white">{title}</div>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => {
          const bullet = <ChevronRight className="size-3.5 shrink-0 text-gold-light transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />;
          const external = /^https?:\/\//.test(l.href) || l.href.startsWith("mailto:") || l.href.startsWith("tel:");
          const props = l.newTab ? { target: "_blank", rel: "noopener" } : {};
          return (
            <li key={l.id}>
              {external ? (
                <a href={l.href} className="group inline-flex items-center gap-1.5 transition-colors hover:text-white" {...props}>
                  {bullet}
                  {l.label}
                </a>
              ) : (
                <Link href={l.href} className="group inline-flex items-center gap-1.5 transition-colors hover:text-white" {...props}>
                  {bullet}
                  {l.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
