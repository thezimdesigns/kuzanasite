import Link from "next/link";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { formatNumber, groupTotal, readGroups, reportKey } from "@/lib/stats";
import { dateKey, formatLongDay, startOfDay } from "@/lib/time";
import { NewDayReport } from "@/components/admin/new-day-report";
import { AdminPage, Panel, PublishBadge, ReadOnlyNotice } from "@/components/admin/ui";

export const metadata = { title: "Daily figures" };

export default async function AdminStats() {
  const user = await requireStaff();
  const editable = can(user, "press");
  const reports = await db.dailyReport.findMany({ orderBy: { day: "desc" } });
  return (
    <AdminPage title="Daily figures" description="Exhibitor counts, delegates, visitors… one report per day. Published figures show on the homepage and at /stats.">
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ul className="space-y-3">
          {reports.map((r) => {
            const groups = readGroups(r.groups);
            return (
              <li key={r.id}>
                <Link href={`/admin/stats/${r.id}`} className="block rounded-[var(--radius-card)] border border-line bg-white p-4 hover:border-green-800">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-heading font-bold text-green-900">{formatLongDay(startOfDay(reportKey(r.day)))}</span>
                    <PublishBadge status={r.publishStatus} />
                  </span>
                  {r.headline && <span className="mt-1 block text-sm">{r.headline}</span>}
                  <span className="mt-1 block text-sm text-muted">
                    {groups.map((g) => `${g.title}: ${g.showTotal ? formatNumber(groupTotal(g)) : g.items.map((i) => formatNumber(i.value)).join(" / ")}`).join(" · ")}
                  </span>
                </Link>
              </li>
            );
          })}
          {reports.length === 0 && <p className="text-sm text-muted">No figures yet.</p>}
        </ul>
        {editable && (
          <Panel title="Add a day">
            <p className="mb-3 text-sm text-muted">The groups and labels from the latest day are copied, so you only type the new numbers.</p>
            <NewDayReport today={dateKey(new Date())} />
          </Panel>
        )}
      </div>
    </AdminPage>
  );
}
