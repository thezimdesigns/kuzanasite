"use client";

import { useState, useTransition } from "react";
import { createDailyReport } from "@/app/admin/actions/content";
import { Button, Field, Input } from "@/components/ui";

/** Starts (or opens) the report for a day; groups and labels carry over from the latest day. */
export function NewDayReport({ today }: { today: string }) {
  const [day, setDay] = useState(today);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field label="Day">
        <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
      </Field>
      <Button type="button" disabled={pending || !day} onClick={() => start(() => createDailyReport(day))}>
        {pending ? "Opening…" : "Enter figures"}
      </Button>
    </div>
  );
}
