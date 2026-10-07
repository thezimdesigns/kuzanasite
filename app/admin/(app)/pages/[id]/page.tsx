import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { PageForm } from "@/components/admin/page-form";
import { AdminPage, ReadOnlyNotice } from "@/components/admin/ui";

export default async function AdminPageEdit({ params }: PageProps<"/admin/pages/[id]">) {
  const user = await requireStaff();
  const page = await db.page.findUnique({ where: { id: (await params).id } });
  if (!page) notFound();
  return (
    <AdminPage
      title={page.title}
      back={{ href: "/admin/pages", label: "Pages" }}
      actions={
        <Link href={`/${page.slug}`} target="_blank" className="text-sm font-semibold text-green-800 underline">
          View page
        </Link>
      }
    >
      {!can(user, "site") && <ReadOnlyNotice />}
      <PageForm readOnly={!can(user, "site")} values={{ id: page.id, title: page.title, summary: page.summary ?? "", body: page.body }} />
    </AdminPage>
  );
}
