import { db } from "@/lib/db";
import { requireAreaPage } from "@/lib/permissions";
import { toLocalInput } from "@/lib/time";
import { NewsForm } from "@/components/admin/news-form";
import { AdminPage } from "@/components/admin/ui";
import { newsOptions } from "@/lib/news-admin";

export const metadata = { title: "New story" };

export default async function NewNews({ searchParams }: PageProps<"/admin/news/new">) {
  await requireAreaPage("press");
  const sp = await searchParams;
  const options = await newsOptions();
  const seriesId = typeof sp.series === "string" && options.series.some((s) => s.id === sp.series) ? sp.series : "";
  // Next part number when starting from a series.
  const lastPart = seriesId ? await db.newsPost.aggregate({ where: { seriesId }, _max: { seriesPart: true } }) : null;
  return (
    <AdminPage title="New story" back={{ href: "/admin/news", label: "News" }}>
      <NewsForm
        options={options}
        values={{
          title: "",
          slug: "",
          excerpt: "",
          body: "",
          coverKey: "",
          coverAlt: "",
          coverCaption: "",
          coverCredit: "",
          coverCreditUrl: "",
          pdfKey: "",
          pdfName: "",
          images: [],
          nextImageNumber: 1,
          author: "",
          eventId: "",
          featured: false,
          publishStatus: "PUBLISHED",
          publishedAt: toLocalInput(new Date()),
          kind: sp.kind === "STORY" || sp.kind === "INTERVIEW" ? sp.kind : "UPDATE",
          seriesId,
          seriesPart: lastPart ? String((lastPart._max.seriesPart ?? 0) + 1) : "",
          exhibitorIds: [],
          personIds: [],
        }}
      />
    </AdminPage>
  );
}
