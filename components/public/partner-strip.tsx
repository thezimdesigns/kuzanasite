import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PartnerTier } from "@/lib/generated/prisma/enums";
import { fileUrl } from "@/lib/files";
import { cn } from "@/components/ui";

type Partner = {
  id: string;
  name: string;
  logoUrl: string | null;
  logoKey: string | null;
  url: string | null;
  caption: string | null;
  tier: PartnerTier;
};

/** The three founding roles, in this order, on their own row. */
const LEAD_ORDER: PartnerTier[] = ["CONVENOR", "TECHNICAL_PARTNER", "HOST"];

/**
 * Partner logos. The convenor, technical partner and host share one row at a
 * larger size; every other partner moves past in a single slow row below
 * (paused on hover or focus; a swipeable row with reduced motion), with a link
 * to the partners page for the full list.
 */
export function PartnerStrip({ partners, allHref = "/partners" }: { partners: Partner[]; allHref?: string }) {
  const lead = LEAD_ORDER.flatMap((t) => partners.filter((p) => p.tier === t));
  const rest = partners.filter((p) => !LEAD_ORDER.includes(p.tier));
  // The row only scrolls when there are enough logos to need it.
  const moving = rest.length > 4;

  return (
    <div className="flex flex-col items-center gap-10">
      {lead.length > 0 && (
        <ul className="grid w-full max-w-3xl grid-cols-3 items-end gap-4 sm:gap-10">
          {lead.map((p) => (
            <PartnerLogo key={p.id} partner={p} className="mx-auto h-20 w-full max-w-[11rem] sm:h-28" sizes="(min-width: 640px) 176px, 30vw" caption />
          ))}
        </ul>
      )}

      {rest.length > 0 && (
        <div className="w-full">
          {moving ? (
            <div className="partner-marquee group relative overflow-hidden">
              {/* Soft edges so logos fade in and out rather than being cut off. */}
              <div className="partner-marquee-track flex w-max">
                {[0, 1].map((copy) => (
                  <ul key={copy} className="flex shrink-0 items-center gap-12 pr-12 sm:gap-16 sm:pr-16" aria-hidden={copy === 1 || undefined}>
                    {rest.map((p) => (
                      <PartnerLogo key={p.id} partner={p} className="h-16 w-36 sm:h-20 sm:w-44" sizes="176px" hidden={copy === 1} />
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          ) : (
            <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
              {rest.map((p) => (
                <PartnerLogo key={p.id} partner={p} className="h-16 w-36 sm:h-20 sm:w-44" sizes="176px" />
              ))}
            </ul>
          )}
          <p className="mt-6 text-center">
            <Link href={allHref} className="group inline-flex items-center gap-1 text-sm font-semibold text-green-800 hover:underline">
              View all {partners.length} partners <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

function PartnerLogo({
  partner: p,
  className,
  sizes,
  caption = false,
  hidden = false,
}: {
  partner: Partner;
  className: string;
  sizes: string;
  caption?: boolean;
  /** The duplicate copy in the moving row: invisible to screen readers and keyboards. */
  hidden?: boolean;
}) {
  const logo = p.logoUrl ?? fileUrl(p.logoKey);
  const mark = logo ? (
    <span className={cn("relative block", className)}>
      <Image src={logo} alt={hidden ? "" : p.name} fill sizes={sizes} className="object-contain" />
    </span>
  ) : (
    <span className={cn("flex items-center justify-center text-center font-heading font-bold", className)}>{p.name}</span>
  );
  return (
    <li className="flex shrink-0 flex-col items-center gap-2">
      {p.url ? (
        <a
          href={p.url}
          target="_blank"
          rel="noopener"
          tabIndex={hidden ? -1 : undefined}
          className="block w-full transition-opacity hover:opacity-80"
          title={p.name}
        >
          {mark}
        </a>
      ) : (
        mark
      )}
      {caption && <span className="text-xs font-semibold text-muted">{p.caption ?? p.name}</span>}
    </li>
  );
}
