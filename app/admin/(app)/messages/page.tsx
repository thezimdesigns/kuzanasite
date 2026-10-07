import { db } from "@/lib/db";
import { audienceOptions, channelAvailability } from "@/lib/messaging";
import { can, requireStaff } from "@/lib/permissions";
import { formatDay, formatTime } from "@/lib/time";
import { MessageComposer } from "@/components/admin/message-composer";
import { AdminPage, Panel, RowLink, Table } from "@/components/admin/ui";
import { Alert, Badge } from "@/components/ui";

export const metadata = { title: "Messaging" };

export default async function AdminMessages() {
  const user = await requireStaff();
  const [messages, audiences] = await Promise.all([
    db.message.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    audienceOptions(),
  ]);
  const channels = channelAvailability();
  return (
    <AdminPage title="Messaging centre" description="Send programme changes and reminders to people who opted in. Nothing is sent until you confirm.">
      {!channels.WEB_PUSH && (
        <div className="mb-3">
          <Alert tone="orange">Web Push is not configured (VAPID keys missing).</Alert>
        </div>
      )}
      {!channels.EMAIL && (
        <div className="mb-3">
          <Alert tone="orange">Email (Amazon SES) is not configured. Email sends will be recorded as failed.</Alert>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {can(user, "messages") && (
          <Panel title="New message">
            <MessageComposer audiences={audiences} />
          </Panel>
        )}
        <Table className="h-fit">
          <thead>
            <tr>
              <th>Message</th>
              <th>Status</th>
              <th>Delivered</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id}>
                <td>
                  <RowLink href={`/admin/messages/${m.id}`}>{m.title}</RowLink>
                  <div className="text-xs text-muted">{m.channels.map((c) => (c === "WEB_PUSH" ? "Push" : "Email")).join(" + ")}</div>
                </td>
                <td>
                  <Badge tone={m.status === "SENT" ? "green" : m.status === "DRAFT" ? "gold" : m.status.includes("FAIL") ? "red" : "neutral"}>
                    {m.status.toLowerCase().replace("_", " ")}
                  </Badge>
                </td>
                <td className="text-xs">{m.status === "DRAFT" ? "-" : `${m.sentCount}/${m.recipientCount}`}</td>
                <td className="text-xs whitespace-nowrap">
                  {formatDay(m.createdAt)} {formatTime(m.createdAt)}
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted">
                  No messages yet.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </AdminPage>
  );
}
