import { db } from "@/lib/db";
import { can, getStaff } from "@/lib/permissions";

const csvCell = (v: unknown) => {
  const s = v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join("; ") : String(v ?? "");
  // Neutralise spreadsheet formulas and quote every cell.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(request: Request) {
  const user = await getStaff();
  if (!can(user, "visitors")) return new Response("Forbidden", { status: 403 });

  const type = new URL(request.url).searchParams.get("type") === "interest" ? "interest" : "visitors";
  const rows: Record<string, unknown>[] =
    type === "interest"
      ? await db.interestRegistration.findMany({ orderBy: { createdAt: "desc" } })
      : (await db.visitor.findMany({ orderBy: { createdAt: "desc" } })).map(({ unsubscribeToken: _t, ...v }) => v);

  const headers = rows[0] ? Object.keys(rows[0]) : ["id"];
  const csv = [headers.map(csvCell).join(","), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(","))].join("\r\n");
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kuzana-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
