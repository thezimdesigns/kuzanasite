import "server-only";
import type { Prisma } from "@/lib/generated/prisma/client";

/** Partners of one edition: those linked to it, plus those with no years set (partners every year). */
export function partnersOfEdition(editionId: string | null | undefined): Prisma.PartnerWhereInput {
  if (!editionId) return {};
  return { OR: [{ editions: { some: { id: editionId } } }, { editions: { none: {} } }] };
}
