import { z } from "zod";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Echo of submitted values so fields survive a failed submission. */
  values?: Record<string, string>;
  /** Optional id of something created, e.g. for redirects. */
  id?: string;
};

export const initialFormState: FormState = {};

/** Optional trimmed string: empty becomes undefined. */
export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const requiredText = (label: string, max = 200) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max);

export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : undefined))
  .pipe(z.url("Enter a valid web address.").optional());

export const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? v.toLowerCase() : undefined))
  .pipe(z.email("Enter a valid email address.").optional());

export const phone = z
  .string({ error: "Phone number is required." })
  .trim()
  .min(7, "Enter a valid phone number.")
  .max(30)
  .regex(/^[+\d][\d\s()-]+$/, "Enter a valid phone number.");

/** An HTML checkbox: absent from FormData when unchecked, so the key must be optional. */
export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("1"), z.literal("")])
  .optional()
  .nullable()
  .transform((v) => v === "on" || v === "true" || v === "1");

/** Converts FormData into a plain object; repeated keys become arrays. */
export function formToObject(fd: FormData, arrays: string[] = []) {
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const all = fd.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = arrays.includes(key) ? all : all[0];
  }
  return out;
}

export function stringValues(fd: FormData) {
  const values: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$ACTION")) values[k] = v;
  return values;
}

export function zodErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export function invalid(error: z.ZodError, fd: FormData): FormState {
  return {
    ok: false,
    message: "Please check the highlighted fields.",
    errors: zodErrors(error),
    values: stringValues(fd),
  };
}
