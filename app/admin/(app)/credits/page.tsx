import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { deleteProvider } from "@/app/admin/actions/site";
import { ActionButton } from "@/components/admin/admin-form";
import { CategoryManager, emptyProvider, ProviderForm } from "@/components/admin/provider-forms";
import { AdminPage, Panel, PublishBadge, ReadOnlyNotice } from "@/components/admin/ui";
import { Avatar } from "@/components/public/avatar";

export const metadata = { title: "Service providers" };

export default async function AdminCredits() {
  const user = await requireStaff();
  const editable = can(user, "site");
  const [categories, providers] = await Promise.all([
    db.serviceCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { providers: true } } },
    }),
    db.serviceProvider.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  const groups = [
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      items: providers.filter((p) => p.categoryId === c.id),
    })),
    {
      id: "other",
      name: "Other services",
      items: providers.filter((p) => !p.categoryId),
    },
  ].filter((g) => g.items.length);
  const cats = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <AdminPage title="Service providers" description="People and organisations who delivered KUZANA, shown on the public Credits page (/credits).">
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          {groups.map((g) => (
            <Panel key={g.id} title={`${g.name} (${g.items.length})`}>
              <ul className="divide-y divide-line">
                {g.items.map((p) => (
                  <li key={p.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} photoKey={p.photoKey} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{p.name}</p>
                        {p.role && <p className="truncate text-xs text-muted">{p.role}</p>}
                      </div>
                      <PublishBadge status={p.publishStatus} />
                    </div>
                    {editable && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-semibold text-green-800">Edit</summary>
                        <div className="mt-3">
                          <ProviderForm
                            categories={cats}
                            values={{
                              id: p.id,
                              name: p.name,
                              kind: p.kind,
                              categoryId: p.categoryId ?? "",
                              role: p.role ?? "",
                              description: p.description ?? "",
                              photoKey: p.photoKey ?? "",
                              website: p.website ?? "",
                              email: p.email ?? "",
                              phone: p.phone ?? "",
                              facebook: p.facebook ?? "",
                              instagram: p.instagram ?? "",
                              linkedin: p.linkedin ?? "",
                              publishStatus: p.publishStatus,
                              sortOrder: p.sortOrder,
                            }}
                          />
                          <div className="mt-2">
                            <ActionButton action={deleteProvider.bind(null, p.id)} variant="ghost" confirm={`Remove ${p.name}?`}>
                              Remove
                            </ActionButton>
                          </div>
                        </div>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
          {providers.length === 0 && <p className="text-sm text-muted">No service providers yet.</p>}
        </div>
        {editable && (
          <div className="space-y-6">
            <Panel title="Add a provider">
              <ProviderForm categories={cats} values={emptyProvider} />
            </Panel>
            <Panel title="Categories">
              <CategoryManager
                categories={categories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  count: c._count.providers,
                }))}
              />
            </Panel>
          </div>
        )}
      </div>
    </AdminPage>
  );
}
