import Link from "next/link";
import { MapPin } from "lucide-react";
import type { ProgrammeItem } from "@/lib/programme";
import { formatTimes } from "@/lib/time";
import { cn } from "@/components/ui";
import { StatusBadge } from "@/components/public/status-badge";

export function ProgrammeList({ items }: { items: ProgrammeItem[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`}>
          <ProgrammeRow item={item} />
        </li>
      ))}
    </ol>
  );
}

export function ProgrammeRow({ item }: { item: ProgrammeItem }) {
  const done = item.status === "COMPLETED" || item.status === "CANCELLED";
  return (
    <Link
      href={item.href}
      className={cn(
        "grid grid-cols-[4.75rem_1fr] gap-3 rounded-[var(--radius-card)] border bg-white p-3.5 transition-colors hover:border-green-800 sm:grid-cols-[6.5rem_1fr] sm:p-4",
        item.status === "LIVE" ? "border-orange shadow-[inset_4px_0_0_var(--color-orange)]" : "border-line",
        done && "opacity-60",
        item.kind === "session" && "ml-3 sm:ml-6",
      )}
    >
      <div className="font-heading text-sm font-bold text-green-900">{formatTimes(item.startsAt, item.endsAt, item.timeTbc)}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={cn("font-heading font-bold", item.kind === "event" ? "text-[1.05rem]" : "text-[0.95rem]")}>{item.title}</h3>
          <StatusBadge status={item.status} hideUpcoming />
        </div>
        {item.statusNote && <p className="mt-1 text-sm font-semibold text-danger">{item.statusNote}</p>}
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
          {item.parentTitle && <span>{item.parentTitle}</span>}
          {(item.venue || item.room) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-orange" aria-hidden />
              {[item.room, item.venue].filter(Boolean).join(", ")}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
