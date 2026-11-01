import Link from "next/link";
import { Camera, FileUp, ImagePlus, Megaphone, Plus, Video } from "lucide-react";
import { db } from "@/lib/db";
import { getDayProgramme } from "@/lib/programme";
import { requireStaff } from "@/lib/permissions";
import { getSiteState } from "@/lib/edition";
import { endOfDay, startOfDay, dateKey, formatLongDay } from "@/lib/time";
import { AdminPage, Panel } from "@/components/admin/ui";
import { Alert } from "@/components/ui";
import { ProgrammeList } from "@/components/public/programme-list";

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const user = await requireStaff();
  const denied = (await searchParams).denied === "1";
  const today = dateKey(new Date());
  const since = startOfDay(today);
  const until = endOfDay(today);

  const site = await getSiteState();
  const between = {
    newStories: await db.storySubmission.count({ where: { status: "NEW" } }),
    interest: site.next
      ? await db.interestRegistration.groupBy({
          by: ["interest"],
          where: { editionId: site.next.id },
          _count: { _all: true },
          orderBy: { _count: { interest: "desc" } },
        })
      : [],
    latestPart: await db.newsPost.findFirst({
      where: { seriesId: { not: null } },
      orderBy: { publishedAt: "desc" },
      include: { series: { select: { title: true } } },
    }),
  };
  const [programme, counts] = await Promise.all([
    getDayProgramme(today),
    db.$transaction([
      db.announcement.count({
        where: {
          publishStatus: "PUBLISHED",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
      db.exhibitor.count({ where: { status: "PENDING" } }),
      db.exhibitor.count({ where: { status: "APPROVED" } }),
      db.exhibitor.count({ where: { createdAt: { gte: since, lte: until } } }),
      db.photoAlbum.count(),
      db.photo.count(),
      db.video.count(),
      db.document.count(),
      db.feedback.count({ where: { status: "NEW" } }),
      db.feedback.count(),
      db.visitor.count(),
      db.visitor.count({ where: { createdAt: { gte: since, lte: until } } }),
      db.pushSubscription.count({ where: { active: true } }),
      db.interestRegistration.count(),
    ]),
  ]);
  const [announcements, pending, approved, exToday, albums, photos, videos, docs, newFeedback, feedback, visitors, visitorsToday, push, interest] = counts;

  const stats = [
    {
      label: "Programme items today",
      value: programme.length,
      href: "/programme/today",
    },
    {
      label: "Live now",
      value: programme.filter((p) => p.status === "LIVE").length,
      href: "/live",
    },
    {
      label: "Active announcements",
      value: announcements,
      href: "/admin/announcements",
    },
    {
      label: "Exhibitors pending review",
      value: pending,
      href: "/admin/exhibitors?status=PENDING",
      alert: pending > 0,
    },
    {
      label: "Exhibitors published",
      value: approved,
      href: "/admin/exhibitors?status=APPROVED",
    },
    {
      label: "Exhibitors captured today",
      value: exToday,
      href: "/admin/exhibitors",
    },
    { label: "Photo albums", value: albums, href: "/admin/galleries" },
    { label: "Photos", value: photos, href: "/admin/galleries" },
    { label: "Videos", value: videos, href: "/admin/videos" },
    { label: "Documents", value: docs, href: "/admin/documents" },
    {
      label: "New feedback",
      value: newFeedback,
      href: "/admin/feedback?status=NEW",
      alert: newFeedback > 0,
    },
    { label: "Feedback total", value: feedback, href: "/admin/feedback" },
    { label: "Registered visitors", value: visitors, href: "/admin/visitors" },
    {
      label: "Visitors registered today",
      value: visitorsToday,
      href: "/admin/visitors",
    },
    { label: "Push subscribers", value: push, href: "/admin/messages" },
    {
      label: "Interest registrations",
      value: interest,
      href: "/admin/visitors?tab=interest",
    },
  ];

  const quick = [
    {
      href: "/admin/capture/exhibitor",
      label: "Capture exhibitor",
      icon: Camera,
    },
    { href: "/admin/announcements", label: "Announcement", icon: Megaphone },
    { href: "/admin/events/new", label: "Programme item", icon: Plus },
    { href: "/admin/galleries", label: "Upload photos", icon: ImagePlus },
    { href: "/admin/videos", label: "Video", icon: Video },
    { href: "/admin/documents/new", label: "Document", icon: FileUp },
  ];

  return (
    <AdminPage title={`Hello, ${user.name.split(" ")[0]}`} description={formatLongDay(new Date())}>
      {denied && (
        <div className="mb-4">
          <Alert tone="orange">Your role does not include that section. Ask a super admin if you need access.</Alert>
        </div>
      )}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {quick.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 rounded-[var(--radius-card)] bg-green-900 p-3 text-center text-sm font-bold text-white hover:bg-green-800"
          >
            <Icon className="size-5 text-gold-light" />
            {label}
          </Link>
        ))}
      </div>
      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`rounded-[var(--radius-card)] border bg-white p-3 hover:border-green-800 ${s.alert ? "border-orange" : "border-line"}`}
          >
            <p className={`font-heading text-2xl font-extrabold ${s.alert ? "text-orange" : "text-green-900"}`}>{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </Link>
        ))}
      </div>
      {site.phase === "between" && (
        <Panel title={`Between editions${site.next ? `: on the way to ${site.next.year}` : ""}`} className="mb-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="font-heading text-3xl font-extrabold text-green-900">{between.newStories}</p>
              <p className="text-sm text-muted">story submissions waiting</p>
              <Link href="/admin/stories" className="mt-1 inline-block text-sm font-semibold text-green-800 underline">
                Open stories
              </Link>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Interest in {site.next?.year ?? "the next edition"}</p>
              {between.interest.length ? (
                <ul className="mt-1 space-y-0.5 text-sm">
                  {between.interest.map((r) => (
                    <li key={r.interest} className="flex justify-between gap-3">
                      <span>{r.interest}</span>
                      <span className="font-semibold tabular-nums">{r._count._all}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted">None yet.</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Latest series part</p>
              {between.latestPart ? (
                <Link href={`/admin/news/${between.latestPart.id}`} className="mt-1 block text-sm text-green-800 underline">
                  {between.latestPart.series?.title}
                  {between.latestPart.seriesPart ? `, Part ${between.latestPart.seriesPart}` : ""}: {between.latestPart.title}
                </Link>
              ) : (
                <p className="mt-1 text-sm text-muted">
                  None yet.{" "}
                  <Link href="/admin/series" className="font-semibold text-green-800 underline">
                    Set up a series
                  </Link>
                </p>
              )}
            </div>
          </div>
        </Panel>
      )}
      <Panel
        title="Today's programme"
        actions={
          <Link href="/admin/events" className="text-sm font-semibold text-green-800 underline">
            Manage
          </Link>
        }
      >
        {programme.length ? <ProgrammeList items={programme} /> : <p className="text-sm text-muted">Nothing scheduled today.</p>}
      </Panel>
    </AdminPage>
  );
}
