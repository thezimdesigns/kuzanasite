import { ArrowDown, ArrowUp } from "lucide-react";
import { db } from "@/lib/db";
import { deleteTicket, moveTicket, toggleTicketSoldOut } from "@/app/admin/actions/programme";
import { ActionButton } from "@/components/admin/admin-form";
import { TicketForm } from "@/components/admin/ticket-form";
import { Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

/** Ticket types and prices for an event. */
export async function TicketsPanel({ eventId, editable }: { eventId: string; editable: boolean }) {
  const tickets = await db.eventTicket.findMany({ where: { eventId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return (
    <Panel title={`Tickets${tickets.length ? ` (${tickets.length})` : ""}`}>
      {tickets.length > 0 ? (
        <ul className="mb-4 divide-y divide-line">
          {tickets.map((t, i) => (
            <li key={t.id} className="py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">
                  {t.name} {t.soldOut && <Badge tone="orange">sold out</Badge>}
                </span>
                <span className="font-heading font-bold text-green-900 tabular-nums">{t.price}</span>
              </div>
              {t.note && <p className="text-xs text-muted">{t.note}</p>}
              {editable && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <ActionButton action={toggleTicketSoldOut.bind(null, t.id)} variant="ghost">
                    {t.soldOut ? "Back on sale" : "Mark sold out"}
                  </ActionButton>
                  {i > 0 && (
                    <ActionButton action={moveTicket.bind(null, t.id, -1)} variant="ghost">
                      <ArrowUp className="size-4" aria-label="Move up" />
                    </ActionButton>
                  )}
                  {i < tickets.length - 1 && (
                    <ActionButton action={moveTicket.bind(null, t.id, 1)} variant="ghost">
                      <ArrowDown className="size-4" aria-label="Move down" />
                    </ActionButton>
                  )}
                  <ActionButton action={deleteTicket.bind(null, t.id)} variant="ghost" confirm={`Remove the ${t.name} ticket?`}>
                    Remove
                  </ActionButton>
                  <details className="w-full">
                    <summary className="cursor-pointer text-sm font-semibold text-green-800">Edit</summary>
                    <div className="mt-2">
                      <TicketForm eventId={eventId} values={{ id: t.id, name: t.name, price: t.price, note: t.note ?? "", url: t.url ?? "", soldOut: t.soldOut }} />
                    </div>
                  </details>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-sm text-muted">No ticket types yet. Add one per price, e.g. General, VIP and Ringside.</p>
      )}
      {editable && <TicketForm eventId={eventId} />}
    </Panel>
  );
}
