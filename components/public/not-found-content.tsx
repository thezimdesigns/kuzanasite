import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

const SUGGESTIONS = [
  { href: "/live", label: "What's on now", hint: "Live and starting soon" },
  {
    href: "/programme",
    label: "Full programme",
    hint: "All events, day by day",
  },
  { href: "/exhibitors", label: "Exhibitors", hint: "Directory and stands" },
  { href: "/floor-plan", label: "Floor plan", hint: "Find a stand" },
  { href: "/map", label: "Venue map", hint: "Directions to every venue" },
  { href: "/news", label: "News", hint: "Stories from the week" },
];

/** Body of the 404 page: search plus the places most people are looking for. */
export function NotFoundContent() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="grid items-end gap-6 md:grid-cols-[auto_1fr] md:gap-10">
        <p className="font-heading text-[5.5rem] leading-none font-extrabold tracking-[-0.04em] text-orange sm:text-[8rem]" aria-hidden>
          404
        </p>
        <div className="md:pb-3">
          <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-balance text-green-900 sm:text-3xl">That page isn&apos;t here</h1>
          <p className="mt-2 max-w-[48ch] text-muted">The link may be old, or the page hasn&apos;t been published yet. Search the site or pick one of these.</p>
        </div>
      </div>

      <form action="/search" className="mt-8 flex gap-2" role="search">
        <label className="relative flex-1">
          <span className="sr-only">Search KUZANA</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            name="q"
            placeholder="Events, exhibitors, speakers, news…"
            className="h-12 w-full rounded-[var(--radius-control)] border border-line bg-white pr-3 pl-11 outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/15"
          />
        </label>
        <button
          type="submit"
          className="h-12 rounded-[var(--radius-control)] bg-green-900 px-5 font-heading font-bold text-white transition-colors hover:bg-green-800 active:translate-y-px"
        >
          Search
        </button>
      </form>

      <ul className="mt-8 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {SUGGESTIONS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="group flex h-full items-center justify-between gap-3 bg-white px-4 py-3.5 transition-colors hover:bg-cream">
              <span>
                <span className="block font-heading font-bold text-green-900">{s.label}</span>
                <span className="block text-sm text-muted">{s.hint}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-orange-dark transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted">
        <Link href="/" className="font-semibold text-green-800 underline underline-offset-2">
          Back to the homepage
        </Link>
      </p>
    </div>
  );
}
