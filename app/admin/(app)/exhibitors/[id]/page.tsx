import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl, formatBytes } from "@/lib/files";
import { EXHIBITOR_STATUS_LABELS } from "@/lib/options";
import { can, requireStaff } from "@/lib/permissions";
import { formatDay, formatTime } from "@/lib/time";
import {
  deleteExhibitor,
  deleteExhibitorMedia,
  revokeCompletionLinks,
  setExhibitorLogo,
  setExhibitorStatus,
} from "@/app/admin/actions/exhibitors";
import { ActionButton } from "@/components/admin/admin-form";
import { CompletionLink } from "@/components/admin/completion-link";
import { ExhibitorEditForm } from "@/components/admin/exhibitor-edit-form";
import { AdminPage, Panel, ReadOnlyNotice } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export default async function AdminExhibitor({ params }: PageProps<"/admin/exhibitors/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "exhibitors");
  const { id } = await params;
  const [x, sectors] = await Promise.all([
    db.exhibitor.findUnique({
      where: { id },
      include: {
        category: true,
        media: { orderBy: { sortOrder: "asc" } },
        claimTokens: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    db.exhibitorCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!x) notFound();
  const activeLinks = x.claimTokens.filter((t) => !t.revokedAt && t.expiresAt > new Date());

  return (
    <AdminPage
      title={x.name}
      back={{ href: "/admin/exhibitors", label: "Exhibitors" }}
      description={
        <>
          {x.source === "STAFF" ? "Captured by staff" : "Submitted by exhibitor"} on {formatDay(x.createdAt)} {formatTime(x.createdAt)} ·{" "}
          <Badge tone={x.status === "APPROVED" ? "green" : x.status === "REJECTED" ? "red" : "gold"}>{EXHIBITOR_STATUS_LABELS[x.status]}</Badge>
        </>
      }
      actions={
        x.status === "APPROVED" ? (
          <Link href={`/exhibitors/${x.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-green-800 underline">
            Public profile <ExternalLink className="size-3.5" />
          </Link>
        ) : null
      }
    >
      {!editable && <ReadOnlyNotice />}
      {editable && (
        <Panel title="Review" className="mb-6">
          <div className="flex flex-wrap gap-2">
            {x.status !== "APPROVED" && (
              <ActionButton action={setExhibitorStatus.bind(null, x.id, "APPROVED")} variant="secondary">
                Approve &amp; publish
              </ActionButton>
            )}
            {x.status !== "NEEDS_INFORMATION" && (
              <ActionButton action={setExhibitorStatus.bind(null, x.id, "NEEDS_INFORMATION")}>Needs information</ActionButton>
            )}
            {x.status !== "PENDING" && <ActionButton action={setExhibitorStatus.bind(null, x.id, "PENDING")}>Back to pending</ActionButton>}
            {x.status !== "REJECTED" && (
              <ActionButton action={setExhibitorStatus.bind(null, x.id, "REJECTED")} confirm="Reject this exhibitor? It will not be shown publicly.">
                Reject
              </ActionButton>
            )}
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-2 font-semibold">Request more information</h3>
            <p className="mb-3 text-sm text-muted">
              Creates a private link (valid 14 days) the exhibitor can use to complete their profile without an account. Send it by WhatsApp, SMS or email.
            </p>
            <CompletionLink exhibitorId={x.id} phone={x.whatsapp ?? x.phone} name={x.contactName} />
            {activeLinks.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                {activeLinks.length} active link(s), last created {formatDay(activeLinks[0].createdAt)}
                {activeLinks[0].usedAt && ` · used ${formatDay(activeLinks[0].usedAt)}`}
                <ActionButton action={revokeCompletionLinks.bind(null, x.id)} variant="ghost" confirm="Revoke all completion links for this exhibitor?">
                  Revoke links
                </ActionButton>
              </div>
            )}
          </div>
        </Panel>
      )}

      <Panel title={`Photos & files (${x.media.length})`} className="mb-6">
        {x.media.length === 0 ? (
          <p className="text-sm text-muted">No files.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {x.media.map((m) => (
              <li key={m.id} className="overflow-hidden rounded-lg border border-line">
                <a href={fileUrl(m.key)!} target="_blank" rel="noopener" className="block">
                  {m.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileUrl(m.key)!} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex aspect-[4/3] flex-col items-center justify-center gap-1 bg-cream-dark p-2 text-center text-xs">
                      <FileText className="size-6" /> {m.fileName ?? "Document"}
                    </span>
                  )}
                </a>
                <div className="space-y-1 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <Badge>{m.kind.toLowerCase().replace("_", " ")}</Badge>
                    <span className="text-muted">{formatBytes(m.size)}</span>
                  </div>
                  {editable && (
                    <div className="flex flex-wrap gap-1">
                      {m.mimeType.startsWith("image/") && x.logoKey !== m.key && (
                        <ActionButton action={setExhibitorLogo.bind(null, x.id, m.key)} variant="ghost">
                          Use as logo
                        </ActionButton>
                      )}
                      {x.logoKey === m.key && <Badge tone="green">Logo</Badge>}
                      <ActionButton action={deleteExhibitorMedia.bind(null, m.id)} variant="ghost" confirm="Delete this file permanently?">
                        Delete
                      </ActionButton>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ExhibitorEditForm
        sectors={sectors}
        readOnly={!editable}
        x={{
          id: x.id,
          name: x.name,
          contactName: x.contactName,
          phone: x.phone,
          email: x.email ?? "",
          categoryId: x.categoryId ?? "",
          hall: x.hall ?? "",
          stand: x.stand ?? "",
          description: x.description ?? "",
          showcasing: x.showcasing ?? "",
          products: x.products ?? "",
          website: x.website ?? "",
          facebook: x.facebook ?? "",
          instagram: x.instagram ?? "",
          linkedin: x.linkedin ?? "",
          tiktok: x.tiktok ?? "",
          whatsapp: x.whatsapp ?? "",
          address: x.address ?? "",
          seeking: x.seeking ?? "",
          offering: x.offering ?? "",
          reviewNotes: x.reviewNotes ?? "",
          opportunities: x.opportunities,
          consent: x.consent,
        }}
      />

      {editable && (
        <div className="mt-8 border-t border-line pt-6">
          <ActionButton action={deleteExhibitor.bind(null, x.id)} variant="danger" confirm={`Permanently delete ${x.name} and all its files?`}>
            Delete exhibitor
          </ActionButton>
        </div>
      )}
    </AdminPage>
  );
}
