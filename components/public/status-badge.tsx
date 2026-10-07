import type { ProgrammeStatus } from "@/lib/generated/prisma/enums";
import { STATUS_LABELS } from "@/lib/time";
import { Badge } from "@/components/ui";

const TONES = {
  UPCOMING: "neutral",
  STARTING_SOON: "gold",
  LIVE: "orange",
  COMPLETED: "neutral",
  POSTPONED: "red",
  CANCELLED: "red",
  VENUE_CHANGED: "red",
} as const;

export function StatusBadge({ status, hideUpcoming = false }: { status: ProgrammeStatus; hideUpcoming?: boolean }) {
  if (hideUpcoming && status === "UPCOMING") return null;
  return (
    <Badge tone={TONES[status]}>
      {status === "LIVE" && <span className="live-dot size-1.5 rounded-full bg-orange" aria-hidden />}
      {STATUS_LABELS[status]}
    </Badge>
  );
}
