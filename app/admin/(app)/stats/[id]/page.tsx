import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { readGroups, reportKey } from "@/lib/stats";
import { formatLongDay, occursOn, startOfDay } from "@/lib/time";
import { deleteDailyReport } from "@/app/admin/actions/content";
import { ActionButton } from "@/components/admin/admin-form";
import { StatsEditor } from "@/components/admin/stats-editor";
import { AdminPage, ReadOnlyNotice } from "@/components/admin/ui";
import { StatsBoard } from "@/components/public/stats-board";

export const metadata = { title: "Daily figures" };

export default async function AdminStatsDay({ params }: PageProps<"/admin/stats/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "press");
  const report = await db.dailyReport.findUnique({ where: { id: (await params).id } });
  if (!report) notFound();
  const key = reportKey(report.day);
  const dayLabel = formatLongDay(startOfDay(key));
  const events = await db.event.findMany({
    where: { publishStatus: "PUBLISHED" },
    orderBy: { startsAt: "asc" },
    select: { slug: true, title: true, isConference: true, startsAt: true, endsAt: true, timeTbc: true, dailyHours: true, statusOverride: true, category: { select: { name: true } } },
  });
  const activities = events.map((e) => ({ slug: e.slug, title: e.title, category: e.category?.name ?? null, isConference: e.isConference, onDay: occursOn(e, key) }));
  const groups = readGroups(report.groups);
  return (
    <AdminPage
      title={dayLabel}
      back={{ href: "/admin/stats", label: "Daily figures" }}
      actions={
        <Link href="/stats" target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-green-800 underline">
          View public page <ExternalLink className="size-3.5" />
        </Link>
      }
    >
      {editable ? (
        <>
          <StatsEditor
            id={report.id}
            dayLabel={dayLabel}
            activities={activities}
            initial={{ day: key, headline: report.headline ?? "", note: report.note ?? "", publishStatus: report.publishStatus, groups }}
          />
          <div className="mt-8">
            <ActionButton action={deleteDailyReport.bind(null, report.id)} variant="danger" confirm="Delete this day's figures?">
              Delete this day
            </ActionButton>
          </div>
        </>
      ) : (
        <>
          <ReadOnlyNotice />
          <StatsBoard groups={groups} />
        </>
      )}
    </AdminPage>
  );
}
