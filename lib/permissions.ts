import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/generated/prisma/enums";

export type Area = "programme" | "announcements" | "media" | "press" | "exhibitors" | "feedback" | "qa" | "visitors" | "messages" | "site" | "users";

const ROLE_AREAS: Record<Role, Area[]> = {
  SUPER_ADMIN: ["programme", "announcements", "media", "press", "exhibitors", "feedback", "qa", "visitors", "messages", "site", "users"],
  PROGRAMME_EDITOR: ["programme", "announcements", "messages", "visitors", "qa"],
  MEDIA_EDITOR: ["media"],
  PRESS_OFFICER: ["press"],
  EXHIBITOR_MANAGER: ["exhibitors"],
  FEEDBACK_MANAGER: ["feedback", "qa"],
  QA_MODERATOR: ["qa"],
  VIEWER: [],
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  PROGRAMME_EDITOR: "Programme editor",
  MEDIA_EDITOR: "Media editor",
  PRESS_OFFICER: "Press officer",
  EXHIBITOR_MANAGER: "Exhibitor manager",
  FEEDBACK_MANAGER: "Feedback manager",
  QA_MODERATOR: "Conference Q&A moderator",
  VIEWER: "Viewer (read only)",
};

export type StaffUser = { id: string; name: string; email: string; role: Role };

export class ForbiddenError extends Error {
  constructor() {
    super("You do not have permission to do that.");
  }
}

export function can(user: Pick<StaffUser, "role"> | null, area: Area) {
  return !!user && (ROLE_AREAS[user.role]?.includes(area) ?? false);
}

export async function getStaff(): Promise<StaffUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user as (StaffUser & { active?: boolean }) | undefined;
  if (!user || user.active === false) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/**
 * For admin pages: any signed-in staff member may view. Conference Q&A
 * moderators only ever see the Q&A pages (which pass moderatorOk).
 */
export async function requireStaff(opts: { moderatorOk?: boolean } = {}) {
  const user = await getStaff();
  if (!user) redirect("/admin/login");
  if (user.role === "QA_MODERATOR" && !opts.moderatorOk) redirect("/admin/qa");
  return user;
}

/** For server actions and write paths: enforces the role server-side. */
export async function requireArea(area: Area) {
  const user = await getStaff();
  if (!user) redirect("/admin/login");
  if (!can(user, area)) throw new ForbiddenError();
  return user;
}

/** For admin pages that need an area: sends staff without it back to the dashboard. */
export async function requireAreaPage(area: Area) {
  const user = await requireStaff();
  if (!can(user, area)) redirect("/admin?denied=1");
  return user;
}
