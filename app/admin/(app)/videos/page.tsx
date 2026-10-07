import { db } from "@/lib/db";
import { VIDEO_CATEGORY_LABELS } from "@/lib/options";
import { can, requireStaff } from "@/lib/permissions";
import { formatDate, toDateInput } from "@/lib/time";
import { youtubeThumb } from "@/lib/youtube";
import { deleteVideo } from "@/app/admin/actions/media";
import { ActionButton } from "@/components/admin/admin-form";
import { AdminPage, Panel, PublishBadge, ReadOnlyNotice } from "@/components/admin/ui";
import { VideoForm } from "@/components/admin/video-form";
import { Badge } from "@/components/ui";

export const metadata = { title: "Videos" };

export default async function AdminVideos() {
  const user = await requireStaff();
  const editable = can(user, "media");
  const [videos, events, sessions] = await Promise.all([
    db.video.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    db.event.findMany({ orderBy: { startsAt: "asc" }, select: { id: true, title: true } }),
    db.session.findMany({ orderBy: { startsAt: "asc" }, select: { id: true, title: true, event: { select: { title: true } } } }),
  ]);
  const sessionOptions = sessions.map((s) => ({ id: s.id, title: s.title, event: s.event.title }));
  return (
    <AdminPage title="Videos" description="Videos are hosted on YouTube; paste the link to publish.">
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {editable && (
          <Panel title="Add video">
            <VideoForm
              events={events}
              sessions={sessionOptions}
              values={{ title: "", url: "", description: "", date: "", eventId: "", sessionId: "", category: "HIGHLIGHTS", featured: false, publishStatus: "PUBLISHED" }}
            />
          </Panel>
        )}
        <ul className="space-y-3">
          {videos.map((v) => (
            <li key={v.id}>
              <Panel>
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={youtubeThumb(v.youtubeId)} alt="" className="h-16 w-28 shrink-0 rounded object-cover" loading="lazy" />
                  <div className="min-w-0">
                    <p className="font-semibold">{v.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                      <Badge>{VIDEO_CATEGORY_LABELS[v.category]}</Badge>
                      <PublishBadge status={v.publishStatus} />
                      {v.featured && <Badge tone="orange">featured</Badge>}
                      {v.date && <span className="text-muted">{formatDate(v.date)}</span>}
                    </div>
                  </div>
                </div>
                {editable && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-green-800">Edit</summary>
                    <div className="mt-3">
                      <VideoForm
                        events={events}
                        sessions={sessionOptions}
                        values={{
                          id: v.id,
                          title: v.title,
                          url: `https://youtu.be/${v.youtubeId}`,
                          description: v.description ?? "",
                          date: toDateInput(v.date),
                          eventId: v.eventId ?? "",
                          sessionId: v.sessionId ?? "",
                          category: v.category,
                          featured: v.featured,
                          publishStatus: v.publishStatus,
                        }}
                      />
                      <div className="mt-3">
                        <ActionButton action={deleteVideo.bind(null, v.id)} variant="ghost" confirm="Delete this video?">
                          Delete
                        </ActionButton>
                      </div>
                    </div>
                  </details>
                )}
              </Panel>
            </li>
          ))}
          {videos.length === 0 && <p className="text-muted">No videos yet.</p>}
        </ul>
      </div>
    </AdminPage>
  );
}
