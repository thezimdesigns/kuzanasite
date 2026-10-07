import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { formatDay, formatTime, dateKey, startOfDay } from "@/lib/time";
import { AdminPage, Panel, Table, Tabs } from "@/components/admin/ui";
import { VisitorCreateForm } from "@/components/admin/visitor-create-form";
import { ButtonLink } from "@/components/ui";

export const metadata = { title: "Visitors" };

export default async function AdminVisitors({ searchParams }: PageProps<"/admin/visitors">) {
  const user = await requireStaff();
  const canSeeContacts = can(user, "visitors");
  const tab = (await searchParams).tab === "interest" ? "interest" : "visitors";
  const today = startOfDay(dateKey(new Date()));

  const [total, todayCount, emailOptIn, pushSubs, byInterest, byType, eventSubs, interestTotal] = await Promise.all([
    db.visitor.count(),
    db.visitor.count({ where: { createdAt: { gte: today } } }),
    db.visitor.count({ where: { emailConsent: true } }),
    db.pushSubscription.count({ where: { active: true } }),
    db.$queryRaw<{ interest: string; count: bigint }[]>`SELECT unnest(interests) AS interest, count(*) FROM "Visitor" GROUP BY 1 ORDER BY 2 DESC`,
    db.visitor.groupBy({ by: ["visitorType"], _count: true, orderBy: { _count: { visitorType: "desc" } } }),
    db.eventSubscription.groupBy({ by: ["eventId"], _count: true }),
    db.interestRegistration.count(),
  ]);
  const events = await db.event.findMany({ where: { id: { in: eventSubs.map((e) => e.eventId) } }, select: { id: true, title: true } });

  const visitors = tab === "visitors" && canSeeContacts ? await db.visitor.findMany({ orderBy: { createdAt: "desc" }, take: 200 }) : [];
  const interests = tab === "interest" && canSeeContacts ? await db.interestRegistration.findMany({ orderBy: { createdAt: "desc" }, take: 200 }) : [];

  const stats = [
    ["Registered visitors", total],
    ["Registered today", todayCount],
    ["Email opt-ins", emailOptIn],
    ["Active push subscribers", pushSubs],
    ["Interest registrations", interestTotal],
  ] as const;

  return (
    <AdminPage
      title="Visitors"
      actions={
        canSeeContacts && (
          <ButtonLink href={`/admin/visitors/export?type=${tab}`} size="sm" variant="outline" prefetch={false}>
            <Download className="size-4" /> Export CSV
          </ButtonLink>
        )
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-[var(--radius-card)] border border-line bg-white p-3">
            <p className="font-heading text-2xl font-extrabold text-green-900">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Panel title="Interests">
          <ul className="space-y-1 text-sm">
            {byInterest.map((r) => (
              <li key={r.interest} className="flex justify-between">
                <span>{r.interest}</span>
                <strong>{Number(r.count)}</strong>
              </li>
            ))}
            {byInterest.length === 0 && <li className="text-muted">No data yet.</li>}
          </ul>
        </Panel>
        <Panel title="Visitor types">
          <ul className="space-y-1 text-sm">
            {byType.map((r) => (
              <li key={r.visitorType ?? "none"} className="flex justify-between">
                <span>{r.visitorType ?? "Not given"}</span>
                <strong>{r._count}</strong>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Event followers (Notify me)">
          <ul className="space-y-1 text-sm">
            {eventSubs.map((r) => (
              <li key={r.eventId} className="flex justify-between">
                <span>{events.find((e) => e.id === r.eventId)?.title}</span>
                <strong>{r._count}</strong>
              </li>
            ))}
            {eventSubs.length === 0 && <li className="text-muted">No followers yet.</li>}
          </ul>
        </Panel>
      </div>

      {canSeeContacts && (
        <Panel title="Add a visitor" className="mb-6">
          <details>
            <summary className="cursor-pointer text-sm font-semibold text-green-800">Register a walk-in visitor</summary>
            <div className="mt-4 max-w-2xl">
              <VisitorCreateForm />
            </div>
          </details>
        </Panel>
      )}

      {canSeeContacts ? (
        <>
          <Tabs
            current={tab}
            tabs={[
              { value: "visitors", label: "Visitor registrations", href: "/admin/visitors", count: total },
              { value: "interest", label: "Future-edition interest", href: "/admin/visitors?tab=interest", count: interestTotal },
            ]}
          />
          {tab === "visitors" ? (
            <Table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Interests</th>
                  <th>Email</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      {v.name}
                      {v.organisation && <div className="text-xs text-muted">{v.organisation}</div>}
                    </td>
                    <td className="text-xs">
                      {v.phone}
                      {v.email && <div>{v.email}</div>}
                    </td>
                    <td className="text-xs">{v.visitorType ?? "-"}</td>
                    <td className="max-w-xs text-xs">{v.interests.join(", ")}</td>
                    <td className="text-xs">{v.emailConsent ? "Opted in" : "-"}</td>
                    <td className="text-xs whitespace-nowrap">
                      {formatDay(v.createdAt)} {formatTime(v.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Interest</th>
                  <th>Contact</th>
                  <th>Message</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {interests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.name}
                      {r.organisation && <div className="text-xs text-muted">{r.organisation}</div>}
                    </td>
                    <td>{r.interest}</td>
                    <td className="text-xs">
                      {r.phone}
                      {r.email && <div>{r.email}</div>}
                    </td>
                    <td className="max-w-xs text-xs">{r.message}</td>
                    <td className="text-xs whitespace-nowrap">{formatDay(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      ) : (
        <p className="text-sm text-muted">Contact details are only visible to programme editors and super admins.</p>
      )}
    </AdminPage>
  );
}
