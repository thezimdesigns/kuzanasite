import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { NavToggle } from "@/components/admin/nav-toggle";
import { AdminPage, ReadOnlyNotice } from "@/components/admin/ui";
import { Badge } from "@/components/ui";
import { db } from "@/lib/db";
import { allNavLinks } from "@/lib/nav";
import { getHiddenNav } from "@/lib/nav-settings";
import { can, requireStaff } from "@/lib/permissions";

export const metadata = { title: "Menu" };

const published = { publishStatus: "PUBLISHED" as const };

/** How much is published behind the links that depend on content, so empty pages stand out. */
async function contentCounts(): Promise<Record<string, number>> {
  const [news, stats, albums, videos, coverage, documents, speakers, partners, credits, floorPlans, editions] = await Promise.all([
    db.newsPost.count({ where: published }),
    db.dailyReport.count({ where: published }),
    db.photoAlbum.count({ where: published }),
    db.video.count({ where: published }),
    db.mediaMention.count({ where: published }),
    db.document.count({ where: published }),
    db.person.count({ where: published }),
    db.partner.count(),
    db.serviceProvider.count({ where: published }),
    db.floorPlan.count({ where: published }),
    db.edition.count(),
  ]);
  return {
    "/news": news,
    "/stats": stats,
    "/gallery": albums,
    "/videos": videos,
    "/media/coverage": coverage,
    "/media": documents,
    "/speakers": speakers,
    "/partners": partners,
    "/credits": credits,
    "/floor-plan": floorPlans,
    // The archive is for past editions: the current one alone leaves it empty.
    "/archive": Math.max(0, editions - 1),
  };
}

export default async function AdminMenu() {
  const user = await requireStaff();
  const editable = can(user, "site");
  const [hidden, counts] = await Promise.all([getHiddenNav(), contentCounts()]);
  const links = allNavLinks();
  const off = links.filter((l) => hidden.includes(l.href)).length;

  return (
    <AdminPage
      title="Menu"
      description="Switch menu links on or off. A switched-off page still works if someone has the link; it just isn't in the menus. Changes show on the site straight away."
    >
      {!editable && <ReadOnlyNotice />}
      <p className="mb-4 text-sm text-muted">
        {links.length - off} of {links.length} links showing.
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
        {links.map((l) => {
          const count = counts[l.href];
          const visible = !hidden.includes(l.href);
          return (
            <li key={l.href} className="flex items-center gap-4 px-4 py-3">
              <NavToggle href={l.href} label={l.label} visible={visible} disabled={!editable} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  {l.label}
                  {count === 0 && <Badge tone="gold">Empty</Badge>}
                  {count !== undefined && count > 0 && <span className="text-xs font-normal text-muted">{count} published</span>}
                </p>
                <p className="text-xs text-muted">{l.places.join(" · ")}</p>
              </div>
              <Link href={l.href} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold text-green-800 hover:underline">
                {l.href} <ExternalLink className="size-3" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </AdminPage>
  );
}
