import Link from "next/link";
import { ArrowRight, Quote, Star } from "lucide-react";
import type { PublicFeedback } from "@/lib/feedback";
import { cn } from "@/components/ui";

/**
 * "What people said": feedback staff chose to publish, as a staggered wall of
 * quotes (different lengths fall into a natural masonry).
 */
export function FeedbackWall({
  items,
  title = "What people said",
  intro,
  moreHref,
  id,
  className,
}: {
  items: PublicFeedback[];
  title?: string;
  intro?: string;
  moreHref?: string;
  id?: string;
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <section id={id} className={cn("scroll-mt-24", className)} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={id ? `${id}-title` : undefined} className="text-2xl font-extrabold text-green-900 sm:text-3xl">
            {title}
          </h2>
          {intro && <p className="mt-1 max-w-[60ch] text-muted">{intro}</p>}
        </div>
        {moreHref && (
          <Link href={moreHref} className="group inline-flex items-center gap-1 text-sm font-semibold text-green-800">
            More feedback <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        )}
      </div>
      <ul className="gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
        {items.map((f, i) => (
          <li key={f.id} className="mb-4 break-inside-avoid">
            <figure
              className={cn("rounded-[var(--radius-card)] border p-5", i % 5 === 0 ? "border-transparent bg-green-900 text-white" : "border-line bg-white")}
            >
              <Quote className={cn("size-6", i % 5 === 0 ? "text-orange-bright" : "text-orange")} aria-hidden />
              <blockquote
                className={cn(
                  "mt-2 leading-relaxed text-pretty whitespace-pre-line",
                  f.text.length < 140 ? "font-heading text-lg font-semibold" : "text-[0.98rem]",
                )}
              >
                {f.text}
              </blockquote>
              <figcaption className={cn("mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm", i % 5 === 0 ? "text-white/80" : "text-muted")}>
                <span className={cn("font-semibold", i % 5 === 0 ? "text-white" : "text-ink")}>{f.name}</span>
                {f.rating && (
                  <span className="inline-flex" aria-label={`${f.rating} out of 5`}>
                    {Array.from({ length: f.rating }, (_, n) => (
                      <Star key={n} className="size-3.5 fill-gold text-gold" aria-hidden />
                    ))}
                  </span>
                )}
                {f.context && <span className="w-full text-xs">{f.context}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
