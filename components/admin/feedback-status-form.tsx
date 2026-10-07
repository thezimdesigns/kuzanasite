"use client";

import { updateFeedback } from "@/app/admin/actions/engagement";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Field, Select, Textarea } from "@/components/ui";
import { FEEDBACK_STATUS_LABELS } from "@/lib/options";

export function FeedbackStatusForm({ id, status, notes, readOnly }: { id: string; status: string; notes: string; readOnly: boolean }) {
  return (
    <AdminForm action={updateFeedback}>
      {(_, pending) => (
        <fieldset disabled={readOnly} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <Field label="Status">
            <Select name="status" defaultValue={status}>
              {Object.entries(FEEDBACK_STATUS_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Internal notes" hint="Who is handling it, what was done.">
            <Textarea name="adminNotes" rows={5} defaultValue={notes} />
          </Field>
          {!readOnly && (
            <Button type="submit" disabled={pending}>
              Save
            </Button>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}
