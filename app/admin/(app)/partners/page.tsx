import Image from "next/image";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";
import { PARTNER_TIER_LABELS } from "@/lib/options";
import { can, requireStaff } from "@/lib/permissions";
import { deletePartner } from "@/app/admin/actions/site";
import { ActionButton } from "@/components/admin/admin-form";
import { PartnerForm } from "@/components/admin/partner-form";
import { AdminPage, Panel, ReadOnlyNotice } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export const metadata = { title: "Partners" };

export default async function AdminPartners() {
  const user = await requireStaff();
  const editable = can(user, "site");
  const [partners, editions] = await Promise.all([
    db.partner.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { editions: { select: { id: true, year: true }, orderBy: { year: "asc" } } },
    }),
    db.edition.findMany({ orderBy: { year: "asc" }, select: { id: true, year: true, isCurrent: true } }),
  ]);
  const current = editions.find((e) => e.isCurrent);
  return (
    <AdminPage
      title="Partners & sponsors"
      description="Tick the years each organisation partnered, so it shows on the right edition. Partners with no years ticked show every year."
    >
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {editable && (
          <Panel title="Add partner">
            <PartnerForm
              values={{
                name: "",
                url: "",
                tier: "SPONSOR",
                caption: "",
                logoKey: "",
                description: "",
                facebook: "",
                instagram: "",
                linkedin: "",
                youtube: "",
                prominent: false,
                sortOrder: partners.length + 1,
                editionIds: current ? [current.id] : [],
              }}
              editions={editions}
            />
          </Panel>
        )}
        <ul className="space-y-3">
          {partners.map((p) => {
            const logo = p.logoUrl ?? fileUrl(p.logoKey);
            return (
              <li key={p.id}>
                <Panel>
                  <div className="flex items-center gap-3">
                    {logo && <Image src={logo} alt="" width={80} height={40} className="h-10 w-20 object-contain" />}
                    <span className="font-semibold">{p.name}</span>
                    <Badge>{PARTNER_TIER_LABELS[p.tier]}</Badge>
                    <span className="ml-auto text-xs font-semibold text-muted tabular-nums">
                      {p.editions.length ? p.editions.map((e) => e.year).join(", ") : "Every year"}
                    </span>
                  </div>
                  {editable && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-semibold text-green-800">Edit</summary>
                      <div className="mt-3">
                        <PartnerForm
                          values={{
                            id: p.id,
                            name: p.name,
                            url: p.url ?? "",
                            tier: p.tier,
                            caption: p.caption ?? "",
                            logoKey: p.logoKey ?? "",
                            description: p.description ?? "",
                            facebook: p.facebook ?? "",
                            instagram: p.instagram ?? "",
                            linkedin: p.linkedin ?? "",
                            youtube: p.youtube ?? "",
                            prominent: p.prominent,
                            sortOrder: p.sortOrder,
                            editionIds: p.editions.map((e) => e.id),
                          }}
                          editions={editions}
                        />
                        <div className="mt-2">
                          <ActionButton action={deletePartner.bind(null, p.id)} variant="ghost" confirm={`Remove ${p.name}?`}>
                            Remove
                          </ActionButton>
                        </div>
                      </div>
                    </details>
                  )}
                </Panel>
              </li>
            );
          })}
        </ul>
      </div>
    </AdminPage>
  );
}
