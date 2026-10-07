import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requireStaff } from "@/lib/permissions";
import { deletePerson } from "@/app/admin/actions/programme";
import { ActionButton } from "@/components/admin/admin-form";
import { PersonForm } from "@/components/admin/person-form";
import { AdminPage, ReadOnlyNotice } from "@/components/admin/ui";

export default async function AdminSpeaker({ params }: PageProps<"/admin/speakers/[id]">) {
  const user = await requireStaff();
  const editable = can(user, "programme");
  const p = await db.person.findUnique({ where: { id: (await params).id } });
  if (!p) notFound();
  return (
    <AdminPage title={p.name} back={{ href: "/admin/speakers", label: "Speakers" }}>
      {!editable && <ReadOnlyNotice />}
      <PersonForm
        readOnly={!editable}
        values={{
          id: p.id,
          name: p.name,
          slug: p.slug,
          jobTitle: p.jobTitle ?? "",
          organisation: p.organisation ?? "",
          bio: p.bio ?? "",
          country: p.country ?? "",
          website: p.website ?? "",
          linkedin: p.linkedin ?? "",
          twitter: p.twitter ?? "",
          instagram: p.instagram ?? "",
          photoKey: p.photoKey ?? "",
          publishStatus: p.publishStatus,
        }}
      />
      {editable && (
        <div className="mt-8">
          <ActionButton action={deletePerson.bind(null, p.id)} variant="danger" confirm={`Delete ${p.name}? They will be removed from all events and sessions.`}>
            Delete person
          </ActionButton>
        </div>
      )}
    </AdminPage>
  );
}
