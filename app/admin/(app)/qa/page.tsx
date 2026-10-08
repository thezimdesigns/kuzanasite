import Link from "next/link";
import { db } from "@/lib/db";
import { qaAutoApprove } from "@/lib/qa";
import { can, requireStaff } from "@/lib/permissions";
import { formatRange } from "@/lib/time";
import { AutoApproveToggle } from "@/components/admin/qa-controls";
import { AdminPage, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export const metadata = { title: "Conference Q&A" };

export default async function AdminQa() {
  const user = await requireStaff({ moderatorOk: true });
  const [conferences, counts, auto] = await Promise.all([
    db.event.findMany({ where: { isConference: true }, orderBy: { startsAt: "asc" } }),
    db.conferenceQuestion.groupBy({ by: ["eventId", "status", "kind"], _count: true }),
    qaAutoApprove(),
  ]);
  const count = (eventId: string, f: (c: (typeof counts)[number]) => boolean) => counts.filter((c) => c.eventId === eventId && f(c)).reduce((n, c) => n + c._count, 0);
  return (
    <AdminPage title="Conference Q&A" description="Delegates ask questions and share contributions from their phones. Moderate them here and put the chosen question on the hall screen.">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ul className="space-y-3">
          {conferences.map((c) => {
            const pending = count(c.id, (x) => x.kind === "QUESTION" && x.status === "PENDING");
            return (
              <li key={c.id}>
                <Link href={`/admin/qa/${c.id}`} className="block rounded-[var(--radius-card)] border border-line bg-white p-4 hover:border-green-800">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-heading font-bold text-green-900">{c.title}</span>
                    {pending > 0 && <Badge tone="orange">{pending} waiting</Badge>}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {formatRange(c.startsAt, c.endsAt, c.timeTbc, c.dailyHours)} · {count(c.id, (x) => x.kind === "QUESTION")} questions ·{" "}
                    {count(c.id, (x) => x.kind === "CONTRIBUTION")} contributions
                  </span>
                </Link>
              </li>
            );
          })}
          {conferences.length === 0 && <p className="text-sm text-muted">No conferences yet. Tick &ldquo;Conference&rdquo; on an event to take questions.</p>}
        </ul>
        {can(user, "qa") && (
          <Panel title="Settings">
            <AutoApproveToggle on={auto} />
          </Panel>
        )}
      </div>
    </AdminPage>
  );
}
