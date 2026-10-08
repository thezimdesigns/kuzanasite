import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { getFooter, internalLinkOptions } from "@/lib/site-settings";
import { deleteFooterLink, moveFooterLink } from "@/app/admin/actions/site";
import { ActionButton } from "@/components/admin/admin-form";
import { FooterLinkForm, FooterSettingsForm } from "@/components/admin/footer-forms";
import { AdminPage, Panel, ReadOnlyNotice } from "@/components/admin/ui";

export const metadata = { title: "Footer" };

export default async function AdminFooter() {
  const user = await requireStaff();
  const editable = can(user, "site");
  const [{ settings, columns }, groups, stored] = await Promise.all([getFooter(), internalLinkOptions(), db.footerLink.count()]);
  const titles: [string, string] = [settings["footer.col1Title"], settings["footer.col2Title"]];
  const labelFor = (href: string) => groups.flatMap((g) => g.options).find((o) => o.href === href)?.label;

  return (
    <AdminPage title="Footer" description="Contact details, social links and the two columns of links shown at the bottom of every page.">
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Panel title="Footer details">
            <FooterSettingsForm values={settings} readOnly={!editable} />
          </Panel>
          {editable && (
            <Panel title="Add a link">
              <FooterLinkForm groups={groups} columns={titles} />
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          {!stored && (
            <p className="rounded-[var(--radius-control)] bg-cream-dark px-3 py-2 text-sm text-muted">
              These are the built-in links. They become editable records as soon as you add your first link.
            </p>
          )}
          {columns.map((links, c) => (
            <Panel key={c} title={titles[c]}>
              {links.length === 0 && <p className="text-sm text-muted">No links in this column.</p>}
              <ul className="divide-y divide-line">
                {links.map((l, i) => (
                  <li key={l.id} className="py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{l.label}</p>
                        <p className="flex items-center gap-1 truncate text-xs text-muted">
                          {labelFor(l.href) && l.href.startsWith("/") ? `Page: ${labelFor(l.href)}` : l.href}
                          {l.newTab && <ExternalLink className="size-3" aria-label="opens in new tab" />}
                        </p>
                      </div>
                      {editable && stored > 0 && (
                        <div className="flex shrink-0 items-center gap-1">
                          <ActionButton action={moveFooterLink.bind(null, l.id, -1)} variant="ghost" className={i === 0 ? "invisible" : ""}>
                            <ArrowUp className="size-4" aria-label="Move up" />
                          </ActionButton>
                          <ActionButton action={moveFooterLink.bind(null, l.id, 1)} variant="ghost" className={i === links.length - 1 ? "invisible" : ""}>
                            <ArrowDown className="size-4" aria-label="Move down" />
                          </ActionButton>
                          <ActionButton action={deleteFooterLink.bind(null, l.id)} variant="ghost" confirm={`Remove "${l.label}" from the footer?`}>
                            Remove
                          </ActionButton>
                        </div>
                      )}
                    </div>
                    {editable && stored > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-semibold text-green-800">Edit</summary>
                        <div className="mt-3">
                          <FooterLinkForm groups={groups} columns={titles} link={l} />
                        </div>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      </div>
    </AdminPage>
  );
}
