"use client";

import { createFloorPlan, updateFloorPlan } from "@/app/admin/actions/exhibitors";
import { AdminForm } from "@/components/admin/admin-form";
import { UploadField } from "@/components/admin/upload-field";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

export type FloorPlanValues = {
  id?: string;
  title: string;
  venueId: string;
  description: string;
  imageKey: string;
  pdfKey: string;
  publishStatus: string;
  sortOrder: number;
};

export function FloorPlanForm({ values: v, venues }: { values: FloorPlanValues; venues: { id: string; name: string }[] }) {
  return (
    <AdminForm action={v.id ? updateFloorPlan : createFloorPlan}>
      {(state, pending) => (
        <div className="space-y-3">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Field label="Title" required error={state.errors?.title}>
            <Input name="title" defaultValue={v.title} placeholder="e.g. Hall 4 exhibition stands" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem_6rem]">
            <Field label="Venue">
              <Select name="venueId" defaultValue={v.venueId}>
                <option value="">None</option>
                {venues.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select name="publishStatus" defaultValue={v.publishStatus}>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </Select>
            </Field>
            <Field label="Order">
              <Input name="sortOrder" type="number" defaultValue={v.sortOrder} />
            </Field>
          </div>
          <Field label="Note for visitors">
            <Textarea name="description" rows={2} defaultValue={v.description} placeholder="Entrances, toilets, first aid…" />
          </Field>
          <Field
            label="Plan image"
            required
            error={state.errors?.imageKey}
            hint="Export the plan as a large PNG or JPG (at least 2500 px wide) so stand numbers stay sharp when zoomed. Not a PDF."
          >
            <UploadField name="imageKey" label="Upload plan image" current={v.imageKey || null} folder="floor-plans" maxDim={4000} />
          </Field>
          <Field label="Printable PDF (optional)">
            <UploadField name="pdfKey" label="Upload PDF" accept="document" current={v.pdfKey || null} currentName="Current PDF" folder="floor-plans" />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : v.id ? "Save" : "Create floor plan"}
          </Button>
        </div>
      )}
    </AdminForm>
  );
}
