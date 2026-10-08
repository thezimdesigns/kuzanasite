import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const getCurrentEdition = cache(async () => {
  return (await db.edition.findFirst({ where: { isCurrent: true } })) ?? (await db.edition.findFirst({ orderBy: { year: "desc" } }));
});

export async function requireCurrentEdition() {
  const edition = await getCurrentEdition();
  if (!edition) throw new Error("No edition configured. Run the seed script.");
  return edition;
}
