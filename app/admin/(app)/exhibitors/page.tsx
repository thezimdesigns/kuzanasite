import Link from "next/link";
import { Camera } from "lucide-react";
import type { Prisma } from "@/lib/generated/prisma/client";
import { ExhibitorStatus } from "@/lib/generated/prisma/enums";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { EXHIBITOR_STATUS_LABELS } from "@/lib/options";
import { requireStaff } from "@/lib/permissions";
import { formatDay, formatTime } from "@/lib/time";
import { AdminPage, RowLink, Table, Tabs } from "@/components/admin/ui";
import { Badge, ButtonLink, Input } from "@/components/ui";

export const metadata = { title: "Exhibitors" };

const TONE = { PENDING: "gold", APPROVED: "green", REJECTED: "red", NEEDS_INFORMATION: "orange" } as const;

export default async function AdminExhibitors({ searchParams }: PageProps<"/admin/exhibitors">) {
  await requireStaff();
  const sp = await searchParams;
  const status = Object.values(ExhibitorStatus).find((s) => s === sp.status);
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const where: Prisma.ExhibitorWhereInput = {
    ...(status && { status }),
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { contactName: { contains: q, mode: "insensitive" } }, { stand: { contains: q, mode: "insensitive" } }] }),
  };
  const [rows, grouped] = await Promise.all([
    db.exhibitor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { category: true, media: { where: { kind: "BOOTH" }, take: 1 }, _count: { select: { media: true } } },
    }),
    db.exhibitor.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s?: ExhibitorStatus) => (s ? (grouped.find((g) => g.status === s)?._count ?? 0) : grouped.reduce((n, g) => n + g._count, 0));

  return (
    <AdminPage
      title="Exhibitors"
      actions={
        <ButtonLink href="/admin/capture/exhibitor" size="sm">
          <Camera className="size-4" /> Capture exhibitor
        </ButtonLink>
      }
    >
      <Tabs
        current={status ?? "ALL"}
        tabs={[
          { value: "ALL", label: "All", href: "/admin/exhibitors", count: count() },
          ...Object.values(ExhibitorStatus).map((s) => ({ value: s, label: EXHIBITOR_STATUS_LABELS[s], href: `/admin/exhibitors?status=${s}`, count: count(s) })),
        ]}
      />
      <form className="mb-4 flex max-w-md gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <Input name="q" defaultValue={q} placeholder="Search name, contact or stand" type="search" />
      </form>
      <Table>
        <thead>
          <tr>
            <th />
            <th>Organisation</th>
            <th>Stand</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Source</th>
            <th>Received</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => {
            const thumb = fileUrl(x.media[0]?.key ?? x.logoKey);
            return (
              <tr key={x.id}>
                <td className="w-14">
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="size-10 rounded object-cover" loading="lazy" />
                  )}
                </td>
                <td>
                  <RowLink href={`/admin/exhibitors/${x.id}`}>{x.name}</RowLink>
                  <div className="text-xs text-muted">
                    {x.category?.name ?? "No sector"} · {x._count.media} files
                  </div>
                </td>
                <td className="whitespace-nowrap">{[x.hall && `H ${x.hall}`, x.stand && `S ${x.stand}`].filter(Boolean).join(" · ") || "-"}</td>
                <td>
                  {x.contactName}
                  <div className="text-xs text-muted">{x.phone}</div>
                </td>
                <td>
                  <Badge tone={TONE[x.status]}>{EXHIBITOR_STATUS_LABELS[x.status]}</Badge>
                </td>
                <td className="text-xs">{x.source === "STAFF" ? "Staff" : "Public"}</td>
                <td className="text-xs whitespace-nowrap">
                  {formatDay(x.createdAt)} {formatTime(x.createdAt)}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="py-8 text-center text-muted">
                No exhibitors here yet. <Link href="/admin/qr" className="underline">Print the registration QR code</Link>.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </AdminPage>
  );
}
