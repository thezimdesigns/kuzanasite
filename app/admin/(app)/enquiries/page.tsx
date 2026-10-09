import { Download } from "lucide-react";
import { deleteEnquiry } from "@/app/admin/actions/exhibitors";
import { ActionButton } from "@/components/admin/admin-form";
import { EmailAllEnquiries, ExhibitorEnquiryActions } from "@/components/admin/enquiry-actions";
import { AdminPage, Panel, RowLink } from "@/components/admin/ui";
import { Alert, Badge, buttonClass } from "@/components/ui";
import { db } from "@/lib/db";
import { emailConfigured } from "@/lib/email/ses";
import { enquiryDigest } from "@/lib/enquiries";
import { can, requireAreaPage } from "@/lib/permissions";
import { formatDay, formatTime } from "@/lib/time";

export const metadata = { title: "Visitor enquiries" };

export default async function AdminEnquiries() {
  const user = await requireAreaPage("exhibitors");
  const editable = can(user, "exhibitors");
  const canEmail = emailConfigured();
  const exhibitors = await db.exhibitor.findMany({
    where: { enquiries: { some: {} } },
    select: {
      id: true,
      name: true,
      slug: true,
      contactName: true,
      email: true,
      edition: { select: { year: true } },
      enquiries: { orderBy: { createdAt: "asc" } },
    },
  });
  const rows = exhibitors
    .map((x) => ({ ...x, pending: x.enquiries.filter((e) => !e.forwardedAt) }))
    // Exhibitors still waiting first, then by how many enquiries they have.
    .sort((a, b) => b.pending.length - a.pending.length || b.enquiries.length - a.enquiries.length);
  const total = rows.reduce((n, x) => n + x.enquiries.length, 0);
  const pending = rows.reduce((n, x) => n + x.pending.length, 0);
  const waiting = rows.filter((x) => x.pending.length);
  const noEmail = waiting.filter((x) => !x.email).length;

  return (
    <AdminPage
      title="Visitor enquiries"
      description="Enquiries visitors send from exhibitor profiles. After the expo, pass each exhibitor all of theirs in one email."
      actions={
        <>
          <a href="/admin/enquiries/export" className={buttonClass("outline", "sm")}>
            <Download className="size-4" aria-hidden /> All as CSV
          </a>
          {editable && <EmailAllEnquiries exhibitors={waiting.length - noEmail} enquiries={pending} disabled={!canEmail} />}
        </>
      }
    >
      {!canEmail && (
        <div className="mb-5">
          <Alert tone="orange">
            Email isn&apos;t set up on the server yet (Amazon SES keys). Until it is, use <strong>Copy text</strong> to paste an exhibitor&apos;s enquiries into
            WhatsApp or your own email, then <strong>Mark as passed on</strong>.
          </Alert>
        </div>
      )}

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Enquiries", total],
          ["Waiting to pass on", pending],
          ["Exhibitors waiting", waiting.length],
          ["Without an email", noEmail],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[var(--radius-card)] border border-line bg-white p-4">
            <dt className="text-xs font-semibold text-muted">{label}</dt>
            <dd className="mt-1 font-heading text-3xl font-extrabold text-green-900 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted">
            No enquiries yet. Visitors send them from the &ldquo;Send an enquiry&rdquo; box on each exhibitor&apos;s profile.
          </p>
        </Panel>
      ) : (
        <div className="space-y-4">
          {rows.map((x) => (
            <Panel
              key={x.id}
              title={
                <span className="flex flex-wrap items-center gap-2">
                  <RowLink href={`/admin/exhibitors/${x.id}`}>{x.name}</RowLink>
                  {x.pending.length > 0 ? <Badge tone="orange">{x.pending.length} waiting</Badge> : <Badge tone="green">All passed on</Badge>}
                  {!x.email && <Badge tone="red">No email</Badge>}
                </span>
              }
            >
              <p className="-mt-2 mb-4 text-sm text-muted">
                {x.contactName}
                {x.email && <> · {x.email}</>}
              </p>
              {editable && x.pending.length > 0 && (
                <div className="mb-4">
                  <ExhibitorEnquiryActions
                    exhibitorId={x.id}
                    hasEmail={!!x.email}
                    canEmail={canEmail}
                    digest={enquiryDigest({ ...x, year: x.edition.year }, x.pending).plain}
                  />
                </div>
              )}
              <ul className="divide-y divide-line border-t border-line">
                {x.enquiries.map((e) => (
                  <li key={e.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[12rem_1fr_auto] sm:gap-4">
                    <div>
                      <p className="font-semibold text-ink">{e.name}</p>
                      {e.organisation && <p className="text-muted">{e.organisation}</p>}
                      {e.email && (
                        <a href={`mailto:${e.email}`} className="block break-all text-green-800 hover:underline">
                          {e.email}
                        </a>
                      )}
                      {e.phone && <p className="text-muted">{e.phone}</p>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-wide text-orange-dark uppercase">{e.topic}</p>
                      <p className="mt-0.5 whitespace-pre-line">{e.message}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDay(e.createdAt)}, {formatTime(e.createdAt)}
                        {e.forwardedAt && ` · passed on ${formatDay(e.forwardedAt)} (${e.forwardedVia})`}
                      </p>
                    </div>
                    {editable && (
                      <ActionButton action={deleteEnquiry.bind(null, e.id)} confirm="Delete this enquiry (for example spam)?" variant="ghost">
                        Delete
                      </ActionButton>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
