import { db } from "@/lib/db";
import { requireAreaPage, ROLE_LABELS } from "@/lib/permissions";
import { formatDate } from "@/lib/time";
import { UserCreateForm, UserEditForm } from "@/components/admin/user-forms";
import { AdminPage, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export const metadata = { title: "Users" };

export default async function AdminUsers() {
  const me = await requireAreaPage("users");
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <AdminPage title="Staff accounts" description="There is no public sign-up. Create accounts here and share the password securely.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Panel title="Add staff member">
          <UserCreateForm />
          <div className="mt-5 space-y-1 border-t border-line pt-4 text-xs text-muted">
            {Object.entries(ROLE_LABELS).map(([k, l]) => (
              <p key={k}>
                <strong>{l}</strong>
                {
                  {
                    SUPER_ADMIN: ": everything, including users",
                    PROGRAMME_EDITOR: ": events, sessions, speakers, venues, announcements, messaging, visitors",
                    MEDIA_EDITOR: ": photo galleries and videos",
                    PRESS_OFFICER: ": press releases, speeches, presentations, documents",
                    EXHIBITOR_MANAGER: ": exhibitor capture, review and completion links",
                    FEEDBACK_MANAGER: ": visitor feedback",
                    VIEWER: ": read-only access to the admin",
                  }[k]
                }
              </p>
            ))}
          </div>
        </Panel>
        <ul className="space-y-3">
          {users.map((u) => (
            <li key={u.id}>
              <Panel>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{u.name}</span>
                  <span className="text-sm text-muted">{u.email}</span>
                  <Badge tone={u.role === "SUPER_ADMIN" ? "orange" : "green"}>{ROLE_LABELS[u.role]}</Badge>
                  {!u.active && <Badge tone="red">disabled</Badge>}
                  {u.id === me.id && <Badge>you</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted">Added {formatDate(u.createdAt)}</p>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-green-800">Change role, disable or reset password</summary>
                  <div className="mt-3">
                    <UserEditForm id={u.id} role={u.role} active={u.active} />
                  </div>
                </details>
              </Panel>
            </li>
          ))}
        </ul>
      </div>
    </AdminPage>
  );
}
