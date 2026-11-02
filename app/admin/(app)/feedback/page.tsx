import { FeedbackStatus } from "@/lib/generated/prisma/enums";
import { db } from "@/lib/db";
import { FEEDBACK_STATUS_LABELS } from "@/lib/options";
import { can, requireStaff } from "@/lib/permissions";
import { isFeedbackWallOn } from "@/lib/feedback";
import { FeedbackExport, FeedbackPublicToggle, FeedbackWallSwitch } from "@/components/admin/feedback-tools";
import { formatDay, formatTime } from "@/lib/time";
import { AdminPage, RowLink, Table, Tabs } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export const metadata = { title: "Feedback" };

export default async function AdminFeedback({ searchParams }: PageProps<"/admin/feedback">) {
  const user = await requireStaff();
  const editable = can(user, "feedback");
  const sp = await searchParams;
  const status = Object.values(FeedbackStatus).find((s) => s === sp.status);
  const [rows, grouped, ratings, wallOn, shown] = await Promise.all([
    db.feedback.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { event: { select: { title: true } } },
    }),
    db.feedback.groupBy({ by: ["status"], _count: true }),
    db.rating.aggregate({ _avg: { stars: true }, _count: true }),
    isFeedbackWallOn(),
    db.feedback.count({ where: { isPublic: true } }),
  ]);
  const count = (s?: FeedbackStatus) => (s ? (grouped.find((g) => g.status === s)?._count ?? 0) : grouped.reduce((n, g) => n + g._count, 0));
  return (
    <AdminPage
      title="Feedback"
      description={ratings._count ? `Event ratings: ${ratings._avg.stars?.toFixed(1)} ★ average from ${ratings._count} ratings` : undefined}
    >
      <div className="mb-5 grid gap-4 rounded-[var(--radius-card)] border border-line bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <FeedbackWallSwitch on={wallOn} shown={shown} readOnly={!editable} />
        {editable && (
          <div>
            <p className="mb-1 text-sm font-semibold text-ink">Download{status ? ` ${FEEDBACK_STATUS_LABELS[status].toLowerCase()} feedback` : ""}</p>
            <FeedbackExport status={status} />
          </div>
        )}
      </div>
      <Tabs
        current={status ?? "ALL"}
        tabs={[
          {
            value: "ALL",
            label: "All",
            href: "/admin/feedback",
            count: count(),
          },
          ...Object.values(FeedbackStatus).map((s) => ({
            value: s,
            label: FEEDBACK_STATUS_LABELS[s],
            href: `/admin/feedback?status=${s}`,
            count: count(s),
          })),
        ]}
      />
      <Table>
        <thead>
          <tr>
            <th>Message</th>
            <th>Category</th>
            <th>From</th>
            <th>Status</th>
            <th>Website</th>
            <th>Received</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id}>
              <td className="max-w-md">
                <RowLink href={`/admin/feedback/${f.id}`} className="line-clamp-2 font-normal">
                  {f.message}
                </RowLink>
                {f.event && <div className="text-xs text-muted">{f.event.title}</div>}
              </td>
              <td>
                <Badge tone={f.category === "Safety" || f.category === "Complaint" ? "red" : "neutral"}>{f.category}</Badge>
                {f.rating && <div className="text-xs text-gold">{"★".repeat(f.rating)}</div>}
              </td>
              <td className="text-xs">{f.anonymous ? "Anonymous" : (f.name ?? "-")}</td>
              <td>
                <Badge tone={f.status === "NEW" ? "orange" : f.status === "RESOLVED" ? "green" : "neutral"}>{FEEDBACK_STATUS_LABELS[f.status]}</Badge>
              </td>
              <td>
                <FeedbackPublicToggle id={f.id} isPublic={f.isPublic} readOnly={!editable} />
              </td>
              <td className="text-xs whitespace-nowrap">
                {formatDay(f.createdAt)} {formatTime(f.createdAt)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-muted">
                Nothing here.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
