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
  const partners = await db.partner.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return (
    <AdminPage title="Partners & sponsors">
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {editable && (
          <Panel title="Add partner">
            <PartnerForm values={{ name: "", url: "", tier: "PARTNER", caption: "", logoKey: "", prominent: false, sortOrder: partners.length + 1 }} />
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
                  </div>
                  {editable && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-semibold text-green-800">Edit</summary>
                      <div className="mt-3">
                        <PartnerForm values={{ id: p.id, name: p.name, url: p.url ?? "", tier: p.tier, caption: p.caption ?? "", logoKey: p.logoKey ?? "", prominent: p.prominent, sortOrder: p.sortOrder }} />
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
