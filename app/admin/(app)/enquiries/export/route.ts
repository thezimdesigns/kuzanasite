import { db } from "@/lib/db";
import { can, getStaff } from "@/lib/permissions";

const csvCell = (v: unknown) => {
  const s = v instanceof Date ? v.toISOString() : String(v ?? "");
  // Neutralise spreadsheet formulas and quote every cell.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** Visitor enquiries as CSV: all of them, or one exhibitor's (?exhibitor=id). */
export async function GET(request: Request) {
  const user = await getStaff();
  if (!can(user, "exhibitors")) return new Response("Forbidden", { status: 403 });

  const exhibitorId = new URL(request.url).searchParams.get("exhibitor") ?? undefined;
  const rows = await db.exhibitorEnquiry.findMany({
    where: { exhibitorId },
    orderBy: [{ exhibitor: { name: "asc" } }, { createdAt: "asc" }],
    include: { exhibitor: { select: { name: true, slug: true } } },
  });
  const headers = ["Exhibitor", "Received", "Topic", "Name", "Organisation", "Email", "Phone", "Message", "Passed on", "How"];
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map((r) =>
      [r.exhibitor.name, r.createdAt, r.topic, r.name, r.organisation, r.email, r.phone, r.message, r.forwardedAt, r.forwardedVia].map(csvCell).join(","),
    ),
  ].join("\r\n");
  const slug = exhibitorId && rows[0] ? rows[0].exhibitor.slug : "all";
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kuzana-enquiries-${slug}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
