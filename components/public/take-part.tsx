"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Camera,
  Handshake,
  HeartHandshake,
  Medal,
  Mic2,
  Palette,
  Sparkles,
  Store,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import { InterestForm } from "@/components/public/interest-form";
import { cn } from "@/components/ui";

type Role = { interest: string; title: string; line: string; icon: LucideIcon; portal?: boolean };

/** Ways to take part. Exhibitors and sponsors apply through the KUZANA Portal; everyone else registers interest here. */
const ROLES: Role[] = [
  {
    interest: "Exhibitor",
    title: "Exhibit",
    line: "Show your products and services to buyers, investors and visitors in the halls.",
    icon: Store,
    portal: true,
  },
  { interest: "Sponsor", title: "Sponsor", line: "Put your brand at the centre of Zimbabwe's sport and creative economy.", icon: Sparkles, portal: true },
  { interest: "Speaker", title: "Speak", line: "Bring your expertise to the conference stages and panels.", icon: Mic2 },
  { interest: "Artist", title: "Perform or show", line: "Musicians, dancers, poets, film makers and visual artists.", icon: Palette },
  { interest: "Athlete", title: "Compete", line: "Athletes, clubs and federations: matches, races, clinics and showcases.", icon: Medal },
  { interest: "Investor", title: "Invest", line: "Meet sport and creative enterprises that are ready to grow.", icon: Briefcase },
  { interest: "Partner", title: "Partner", line: "Co-create a programme, venue, campaign or community activation.", icon: Handshake },
  { interest: "Media", title: "Cover it", line: "Press, broadcasters and creators covering KUZANA and its people.", icon: Camera },
  { interest: "Supplier", title: "Supply", line: "Services for the expo and its participants, from staging to catering.", icon: Truck },
  { interest: "Volunteer", title: "Volunteer", line: "Join the team that makes the week happen.", icon: HeartHandshake },
];

export function TakePartGrid({ portal, year, tone = "light" }: { portal: { url: string; open: boolean }; year: number | null; tone?: "light" | "dark" }) {
  const [picked, setPicked] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const dark = tone === "dark";

  useEffect(() => {
    if (!picked || !formRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    formRef.current.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    formRef.current.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true });
  }, [picked]);

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ROLES.map((r) => {
          const Icon = r.icon;
          const active = picked === r.interest;
          const viaPortal = r.portal && portal.open;
          const cardClass = cn(
            "group relative flex h-full w-full flex-col rounded-[var(--radius-card)] border p-4 text-left transition-[background-color,border-color,transform] duration-200 active:scale-[0.98]",
            dark
              ? active
                ? "border-orange-bright bg-orange-bright text-green-950"
                : "border-white/20 bg-white/5 text-white hover:border-white/60 hover:bg-white/10"
              : active
                ? "border-green-900 bg-green-900 text-white"
                : "border-line bg-white text-ink hover:border-green-800/60",
          );
          const body = (
            <>
              <Icon className={cn("size-6", active ? "" : dark ? "text-orange-bright" : "text-orange-dark")} aria-hidden />
              <span className="mt-3 font-heading text-lg leading-tight font-bold">{r.title}</span>
              <span className={cn("mt-1 text-sm text-pretty", active ? "opacity-90" : dark ? "text-white/70" : "text-muted")}>{r.line}</span>
              <span
                className={cn(
                  "mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold",
                  active ? "" : dark ? "text-orange-bright" : "text-green-800",
                )}
              >
                {viaPortal ? (
                  <>
                    Apply on the portal <ArrowUpRight className="size-4" aria-hidden />
                  </>
                ) : (
                  <>
                    {active ? "Fill in below" : "Register interest"}{" "}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </>
                )}
              </span>
            </>
          );
          return (
            <li key={r.interest}>
              {viaPortal ? (
                <a href={portal.url} target="_blank" rel="noopener" className={cardClass}>
                  {body}
                </a>
              ) : (
                <button type="button" aria-pressed={active} onClick={() => setPicked(active ? null : r.interest)} className={cardClass}>
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {picked && (
        <div
          ref={formRef}
          className="mt-5 animate-[fade-up_0.35s_var(--ease-out-expo)_both] rounded-[var(--radius-card)] border border-line bg-white p-5 text-ink motion-reduce:animate-none sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-heading text-xl font-bold text-green-900">
                Register interest: {ROLES.find((r) => r.interest === picked)?.title}
                {year ? ` at KUZANA SCEEZ ${year}` : ""}
              </h3>
              {ROLES.find((r) => r.interest === picked)?.portal && !portal.open && (
                <p className="mt-1 text-sm text-muted">
                  Applications open on the{" "}
                  <a href={portal.url} target="_blank" rel="noopener" className="font-semibold text-green-800 underline">
                    KUZANA Portal
                  </a>
                  . Register interest now and we&apos;ll tell you the day they open. Returning applicants can already log in there.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPicked(null)}
              aria-label="Close"
              className="rounded-[var(--radius-control)] p-1.5 text-muted hover:bg-cream"
            >
              <X className="size-5" />
            </button>
          </div>
          <InterestForm interest={picked} />
        </div>
      )}
    </div>
  );
}
