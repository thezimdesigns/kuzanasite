import Link from "next/link";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { getFooter } from "@/lib/site-settings";

/** Footer content is managed in Admin → Footer. */
export async function SiteFooter() {
  const { settings: s, columns } = await getFooter();
  const socials = [
    ["Facebook", s["footer.facebook"]],
    ["Instagram", s["footer.instagram"]],
    ["LinkedIn", s["footer.linkedin"]],
    ["YouTube", s["footer.youtube"]],
    ["X", s["footer.x"]],
  ].filter(([, url]) => url) as [string, string][];

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
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {socials.map(([label, url]) => (
                <li key={label}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-white/15 px-2.5 py-1 text-xs font-semibold transition-colors hover:border-white/40 hover:text-white"
                  >
                    <Globe className="size-3.5" aria-hidden /> {label}
                  </a>
                </li>
              ))}
            </ul>
          )}
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
          const external = /^https?:\/\//.test(l.href) || l.href.startsWith("mailto:") || l.href.startsWith("tel:");
          const props = l.newTab ? { target: "_blank", rel: "noopener" } : {};
          return (
            <li key={l.id}>
              {external ? (
                <a href={l.href} className="transition-colors hover:text-white" {...props}>
                  {l.label}
                </a>
              ) : (
                <Link href={l.href} className="transition-colors hover:text-white" {...props}>
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
