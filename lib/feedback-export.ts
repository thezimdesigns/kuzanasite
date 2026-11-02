import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { FEEDBACK_STATUS_LABELS } from "@/lib/options";
import { formatDay, formatTime } from "@/lib/time";
import type { FeedbackStatus } from "@/lib/generated/prisma/enums";

/** One feedback row as the exports need it. */
export type Row = {
  createdAt: Date;
  category: string;
  rating: number | null;
  message: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  anonymous: boolean;
  contactPermission: boolean;
  publishConsent: boolean;
  isPublic: boolean;
  status: FeedbackStatus;
  adminNotes: string | null;
  event: { title: string } | null;
  venue: { name: string } | null;
};

const who = (f: Row) => (f.anonymous ? "Anonymous" : f.name || "Not given");

function summary(rows: Row[]) {
  const rated = rows.filter((r) => r.rating);
  const avg = rated.length ? rated.reduce((n, r) => n + (r.rating ?? 0), 0) / rated.length : null;
  const by = (key: (r: Row) => string) =>
    [...rows.reduce((m, r) => m.set(key(r), (m.get(key(r)) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  return { total: rows.length, avg, rated: rated.length, categories: by((r) => r.category), statuses: by((r) => FEEDBACK_STATUS_LABELS[r.status]) };
}

// ---------------------------------------------------------------------------
// Excel
// ---------------------------------------------------------------------------

export async function buildWorkbook(rows: Row[], scope: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "KUZANA SCEEZ";
  wb.created = new Date();
  const green = "FF00512D";

  const ws = wb.addWorksheet("Feedback", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Received", key: "received", width: 18 },
    { header: "Category", key: "category", width: 20 },
    { header: "Rating", key: "rating", width: 8 },
    { header: "Message", key: "message", width: 70 },
    { header: "Event", key: "event", width: 28 },
    { header: "Venue", key: "venue", width: 22 },
    { header: "From", key: "from", width: 22 },
    { header: "Email", key: "email", width: 26 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "May contact", key: "contact", width: 12 },
    { header: "May quote", key: "quote", width: 11 },
    { header: "On website", key: "public", width: 11 },
    { header: "Status", key: "status", width: 14 },
    { header: "Internal notes", key: "notes", width: 40 },
  ];
  for (const f of rows) {
    ws.addRow({
      received: f.createdAt,
      category: f.category,
      rating: f.rating ?? "",
      message: f.message,
      event: f.event?.title ?? "",
      venue: f.venue?.name ?? "",
      from: who(f),
      email: f.anonymous ? "" : (f.email ?? ""),
      phone: f.anonymous ? "" : (f.phone ?? ""),
      contact: f.contactPermission ? "Yes" : "No",
      quote: f.publishConsent ? "Yes" : "No",
      public: f.isPublic ? "Yes" : "No",
      status: FEEDBACK_STATUS_LABELS[f.status],
      notes: f.adminNotes ?? "",
    });
  }
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: green } };
  header.alignment = { vertical: "middle" };
  ws.getColumn("received").numFmt = "ddd d mmm yyyy hh:mm";
  for (const key of ["message", "notes", "event"]) ws.getColumn(key).alignment = { wrapText: true, vertical: "top" };
  ws.eachRow((r, i) => i > 1 && (r.alignment = { ...r.alignment, vertical: "top" }));
  ws.autoFilter = { from: "A1", to: "N1" };

  const s = summary(rows);
  const sum = wb.addWorksheet("Summary");
  sum.columns = [{ width: 32 }, { width: 14 }];
  sum.addRow(["KUZANA SCEEZ feedback"]).font = { bold: true, size: 14, color: { argb: green } };
  sum.addRow([scope]);
  sum.addRow([]);
  sum.addRow(["Feedback received", s.total]);
  sum.addRow(["Average rating (of those rated)", s.avg ? Number(s.avg.toFixed(2)) : "None rated"]);
  sum.addRow(["Rated", s.rated]);
  sum.addRow([]);
  sum.addRow(["By category"]).font = { bold: true };
  for (const [k, v] of s.categories) sum.addRow([k, v]);
  sum.addRow([]);
  sum.addRow(["By status"]).font = { bold: true };
  for (const [k, v] of s.statuses) sum.addRow([k, v]);

  return wb.xlsx.writeBuffer();
}

// ---------------------------------------------------------------------------
// PDF (A4, a readable report: summary, then each piece of feedback)
// ---------------------------------------------------------------------------

/** The standard PDF fonts only cover Windows-1252; swap or drop anything else (emoji, other scripts). */
function safe(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/\r/g, "")
    .replace(/[^\n\x20-\x7E\xA0-\xFF]/g, "");
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const para of safe(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) line = next;
      else {
        if (line) lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function buildPdf(rows: Row[], scope: string) {
  const doc = await PDFDocument.create();
  doc.setTitle("KUZANA SCEEZ feedback");
  doc.setAuthor("KUZANA SCEEZ");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const green = rgb(0, 0.318, 0.176);
  const orange = rgb(0.953, 0.424, 0.129);
  const muted = rgb(0.36, 0.36, 0.36);
  const [W, H] = [595.28, 841.89];
  const M = 48;
  const width = W - M * 2;

  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;
  const ensure = (needed: number) => {
    if (y - needed < M + 20) {
      page = doc.addPage([W, H]);
      y = H - M;
    }
  };
  const text = (t: string, opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; x?: number } = {}) => {
    const size = opts.size ?? 10;
    page.drawText(safe(t), { x: opts.x ?? M, y, size, font: opts.font ?? regular, color: opts.color ?? rgb(0.07, 0.07, 0.07) });
  };

  // Title and summary
  text("KUZANA SCEEZ", { font: bold, size: 11, color: orange });
  y -= 22;
  text("Feedback report", { font: bold, size: 22, color: green });
  y -= 18;
  text(scope, { size: 11, color: muted });
  y -= 26;
  const s = summary(rows);
  const facts = [
    [String(s.total), "pieces of feedback"],
    [s.avg ? s.avg.toFixed(1) : "-", s.rated ? `average rating (${s.rated} rated)` : "no ratings"],
    [String(s.categories.length), "categories"],
  ];
  facts.forEach(([n, l], i) => {
    const x = M + i * (width / 3);
    page.drawText(n, { x, y, size: 20, font: bold, color: green });
    page.drawText(l, { x, y: y - 14, size: 9, font: regular, color: muted });
  });
  y -= 38;
  const cats = s.categories.map(([k, v]) => `${k} ${v}`).join("   |   ");
  for (const line of wrap(`By category:  ${cats}`, regular, 9, width)) {
    text(line, { size: 9, color: muted });
    y -= 12;
  }
  y -= 8;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: rgb(0.85, 0.83, 0.78) });
  y -= 20;

  if (!rows.length) text("No feedback in this range.", { size: 11, color: muted });

  for (const f of rows) {
    const body = wrap(f.message, regular, 10, width);
    const meta = [f.category, f.rating ? `${f.rating}/5` : null, f.event?.title, who(f), FEEDBACK_STATUS_LABELS[f.status]].filter(Boolean).join("  |  ");
    const metaLines = wrap(meta, regular, 8.5, width);
    ensure(16 + metaLines.length * 11 + Math.min(body.length, 6) * 13);
    text(`${formatDay(f.createdAt)} ${formatTime(f.createdAt)}`, { font: bold, size: 9.5, color: green });
    y -= 13;
    for (const line of metaLines) {
      text(line, { size: 8.5, color: muted });
      y -= 11;
    }
    y -= 2;
    for (const line of body) {
      ensure(13);
      text(line, { size: 10 });
      y -= 13;
    }
    y -= 12;
  }

  // Page numbers
  const pages = doc.getPages();
  pages.forEach((p, i) => p.drawText(`KUZANA SCEEZ feedback  |  page ${i + 1} of ${pages.length}`, { x: M, y: 24, size: 8, font: regular, color: muted }));
  return doc.save();
}
