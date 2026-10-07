import type { Metadata } from "next";
import { dateKey } from "@/lib/time";
import { DayProgramme } from "@/components/public/day-programme";

export const metadata: Metadata = {
  title: "Today's programme",
  description: "What's on today at KUZANA SCEEZ: times, venues and live status.",
};

export default function TodayPage() {
  return <DayProgramme day={dateKey(new Date())} isToday />;
}
