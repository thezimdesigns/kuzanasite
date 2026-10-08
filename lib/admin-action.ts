import "server-only";
import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { z } from "zod";
import { formToObject, invalid, type FormState } from "@/lib/forms";
import { ForbiddenError, requireArea, type Area, type StaffUser } from "@/lib/permissions";

/**
 * Wraps an admin form action: enforces the role server-side, validates with
 * Zod, refreshes the page on success and turns errors into form messages.
 */
export function adminFormAction<S extends z.ZodType>(
  area: Area,
  schema: S,
  handler: (data: z.infer<S>, user: StaffUser, fd: FormData) => Promise<FormState | void>,
  opts: { arrays?: string[] } = {},
) {
  return async (_prev: FormState, fd: FormData): Promise<FormState> => {
    try {
      const user = await requireArea(area);
      const parsed = schema.safeParse(formToObject(fd, opts.arrays));
      if (!parsed.success) return invalid(parsed.error, fd);
      const result = (await handler(parsed.data, user, fd)) ?? {
        ok: true,
        message: "Saved.",
      };
      if (result.ok !== false) refresh();
      return result;
    } catch (error) {
      unstable_rethrow(error);
      return { ok: false, message: describeError(error) };
    }
  };
}

/** For simple button actions (delete, approve, ...) bound with .bind(null, id). */
export async function runAdmin<T>(area: Area, fn: (user: StaffUser) => Promise<T>) {
  const user = await requireArea(area);
  const result = await fn(user);
  refresh();
  return result;
}

function describeError(error: unknown) {
  if (error instanceof ForbiddenError) return error.message;
  const code = (error as { code?: string })?.code;
  if (code === "P2002") return "That value is already in use (for example a duplicate slug or email).";
  if (code === "P2003") return "This item is still linked to other records.";
  if (code === "P2025") return "That item no longer exists.";
  console.error(error);
  return error instanceof Error && error.message.length < 200 ? error.message : "Something went wrong. Please try again.";
}
