import { requireAreaPage } from "@/lib/permissions";
import { PersonForm } from "@/components/admin/person-form";
import { AdminPage } from "@/components/admin/ui";

export const metadata = { title: "New speaker" };

export default async function NewSpeaker() {
  await requireAreaPage("programme");
  return (
    <AdminPage title="New speaker / participant" back={{ href: "/admin/speakers", label: "Speakers" }}>
      <PersonForm
        values={{
          name: "",
          slug: "",
          jobTitle: "",
          organisation: "",
          bio: "",
          country: "",
          website: "",
          linkedin: "",
          twitter: "",
          instagram: "",
          photoKey: "",
          publishStatus: "PUBLISHED",
        }}
      />
    </AdminPage>
  );
}
