import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const NAV_HIDDEN_KEY = "nav.hidden";

/** Addresses of the menu links an admin has switched off. */
export const getHiddenNav = cache(async (): Promise<string[]> => {
  const row = await db.siteSetting.findUnique({ where: { key: NAV_HIDDEN_KEY } }).catch(() => null);
  try {
    const value = JSON.parse(row?.value ?? "[]");
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
});
