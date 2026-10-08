import { formatNumber, groupTotal, type StatGroup } from "@/lib/stats";
import { CountUp } from "@/components/public/count-up";
import { cn } from "@/components/ui";

/**
 * A day's figures. A group with a total leads with the total and shows its
 * parts as a split bar; a group without one shows each figure large.
 */
export function StatsBoard({ groups, tone = "light" }: { groups: StatGroup[]; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const BAR = dark ? BAR_DARK : BAR_LIGHT;
  return (
    <div className={cn("grid gap-x-10 gap-y-10", groups.length > 1 && "md:grid-cols-2", groups.length > 2 && "lg:grid-cols-3")}>
      {groups.map((g, gi) => {
        const total = groupTotal(g);
        return (
          <section key={gi} aria-label={g.title} className={cn("border-t-2 pt-4", dark ? "border-orange-bright" : "border-orange")}>
            <h3 className={cn("text-sm font-bold tracking-[0.08em] uppercase", dark ? "text-white/70" : "text-muted")}>{g.title}</h3>
            {g.showTotal ? (
              <>
                <p className="mt-1 flex items-baseline gap-3">
                  <CountUp
                    value={total}
                    className={cn("font-heading text-6xl leading-none font-extrabold tracking-[-0.03em] tabular-nums sm:text-7xl", dark ? "text-orange-bright" : "text-green-900")}
                  />
                  <span className={cn("text-sm font-semibold", dark ? "text-white/70" : "text-muted")}>in total</span>
                </p>
                {g.items.length > 1 && total > 0 && (
                  <div className={cn("mt-5 flex h-2.5 overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-cream-dark")} aria-hidden>
                    {g.items.map((item, i) => (
                      <span key={i} className={cn("h-full", BAR[i % BAR.length])} style={{ width: `${(item.value / total) * 100}%` }} />
                    ))}
                  </div>
                )}
                {g.items.length > 1 && (
                  <ul className="mt-3 space-y-1.5">
                    {g.items.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-3 text-[0.95rem]">
                        <span className="flex items-center gap-2">
                          <span className={cn("size-2.5 rounded-full", BAR[i % BAR.length])} aria-hidden />
                          <span className={dark ? "text-white/85" : "text-ink"}>{item.label}</span>
                        </span>
                        <span className={cn("font-heading font-bold tabular-nums", dark ? "text-white" : "text-green-900")}>{formatNumber(item.value)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-4">
                {g.items.map((item, i) => (
                  <li key={i}>
                    <CountUp
                      value={item.value}
                      className={cn("block font-heading text-5xl leading-none font-extrabold tracking-[-0.03em] tabular-nums", dark ? "text-orange-bright" : "text-green-900")}
                    />
                    <span className={cn("mt-1.5 block text-sm font-semibold", dark ? "text-white/80" : "text-muted")}>{item.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

const BAR_DARK = ["bg-orange-bright", "bg-gold-light", "bg-white/75", "bg-orange-dark", "bg-green-100"];
const BAR_LIGHT = ["bg-green-900", "bg-orange", "bg-gold", "bg-green-800", "bg-orange-deeper"];
