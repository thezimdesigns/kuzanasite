import { Star } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/permissions";
import { formatDay, formatTime } from "@/lib/time";
import { AdminPage, Panel, RowLink, Table } from "@/components/admin/ui";

export const metadata = { title: "Ratings" };

type Row = {
  id: string;
  name: string;
  href: string;
  avg: number;
  count: number;
};

export default async function AdminRatings() {
  await requireStaff();
  const [byEvent, bySession, byExhibitor, recent] = await Promise.all([
    db.rating.groupBy({
      by: ["eventId"],
      where: { eventId: { not: null } },
      _avg: { stars: true },
      _count: { stars: true },
    }),
    db.rating.groupBy({
      by: ["sessionId"],
      where: { sessionId: { not: null } },
      _avg: { stars: true },
      _count: { stars: true },
    }),
    db.rating.groupBy({
      by: ["exhibitorId"],
      where: { exhibitorId: { not: null } },
      _avg: { stars: true },
      _count: { stars: true },
    }),
    db.rating.findMany({
      where: { comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        event: { select: { title: true } },
        session: { select: { title: true } },
        exhibitor: { select: { name: true } },
      },
    }),
  ]);
  const [events, sessions, exhibitors] = await Promise.all([
    db.event.findMany({
      where: { id: { in: byEvent.map((r) => r.eventId!) } },
      select: { id: true, title: true },
    }),
    db.session.findMany({
      where: { id: { in: bySession.map((r) => r.sessionId!) } },
      select: { id: true, title: true, eventId: true },
    }),
    db.exhibitor.findMany({
      where: { id: { in: byExhibitor.map((r) => r.exhibitorId!) } },
      select: { id: true, name: true },
    }),
  ]);

  const rows = (
    groups: { _avg: { stars: number | null }; _count: { stars: number } }[],
    pick: (g: (typeof groups)[number]) => { id: string; name: string; href: string } | undefined,
  ): Row[] =>
    groups
      .map((g) => {
        const t = pick(g);
        return t ? { ...t, avg: g._avg.stars ?? 0, count: g._count.stars } : null;
      })
      .filter((r): r is Row => !!r)
      .sort((a, b) => b.count - a.count);

  const eventRows = rows(byEvent, (g) => {
    const e = events.find((x) => x.id === (g as (typeof byEvent)[number]).eventId);
    return e && { id: e.id, name: e.title, href: `/admin/events/${e.id}` };
  });
  const sessionRows = rows(bySession, (g) => {
    const s = sessions.find((x) => x.id === (g as (typeof bySession)[number]).sessionId);
    return s && { id: s.id, name: s.title, href: `/admin/sessions/${s.id}` };
  });
  const exhibitorRows = rows(byExhibitor, (g) => {
    const x = exhibitors.find((y) => y.id === (g as (typeof byExhibitor)[number]).exhibitorId);
    return x && { id: x.id, name: x.name, href: `/admin/exhibitors/${x.id}` };
  });

  return (
    <AdminPage title="Ratings" description="Star ratings visitors leave on events, conference sessions and exhibitor stands.">
      <div className="grid gap-6 xl:grid-cols-3">
        <RatingTable title="Events" rows={eventRows} />
        <RatingTable title="Conference sessions" rows={sessionRows} />
        <RatingTable title="Exhibitor stands" rows={exhibitorRows} />
      </div>
      <Panel title="Latest comments" className="mt-6">
        {recent.length === 0 ? (
          <p className="text-sm text-muted">No written comments yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((r) => (
              <li key={r.id} className="py-3">
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="font-semibold text-gold">{"★".repeat(r.stars)}</span>
                  <span className="font-semibold text-ink">{r.session?.title ?? r.exhibitor?.name ?? r.event?.title}</span>
                  {formatDay(r.createdAt)} {formatTime(r.createdAt)}
                </p>
                <p className="mt-1 text-sm">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminPage>
  );
}

function RatingTable({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <h2 className="mb-2 font-heading text-lg font-bold text-green-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-white px-4 py-6 text-center text-sm text-muted">No ratings yet.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Average</th>
              <th>Ratings</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <RowLink href={r.href}>{r.name}</RowLink>
                </td>
                <td className="whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5 fill-gold text-gold" aria-hidden /> {r.avg.toFixed(1)}
                  </span>
                </td>
                <td>{r.count}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
