import QRCode from "qrcode";
import { exhibitorRegistrationPath } from "@/lib/exhibitor-access";
import { can, requireStaff } from "@/lib/permissions";
import { siteUrl } from "@/lib/site";
import { AdminPage } from "@/components/admin/ui";
import { PrintButton } from "@/components/admin/print-button";

export const metadata = { title: "QR codes" };

export default async function QrPage() {
  const user = await requireStaff();
  const signs = [
    {
      heading: "WHAT'S HAPPENING TODAY?",
      path: "/programme/today",
      note: "Today's programme",
    },
    {
      heading: "KUZANA LIVE",
      path: "/live",
      note: "What's on now and announcements",
    },
    {
      heading: "EXPLORE KUZANA EXHIBITORS",
      path: "/exhibitors",
      note: "Exhibitor directory",
    },
    {
      heading: "TELL US ABOUT YOUR KUZANA EXPERIENCE",
      path: "/feedback",
      note: "Visitor feedback",
    },
    {
      heading: "REGISTER AS A KUZANA VISITOR",
      path: "/register",
      note: "Visitor registration",
    },
    ...(can(user, "exhibitors")
      ? [
          {
            heading: "REGISTER YOUR KUZANA STAND",
            path: exhibitorRegistrationPath(),
            note: "Exhibitors only: do not post publicly",
            private: true,
          },
        ]
      : []),
  ];
  const codes = await Promise.all(
    signs.map(async (s) => ({
      ...s,
      url: siteUrl(s.path),
      svg: await QRCode.toString(siteUrl(s.path), {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#00512d", light: "#ffffff" },
      }),
    })),
  );

  return (
    <AdminPage
      title="QR codes for signage"
      description="Print these for signs, banners and the exhibitor desk. Each page prints on its own sheet."
      actions={<PrintButton />}
    >
      <div className="grid gap-6 sm:grid-cols-2 print:block">
        {codes.map((c) => (
          <section
            key={c.path}
            className="flex flex-col items-center rounded-[var(--radius-card)] border border-line bg-white p-6 text-center print:h-[100vh] print:break-after-page print:justify-center print:border-0"
          >
            <p className="font-heading text-2xl font-extrabold text-green-900 print:text-5xl">{c.heading}</p>
            <div className="my-5 w-56 print:w-[60vw]" dangerouslySetInnerHTML={{ __html: c.svg }} />
            <p className="font-heading text-lg font-bold text-orange print:text-3xl">Scan with your phone camera</p>
            <p className="mt-2 text-sm break-all text-muted print:text-xl">{c.url.replace(/^https?:\/\//, "")}</p>
            {"private" in c && <p className="mt-3 rounded bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-dark print:hidden">{c.note}</p>}
          </section>
        ))}
      </div>
    </AdminPage>
  );
}
