import "server-only";
import { db } from "@/lib/db";
import { layout } from "@/lib/email/templates";
import { siteUrl } from "@/lib/site";
import { formatDay, formatTime } from "@/lib/time";

type Exhibitor = { name: string; slug: string; contactName: string };
type Enquiry = {
  name: string;
  organisation: string | null;
  email: string | null;
  phone: string | null;
  topic: string;
  message: string;
  createdAt: Date;
};

/** Enquiries not yet passed on, grouped by exhibitor. */
export async function pendingEnquiries(exhibitorId?: string) {
  return db.exhibitor.findMany({
    where: { id: exhibitorId, enquiries: { some: { forwardedAt: null } } },
    select: {
      id: true,
      name: true,
      slug: true,
      contactName: true,
      email: true,
      phone: true,
      edition: { select: { year: true } },
      enquiries: { where: { forwardedAt: null }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { name: "asc" },
  });
}

/** One enquiry as plain text, for the digest and for copying into WhatsApp. */
function enquiryText(e: Enquiry, n: number) {
  const from = [e.name, e.organisation].filter(Boolean).join(", ");
  const contact = [e.email && `Email: ${e.email}`, e.phone && `Phone: ${e.phone}`].filter(Boolean).join("\n");
  return `${n}. ${e.topic}\nFrom: ${from}\n${contact}\nSent: ${formatDay(e.createdAt)}, ${formatTime(e.createdAt)}\n\n"${e.message}"`;
}

/** The consolidated message sent to an exhibitor: every enquiry with the visitor's contact details. */
export function enquiryDigest(x: Exhibitor & { year: number }, enquiries: Enquiry[]) {
  const count = enquiries.length === 1 ? "1 visitor" : `${enquiries.length} visitors`;
  const subject = `${enquiries.length === 1 ? "A visitor enquiry" : `${enquiries.length} visitor enquiries`} for ${x.name} from KUZANA SCEEZ ${x.year}`;
  const title = `Visitor enquiries for ${x.name}`;
  const body = [
    `Dear ${x.contactName},`,
    `During KUZANA SCEEZ ${x.year}, ${count} sent an enquiry to ${x.name} through your exhibitor profile. Each one agreed to share their contact details with you, so please reply to them directly.`,
    ...enquiries.map((e, i) => enquiryText(e, i + 1)),
    `Thank you for exhibiting at KUZANA SCEEZ ${x.year}.`,
  ].join("\n\n");
  const profile = siteUrl(`/exhibitors/${x.slug}`);
  const { html, text } = layout({ title, body, ctaUrl: profile, ctaLabel: "View your profile" });
  return { subject, html, text, plain: `${title}\n\n${body}` };
}
