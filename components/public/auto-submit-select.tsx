"use client";

import type { ComponentProps } from "react";
import { Select } from "@/components/ui";

/** A filter dropdown that applies as soon as it changes (the form still works without JavaScript). */
export function AutoSubmitSelect(props: ComponentProps<typeof Select>) {
  return <Select {...props} onChange={(e) => e.currentTarget.form?.requestSubmit()} />;
}
