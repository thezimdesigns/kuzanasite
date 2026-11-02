"use client";

import { useOptimistic, useTransition } from "react";
import { Eye, EyeOff, FileSpreadsheet, FileText } from "lucide-react";
import { setFeedbackPublic, setFeedbackWall, updateFeedbackPublic } from "@/app/admin/actions/engagement";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Checkbox, Field, Input, Textarea, cn } from "@/components/ui";

/** On/off for the public "What people said" section across the site. */
export function FeedbackWallSwitch({ on, shown, readOnly }: { on: boolean; shown: number; readOnly?: boolean }) {
  const [pending, start] = useTransition();
  const [value, setValue] = useOptimistic(on);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={readOnly || pending}
        onClick={() =>
          start(async () => {
            setValue(!value);
            await setFeedbackWall(!value);
          })
        }
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
          value ? "bg-green-800" : "bg-line",
        )}
      >
        <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", value ? "translate-x-6" : "translate-x-1")} />
        <span className="sr-only">Show selected feedback on the website</span>
      </button>
      <div className="text-sm">
        <p className="font-semibold text-ink">{value ? "Feedback section is on the website" : "Feedback section is hidden"}</p>
        <p className="text-muted">
          {shown} piece{shown === 1 ? "" : "s"} chosen to show
          {value && shown > 0 && (
            <>
              {" · "}
              <a href="/feedback#what-people-said" target="_blank" className="font-semibold text-green-800 underline">
                View
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** Show or hide one piece of feedback on the website, straight from the list. */
export function FeedbackPublicToggle({ id, isPublic, readOnly }: { id: string; isPublic: boolean; readOnly?: boolean }) {
  const [pending, start] = useTransition();
  const [value, setValue] = useOptimistic(isPublic);
  return (
    <button
      type="button"
      disabled={readOnly || pending}
      onClick={() =>
        start(async () => {
          setValue(!value);
          await setFeedbackPublic(id, !value);
        })
      }
      title={value ? "Shown on the website. Click to keep private." : "Private. Click to show on the website."}
      aria-pressed={value}
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-badge)] px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-60",
        value ? "bg-green-100 text-green-900 hover:bg-green-200" : "text-muted hover:bg-cream-dark",
      )}
    >
      {value ? <Eye className="size-3.5" aria-hidden /> : <EyeOff className="size-3.5" aria-hidden />}
      {value ? "Public" : "Private"}
    </button>
  );
}

/** Choose a date range and download the feedback as Excel or PDF. */
export function FeedbackExport({ status }: { status?: string }) {
  return (
    <form action="/admin/feedback/export" method="get" className="flex flex-wrap items-end gap-3">
      {status && <input type="hidden" name="status" value={status} />}
      <Field label="From">
        <Input type="date" name="from" className="w-40" />
      </Field>
      <Field label="To">
        <Input type="date" name="to" className="w-40" />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" name="format" value="xlsx" size="sm" variant="outline">
          <FileSpreadsheet className="size-4" aria-hidden /> Excel
        </Button>
        <Button type="submit" name="format" value="pdf" size="sm" variant="outline">
          <FileText className="size-4" aria-hidden /> PDF
        </Button>
      </div>
    </form>
  );
}

/** On a piece of feedback: whether it shows on the website, the words shown and the name. */
export function FeedbackPublicForm({
  id,
  isPublic,
  publicText,
  publicName,
  defaultName,
  consent,
  readOnly,
}: {
  id: string;
  isPublic: boolean;
  publicText: string;
  publicName: string;
  defaultName: string;
  consent: boolean;
  readOnly?: boolean;
}) {
  return (
    <AdminForm action={updateFeedbackPublic}>
      {(state, pending) => (
        <fieldset disabled={readOnly} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <p className={cn("rounded-[var(--radius-control)] px-3 py-2 text-sm", consent ? "bg-green-100 text-green-900" : "bg-orange-50 text-orange-deeper")}>
            {consent
              ? "They agreed that KUZANA may quote this feedback."
              : "They did not tick consent to be quoted. Show it only without a name, or ask them first."}
          </p>
          <Checkbox name="isPublic" defaultChecked={isPublic} label="Show on the website" />
          <Field label="Words shown" hint="Leave as is, or trim to the best part. Leave empty to show the full message." error={state.errors?.publicText}>
            <Textarea name="publicText" rows={5} defaultValue={publicText} maxLength={1200} />
          </Field>
          <Field label="Name shown" hint={`Leave empty to show “${defaultName}”.`}>
            <Input name="publicName" defaultValue={publicName} maxLength={80} placeholder={defaultName} />
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
