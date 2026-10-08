import Link from "next/link";
import { getCurrentEdition } from "@/lib/edition";
import { dateKey, startOfDay, TIME_ZONE } from "@/lib/time";
import { cn } from "@/components/ui";

const weekday = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  weekday: "short",
});
const dayOfMonth = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "numeric",
});

/** The days of the current edition as a jump bar. `selected` is a YYYY-MM-DD key. */
export async function WeekStrip({ selected, className }: { selected?: string; className?: string }) {
  const edition = await getCurrentEdition();
  if (!edition) return null;
  const today = dateKey(new Date());
  const days: string[] = [];
  for (let d = startOfDay(dateKey(edition.startDate)); dateKey(d) <= dateKey(edition.endDate); d = new Date(d.getTime() + 86_400_000)) {
    days.push(dateKey(d));
  }

  return (
    <nav aria-label="Event days" className={cn("rail -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0", className)}>
      {days.map((key) => {
        const date = startOfDay(key);
        const isToday = key === today;
        const isSelected = key === selected;
        return (
          <Link
            key={key}
            href={isToday ? "/programme/today" : `/programme/${key}`}
            aria-current={isSelected ? "date" : undefined}
            className={cn(
              "group flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-[var(--radius-control)] border px-3 py-2 font-heading transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-out-expo)] active:scale-[0.97] sm:min-w-[5.5rem]",
              isSelected ? "border-green-900 bg-green-900 text-white" : "border-line bg-white text-ink hover:border-green-800/60",
            )}
          >
            <span className={cn("text-xs font-semibold", isSelected ? "text-white/75" : "text-muted")}>{isToday ? "Today" : weekday.format(date)}</span>
            <span className="text-2xl leading-none font-extrabold tabular-nums">{dayOfMonth.format(date)}</span>
            <span className={cn("mt-1 h-0.5 w-5 rounded-full transition-colors", isToday ? "bg-orange" : "bg-transparent group-hover:bg-line")} aria-hidden />
          </Link>
        );
      })}
      <Link
        href="/programme"
        className="flex shrink-0 items-center rounded-[var(--radius-control)] border border-dashed border-line px-4 font-heading text-sm font-semibold text-green-900 transition-colors hover:border-green-800/60 hover:bg-white"
      >
        Whole week
      </Link>
    </nav>
  );
}
