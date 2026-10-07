import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentEdition } from "@/lib/edition";
import { getDayProgramme } from "@/lib/programme";
import { dateKey, formatDay, formatLongDay, startOfDay } from "@/lib/time";
import { AutoRefresh } from "@/components/public/auto-refresh";
import { ProgrammeList } from "@/components/public/programme-list";
import { ShareButtons } from "@/components/public/share-buttons";
import { EmptyState, PageHeader, Section } from "@/components/ui";

/** Full programme for one Harare day (events and their sessions), with day navigation. */
export async function DayProgramme({ day, isToday }: { day: string; isToday: boolean }) {
  const [items, edition] = await Promise.all([getDayProgramme(day), getCurrentEdition()]);
  const date = startOfDay(day);
  const prev = dateKey(new Date(date.getTime() - 86_400_000));
  const next = dateKey(new Date(date.getTime() + 86_400_000));
  const inEdition = (k: string) => !edition || (k >= dateKey(edition.startDate) && k <= dateKey(edition.endDate));

  return (
    <>
      {isToday && <AutoRefresh seconds={60} />}
      <PageHeader eyebrow={isToday ? "Today's programme" : "Programme"} title={formatLongDay(date)}>
        <div className="flex flex-col gap-4">
          <nav className="flex flex-wrap gap-2" aria-label="Days">
            {inEdition(prev) && (
              <Link href={`/programme/${prev}`} className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold">
                <ChevronLeft className="size-4" /> {formatDay(startOfDay(prev))}
              </Link>
            )}
            {inEdition(next) && (
              <Link href={`/programme/${next}`} className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold">
                {formatDay(startOfDay(next))} <ChevronRight className="size-4" />
              </Link>
            )}
            <Link href="/programme" className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold">
              Whole week
            </Link>
          </nav>
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
