import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { dateKey, formatLongDay, startOfDay } from "@/lib/time";
import { DayProgramme } from "@/components/public/day-programme";

export async function generateMetadata({ params }: PageProps<"/programme/[day]">): Promise<Metadata> {
  const { day } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return {};
  return { title: `Programme: ${formatLongDay(startOfDay(day))}` };
}

export default async function DayPage({ params }: PageProps<"/programme/[day]">) {
  const { day } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(startOfDay(day).getTime())) notFound();
  if (day === dateKey(new Date())) redirect("/programme/today");
  return <DayProgramme day={day} isToday={false} />;
}
