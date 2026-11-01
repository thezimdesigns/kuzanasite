import { getSiteState } from "@/lib/edition";
import { siteUrl } from "@/lib/site";
import { dateKey } from "@/lib/time";

/** All-day calendar entry for the next edition ("Save the date"). */
export async function GET() {
  const { next, current } = await getSiteState();
  const e = next ?? current;
  if (!e) return new Response("Not found", { status: 404 });
  const ymd = (d: Date) => dateKey(d).replace(/-/g, "");
  // DTEND is exclusive for all-day events: the day after the last day.
  const end = new Date(e.endDate.getTime() + 86_400_000);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KUZANA SCEEZ//Save the date//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:kuzana-sceez-${e.year}@kuzana.org.zw`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(e.startDate)}`,
    `DTEND;VALUE=DATE:${ymd(end)}`,
    `SUMMARY:${e.name}`,
    `DESCRIPTION:Sport & Creative Economy Expo of Zimbabwe. ${siteUrl("/take-part")}`,
    "LOCATION:Bulawayo\\, Zimbabwe",
    `URL:${siteUrl("/")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="kuzana-sceez-${e.year}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
