import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe } from "lucide-react";
import { db } from "@/lib/db";
import { PARTICIPANT_ROLE_LABELS } from "@/lib/options";
import { formatRange, formatTimes, formatDay } from "@/lib/time";
import { Avatar } from "@/components/public/avatar";
import { ShareButtons } from "@/components/public/share-buttons";
import { Markdown } from "@/components/markdown";
import { Card, Section, SectionTitle } from "@/components/ui";

async function getPerson(slug: string) {
  return db.person.findFirst({
    where: { slug, publishStatus: "PUBLISHED" },
    include: {
      eventRoles: {
        include: { event: true },
        where: { event: { publishStatus: "PUBLISHED" } },
      },
      sessionRoles: {
        include: { session: { include: { event: true } } },
        where: {
          session: {
            publishStatus: "PUBLISHED",
            event: { publishStatus: "PUBLISHED" },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/speakers/[slug]">): Promise<Metadata> {
  const person = await getPerson((await params).slug);
  if (!person) return {};
  return {
    title: person.name,
    description: [person.jobTitle, person.organisation].filter(Boolean).join(", ") || undefined,
  };
}

export default async function SpeakerPage({ params }: PageProps<"/speakers/[slug]">) {
  const person = await getPerson((await params).slug);
  if (!person) notFound();
  const links = [
    ["Website", person.website],
    ["LinkedIn", person.linkedin],
    ["X / Twitter", person.twitter],
    ["Instagram", person.instagram],
  ].filter(([, url]) => url) as [string, string][];

  return (
    <>
      <header className="border-b border-line bg-ivory-pattern">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
          <Avatar name={person.name} photoKey={person.photoKey} size={120} />
          <div>
            <Link href="/speakers" className="text-sm font-semibold text-green-800 underline">
              Speakers
            </Link>
            <h1 className="mt-1 text-3xl font-extrabold text-green-900 sm:text-4xl">{person.name}</h1>
            <p className="mt-1 text-lg text-muted">{[person.jobTitle, person.organisation, person.country].filter(Boolean).join(" · ")}</p>
            {links.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-3 text-sm">
                {links.map(([label, url]) => (
                  <li key={label}>
                    <a href={url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-semibold text-green-800 underline">
                      <Globe className="size-3.5" /> {label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>
      <Section className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {person.bio && (
            <>
              <SectionTitle>Biography</SectionTitle>
              <Markdown>{person.bio}</Markdown>
            </>
          )}
          <div className="mt-6">
            <ShareButtons title={`${person.name} at KUZANA SCEEZ`} path={`/speakers/${person.slug}`} />
          </div>
        </div>
        {(person.eventRoles.length > 0 || person.sessionRoles.length > 0) && (
          <Card className="p-5">
            <h2 className="mb-3 font-heading text-lg font-bold text-green-900">At KUZANA</h2>
            <ul className="space-y-3 text-sm">
              {person.eventRoles.map((r) => (
                <li key={r.id}>
                  <Link href={`/events/${r.event.slug}`} className="font-semibold hover:text-green-800">
                    {r.event.title}
                  </Link>
                  <span className="block text-muted">
                    {PARTICIPANT_ROLE_LABELS[r.role]} · {formatRange(r.event.startsAt, r.event.endsAt, r.event.timeTbc)}
                  </span>
                </li>
              ))}
              {person.sessionRoles.map((r) => (
                <li key={r.id}>
                  <Link href={`/events/${r.session.event.slug}#session-${r.session.id}`} className="font-semibold hover:text-green-800">
                    {r.session.title}
                  </Link>
                  <span className="block text-muted">
                    {PARTICIPANT_ROLE_LABELS[r.role]} · {r.session.event.title} · {formatDay(r.session.startsAt)}{" "}
                    {formatTimes(r.session.startsAt, r.session.endsAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Section>
    </>
  );
}
