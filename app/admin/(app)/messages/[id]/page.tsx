import { notFound } from "next/navigation";
import { Bell, Mail } from "lucide-react";
import { db } from "@/lib/db";
import { audienceOptions, channelAvailability, resolveAudience } from "@/lib/messaging";
import { can, requireStaff } from "@/lib/permissions";
import { formatDay, formatTime } from "@/lib/time";
import { cancelMessage, sendMessage } from "@/app/admin/actions/engagement";
import { ActionButton } from "@/components/admin/admin-form";
import { AdminPage, Panel } from "@/components/admin/ui";
import { AutoRefresh } from "@/components/public/auto-refresh";
import { Alert, Badge } from "@/components/ui";

export default async function AdminMessage({ params }: PageProps<"/admin/messages/[id]">) {
  const user = await requireStaff();
  const m = await db.message.findUnique({ where: { id: (await params).id } });
  if (!m) notFound();
  const audiences = (await audienceOptions()).flatMap((g) => g.options);
  const audienceLabel = audiences.find((a) => a.value === m.audience)?.label ?? m.audience;
  const draft = m.status === "DRAFT";
  const recipients = draft ? await resolveAudience(m.audience, m.channels) : null;
  const available = channelAvailability();
  const total = recipients ? recipients.pushIds.length + recipients.emails.length : m.recipientCount;

  return (
    <AdminPage title={draft ? "Confirm and send" : m.title} back={{ href: "/admin/messages", label: "Messaging" }}>
      {m.status === "SENDING" && <AutoRefresh seconds={3} />}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Preview">
          <div className="rounded-xl bg-ink p-4 text-white shadow">
            <div className="mb-1 flex items-center gap-2 text-xs text-white/60">
              <Bell className="size-3.5" /> KUZANA SCEEZ · now
            </div>
            <p className="font-semibold">{m.title}</p>
            <p className="text-sm whitespace-pre-line text-white/85">{m.body}</p>
          </div>
          {m.url && <p className="mt-3 text-sm text-muted">Opens: {m.url}</p>}
        </Panel>

        <Panel title={draft ? "Recipients" : "Delivery"}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Audience</dt>
              <dd className="font-semibold">{audienceLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Channels</dt>
              <dd className="font-semibold">{m.channels.map((c) => (c === "WEB_PUSH" ? "Web Push" : "Email")).join(" + ")}</dd>
            </div>
            {recipients && (
              <>
                {m.channels.includes("WEB_PUSH") && (
                  <div className="flex justify-between">
                    <dt className="flex items-center gap-1.5">
                      <Bell className="size-4" /> Push devices
                    </dt>
                    <dd className="font-semibold">{recipients.pushIds.length}</dd>
                  </div>
                )}
                {m.channels.includes("EMAIL") && (
                  <div className="flex justify-between">
                    <dt className="flex items-center gap-1.5">
                      <Mail className="size-4" /> Email addresses
                    </dt>
                    <dd className="font-semibold">{recipients.emails.length}</dd>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between border-t border-line pt-2">
              <dt>Total recipients</dt>
              <dd className="font-heading text-xl font-extrabold text-green-900">{total}</dd>
            </div>
            {!draft && (
              <>
                <div className="flex justify-between">
                  <dt>Status</dt>
                  <dd>
                    <Badge tone={m.status === "SENT" ? "green" : m.status.includes("FAIL") ? "red" : "gold"}>{m.status.toLowerCase().replace("_", " ")}</Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivered / failed</dt>
                  <dd className="font-semibold">
                    {m.sentCount} / {m.failedCount}
                  </dd>
                </div>
                {m.sentAt && (
                  <div className="flex justify-between">
                    <dt>Finished</dt>
                    <dd>
                      {formatDay(m.sentAt)} {formatTime(m.sentAt)}
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>

          {draft && can(user, "messages") && (
            <div className="mt-5 space-y-3">
              {m.channels.includes("WEB_PUSH") && !available.WEB_PUSH && <Alert tone="orange">Web Push is not configured; push will not be delivered.</Alert>}
              {m.channels.includes("EMAIL") && !available.EMAIL && <Alert tone="orange">Email is not configured; email will not be delivered.</Alert>}
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  action={sendMessage.bind(null, m.id)}
                  variant="primary"
                  size="md"
                  confirm={`Send "${m.title}" to ${total} recipients now?`}
                >
                  Send now to {total}
                </ActionButton>
                <ActionButton action={cancelMessage.bind(null, m.id)} variant="ghost" size="md">
                  Discard
                </ActionButton>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </AdminPage>
  );
}
