"use client";

import { createVenue, updateVenue } from "@/app/admin/actions/programme";
import { AdminForm } from "@/components/admin/admin-form";
import { Panel } from "@/components/admin/ui";
import { GoogleLocationField } from "@/components/admin/google-location-field";
import { UploadField } from "@/components/admin/upload-field";
import { Button, Field, Input, Textarea } from "@/components/ui";

export type VenueValues = Record<
  | "name"
  | "slug"
  | "description"
  | "address"
  | "latitude"
  | "longitude"
  | "mapUrl"
  | "directions"
  | "parking"
  | "accessibility"
  | "openingTimes"
  | "contact"
  | "imageKey",
  string
> & { id?: string; sortOrder: number };

export function VenueForm({ values: v, readOnly = false }: { values: VenueValues; readOnly?: boolean }) {
  return (
    <AdminForm action={v.id ? updateVenue : createVenue}>
      {(state, pending) => (
        <fieldset disabled={readOnly} className="space-y-6">
          {v.id && <input type="hidden" name="id" value={v.id} />}
          <Panel>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required error={state.errors?.name}>
                <Input name="name" defaultValue={v.name} />
              </Field>
              <Field label="Address">
                <Input name="address" defaultValue={v.address} />
              </Field>
              <div className="sm:col-span-2">
                <GoogleLocationField current={v.latitude && v.longitude ? `${v.latitude}, ${v.longitude}` : ""} />
              </div>
              <details className="sm:col-span-2">
                <summary className="cursor-pointer text-sm font-semibold text-green-800">Enter coordinates by hand</summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <Field label="Latitude">
                    <Input name="latitude" inputMode="decimal" defaultValue={v.latitude} />
                  </Field>
                  <Field label="Longitude">
                    <Input name="longitude" inputMode="decimal" defaultValue={v.longitude} />
                  </Field>
                  <Field label="Map link" error={state.errors?.mapUrl}>
                    <Input name="mapUrl" defaultValue={v.mapUrl} />
                  </Field>
                </div>
              </details>
            </div>
            <div className="mt-4 space-y-4">
              <Field label="Description" hint="Markdown supported.">
                <Textarea name="description" rows={4} defaultValue={v.description} />
              </Field>
              <Field label="Directions" hint="Markdown supported.">
                <Textarea name="directions" rows={4} defaultValue={v.directions} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Parking">
                  <Textarea name="parking" rows={2} defaultValue={v.parking} />
                </Field>
                <Field label="Accessibility">
                  <Textarea name="accessibility" rows={2} defaultValue={v.accessibility} />
                </Field>
                <Field label="Opening times">
                  <Textarea name="openingTimes" rows={2} defaultValue={v.openingTimes} />
                </Field>
                <Field label="Contact">
                  <Textarea name="contact" rows={2} defaultValue={v.contact} />
                </Field>
              </div>
              <UploadField name="imageKey" label="Venue image" current={v.imageKey} folder="venues" maxDim={2000} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="URL slug">
                  <Input name="slug" defaultValue={v.slug} />
                </Field>
                <Field label="Sort order">
                  <Input type="number" name="sortOrder" defaultValue={v.sortOrder} />
                </Field>
              </div>
            </div>
          </Panel>
          {!readOnly && (
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : v.id ? "Save venue" : "Create venue"}
            </Button>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}
