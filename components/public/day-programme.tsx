import { getDayProgramme } from "@/lib/programme";
import { formatLongDay, startOfDay } from "@/lib/time";
import { AutoRefresh } from "@/components/public/auto-refresh";
import { ProgrammeList } from "@/components/public/programme-list";
import { ShareButtons } from "@/components/public/share-buttons";
import { WeekStrip } from "@/components/public/week-strip";
import { EmptyState, PageHeader, Section } from "@/components/ui";

/** Full programme for one Harare day (events and their sessions), with day navigation. */
export async function DayProgramme({ day, isToday }: { day: string; isToday: boolean }) {
  const items = await getDayProgramme(day);
  const date = startOfDay(day);

  return (
    <>
      {isToday && <AutoRefresh seconds={60} />}
      <PageHeader
        back={{ href: "/programme", label: "Programme" }}
        title={isToday ? "Today at KUZANA" : formatLongDay(date)}
        intro={isToday ? `${formatLongDay(date)}. Times are Bulawayo time and update live.` : "Times are Bulawayo time."}
      >
        <div className="flex flex-col gap-5">
          <WeekStrip selected={day} />
          <ShareButtons
            title={isToday ? "What's on today at KUZANA SCEEZ" : `KUZANA SCEEZ programme: ${formatLongDay(date)}`}
            path={isToday ? "/programme/today" : `/programme/${day}`}
          />
        </div>
      </PageHeader>
      <Section>
        {items.length ? <ProgrammeList items={items} /> : <EmptyState>There are no programme items on this day.</EmptyState>}
      </Section>
    </>
  );
}
