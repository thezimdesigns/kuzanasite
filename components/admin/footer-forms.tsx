"use client";

import { useState } from "react";
import { createFooterLink, saveFooterSettings, updateFooterLink } from "@/app/admin/actions/site";
import { AdminForm } from "@/components/admin/admin-form";
import { Button, Checkbox, Field, Input, Select } from "@/components/ui";

export type LinkGroups = { group: string; options: { href: string; label: string }[] }[];

const SETTING_FIELDS: [string, string, string?][] = [
  ["tagline", "Tagline"],
  ["location", "Location"],
  ["email", "Contact email"],
  ["phone", "Contact phone", "Optional"],
  ["facebook", "Facebook URL"],
  ["instagram", "Instagram URL"],
  ["linkedin", "LinkedIn URL"],
  ["youtube", "YouTube URL"],
  ["x", "X (Twitter) URL"],
  ["col1Title", "First link column heading"],
  ["col2Title", "Second link column heading"],
];

export function FooterSettingsForm({ values, readOnly }: { values: Record<string, string>; readOnly: boolean }) {
  return (
    <AdminForm action={saveFooterSettings}>
      {(_, pending) => (
        <fieldset disabled={readOnly} className="grid gap-3 sm:grid-cols-2">
          {SETTING_FIELDS.map(([key, label, hint]) => (
            <Field key={key} label={label} hint={hint ?? (key.length > 8 ? undefined : "Leave empty to hide")} className={key === "tagline" ? "sm:col-span-2" : undefined}>
              <Input name={key} defaultValue={values[`footer.${key}`] ?? ""} />
            </Field>
          ))}
          {!readOnly && (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save footer details"}
              </Button>
            </div>
          )}
        </fieldset>
      )}
    </AdminForm>
  );
}

/** Add or edit a footer link: pick a page on the site, or enter any web address. */
export function FooterLinkForm({
  groups,
  columns,
  link,
}: {
  groups: LinkGroups;
  columns: [string, string];
  link?: { id: string; label: string; href: string; column: number; newTab: boolean; sortOrder: number };
}) {
  const known = groups.some((g) => g.options.some((o) => o.href === link?.href));
  const [page, setPage] = useState(link ? (known ? link.href : "__custom") : "");

  return (
    <AdminForm action={link ? updateFooterLink : createFooterLink} resetOnSuccess={!link}>
      {(state, pending) => (
        <div className="grid gap-3 sm:grid-cols-2">
          {link && <input type="hidden" name="id" value={link.id} />}
          {link && <input type="hidden" name="sortOrder" value={link.sortOrder} />}
          <Field label="Links to" required className="sm:col-span-2">
            <Select
              name="page"
              value={page}
              onChange={(e) => {
                setPage(e.target.value);
                const label = e.currentTarget.form?.elements.namedItem("label") as HTMLInputElement | null;
                const chosen = groups.flatMap((g) => g.options).find((o) => o.href === e.target.value);
                if (label && chosen && !label.value) label.value = chosen.label;
              }}
            >
              <option value="" disabled>
                Choose a page…
              </option>
              <option value="__custom">Custom link (any web address)</option>
              {groups.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map((o) => (
                    <option key={o.href} value={o.href}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          {page === "__custom" && (
            <Field label="Web address" required error={state.errors?.custom} hint="e.g. https://www.zitf.co.zw, mailto:… or tel:…" className="sm:col-span-2">
              <Input name="custom" defaultValue={known ? "" : (link?.href ?? "")} placeholder="https://" />
            </Field>
          )}
          <Field label="Label" required error={state.errors?.label}>
            <Input name="label" defaultValue={link?.label ?? ""} />
          </Field>
          <Field label="Column">
            <Select name="column" defaultValue={String(link?.column ?? 1)}>
              <option value="1">{columns[0]}</option>
              <option value="2">{columns[1]}</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Checkbox name="newTab" defaultChecked={link?.newTab ?? page === "__custom"} label="Open in a new tab" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={pending}>
              {link ? "Save link" : "Add link"}
            </Button>
          </div>
        </div>
      )}
    </AdminForm>
  );
}
