import { db } from "@/lib/db";
import { FeedbackStatus } from "@/lib/generated/prisma/enums";
import { FEEDBACK_STATUS_LABELS } from "@/lib/options";
import { can, getStaff } from "@/lib/permissions";
import { endOfDay, formatDate, startOfDay } from "@/lib/time";
import { buildPdf, buildWorkbook } from "@/lib/feedback-export";

export const runtime = "nodejs";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Feedback as an Excel workbook (?format=xlsx) or a printable PDF report
 * (?format=pdf), for a date range (?from=YYYY-MM-DD&to=YYYY-MM-DD, Bulawayo
 * days) and optionally one status (?status=NEW).
 */
export async function GET(request: Request) {
  const user = await getStaff();
  if (!can(user, "feedback")) return new Response("Forbidden", { status: 403 });

  const sp = new URL(request.url).searchParams;
  const from = DAY.test(sp.get("from") ?? "") ? sp.get("from")! : null;
  const to = DAY.test(sp.get("to") ?? "") ? sp.get("to")! : null;
  const status = Object.values(FeedbackStatus).find((s) => s === sp.get("status"));
  const rows = await db.feedback.findMany({
    where: {
      ...(status && { status }),
      ...((from || to) && { createdAt: { ...(from && { gte: startOfDay(from) }), ...(to && { lte: endOfDay(to) }) } }),
    },
    orderBy: { createdAt: "asc" },
    include: { event: { select: { title: true } }, venue: { select: { name: true } } },
  });

  const range = from || to ? `${from ? formatDate(startOfDay(from)) : "the start"} to ${to ? formatDate(startOfDay(to)) : "today"}` : "all dates";
  const scope = `${status ? `${FEEDBACK_STATUS_LABELS[status]} feedback` : "All feedback"}, ${range}`;
  const stamp = new Date().toISOString().slice(0, 10);
  const name = `kuzana-feedback-${from ?? "start"}-to-${to ?? stamp}`;

  if (sp.get("format") === "pdf") {
    const pdf = await buildPdf(rows, scope);
    return new Response(Buffer.from(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}.pdf"`, "Cache-Control": "no-store" },
    });
  }
  const xlsx = await buildWorkbook(rows, scope);
  return new Response(Buffer.from(xlsx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
