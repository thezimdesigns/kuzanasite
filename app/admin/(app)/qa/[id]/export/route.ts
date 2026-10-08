import { db } from "@/lib/db";
import { can, getStaff } from "@/lib/permissions";
import { formatDate, formatTime } from "@/lib/time";

const cell = (v: string | number | null | undefined) => {
  const s = String(v ?? "");
  // Quote every cell; neutralise spreadsheet formulas.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

/** All questions and contributions for one conference, as a spreadsheet. */
export async function GET(_req: Request, { params }: RouteContext<"/admin/qa/[id]/export">) {
  if (!can(await getStaff(), "qa")) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const event = await db.event.findUnique({ where: { id }, select: { title: true, slug: true } });
  if (!event) return new Response("Not found", { status: 404 });
  const rows = await db.conferenceQuestion.findMany({
    where: { eventId: id },
    orderBy: [{ createdAt: "asc" }],
    include: { session: { select: { title: true } } },
  });
  const header = ["Type", "Status", "Session", "Question / contribution", "Name", "Organisation", "Votes", "Date", "Time"];
  const lines = [
    header.map(cell).join(","),
    ...rows.map((r) =>
      [r.kind === "QUESTION" ? "Question" : "Contribution", r.status, r.session?.title ?? "General", r.body, r.name, r.organisation, r.votes, formatDate(r.createdAt), formatTime(r.createdAt)]
        .map(cell)
        .join(","),
    ),
  ];
  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-questions.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
