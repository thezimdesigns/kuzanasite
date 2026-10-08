"use client";

import { createTicket, updateTicket } from "@/app/admin/actions/programme";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Checkbox, Field, Input } from "@/components/ui";

export type TicketValues = { id: string; name: string; price: string; note: string; url: string; soldOut: boolean };

export function TicketForm({ eventId, values: v }: { eventId: string; values?: TicketValues }) {
  return (
    <AdminForm action={v ? updateTicket : createTicket} resetOnSuccess={!v}>
      {(state, pending) => (
        <div className="space-y-3">
          {v && <input type="hidden" name="id" value={v.id} />}
          <input type="hidden" name="eventId" value={eventId} />
          <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
            <Field label="Ticket type" required error={state.errors?.name}>
              <Input name="name" defaultValue={v?.name ?? ""} placeholder="e.g. General, VIP, Ringside, Student" />
            </Field>
            <Field label="Price" required error={state.errors?.price}>
              <Input name="price" defaultValue={v?.price ?? ""} placeholder="e.g. US$10" />
            </Field>
          </div>
          <Field label="Note (optional)" hint="e.g. Includes drinks, Under 12s free, Valid all 4 days">
            <Input name="note" defaultValue={v?.note ?? ""} maxLength={200} />
          </Field>
          <Field label="Buy link (optional)" hint="Leave empty to use the event's ticket link." error={state.errors?.url}>
            <Input name="url" defaultValue={v?.url ?? ""} placeholder="https://" />
          </Field>
          <Checkbox name="soldOut" defaultChecked={v?.soldOut ?? false} label="Sold out" />
          <Button type="submit" size="sm" disabled={pending}>
            {v ? "Save ticket" : "Add ticket type"}
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
