import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { streamEmbed, streamHost } from "@/lib/streams";
import { deleteStream, moveStream, toggleStream } from "@/app/admin/actions/programme";
import { ActionButton } from "@/components/admin/admin-form";
import { StreamForm } from "@/components/admin/stream-form";
import { Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

/** Live stream links for an event or a session. */
export async function StreamsPanel({ eventId, sessionId, editable }: { eventId?: string; sessionId?: string; editable: boolean }) {
  const streams = await db.eventStream.findMany({
    where: sessionId ? { sessionId } : { eventId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return (
    <Panel title={`Live streams${streams.length ? ` (${streams.length})` : ""}`}>
      {streams.length > 0 && (
        <ul className="mb-4 divide-y divide-line">
          {streams.map((s, i) => (
            <li key={s.id} className="py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{s.label}</span>
                {streamEmbed(s.url) ? <Badge tone="green">plays on page</Badge> : <Badge>opens link</Badge>}
                {!s.active && <Badge tone="orange">hidden</Badge>}
                <a href={s.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-muted hover:underline">
                  {streamHost(s.url)} <ExternalLink className="size-3" />
                </a>
              </div>
              {editable && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <ActionButton action={toggleStream.bind(null, s.id)} variant="ghost">
                    {s.active ? "Hide" : "Show"}
                  </ActionButton>
                  {i > 0 && (
                    <ActionButton action={moveStream.bind(null, s.id, -1)} variant="ghost">
                      <ArrowUp className="size-4" aria-label="Move up" />
                    </ActionButton>
                  )}
                  {i < streams.length - 1 && (
                    <ActionButton action={moveStream.bind(null, s.id, 1)} variant="ghost">
                      <ArrowDown className="size-4" aria-label="Move down" />
                    </ActionButton>
                  )}
                  <ActionButton action={deleteStream.bind(null, s.id)} variant="ghost" confirm="Remove this stream?">
                    Remove
                  </ActionButton>
                  <details className="w-full">
                    <summary className="cursor-pointer text-sm font-semibold text-green-800">Edit</summary>
                    <div className="mt-2">
                      <StreamForm
                        values={{
                          id: s.id,
                          label: s.label,
                          url: s.url,
                          active: s.active,
                        }}
                      />
                    </div>
                  </details>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {streams.length === 0 && <p className="mb-3 text-sm text-muted">No streams yet. Add YouTube, Facebook or broadcaster links; several are allowed.</p>}
      {editable && <StreamForm eventId={eventId} sessionId={sessionId} />}
    </Panel>
  );
}
