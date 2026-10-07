import "server-only";
import { createHash, randomInt } from "node:crypto";
import { db } from "@/lib/db";

// No 0/O/1/I to keep codes easy to read out over the phone.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const hash = (code: string) => createHash("sha256").update(code.trim().toUpperCase()).digest("hex");

/** Creates a completion code for an exhibitor. Only the hash is stored. */
export async function createClaimToken(exhibitorId: string, createdById: string, days = 14) {
  const code = Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  await db.exhibitorClaimToken.create({
    data: {
      exhibitorId,
      createdById,
      tokenHash: hash(code),
      expiresAt: new Date(Date.now() + days * 86_400_000),
    },
  });
  return code;
}

/** Returns the token record (with exhibitor) if the code is valid, unexpired and not revoked. */
export async function findValidClaim(code: string | null | undefined) {
  if (!code || code.length > 40) return null;
  const token = await db.exhibitorClaimToken.findUnique({
    where: { tokenHash: hash(code) },
    include: { exhibitor: { include: { category: true, media: { orderBy: { sortOrder: "asc" } } } } },
  });
  if (!token || token.revokedAt || token.expiresAt < new Date()) return null;
  return token;
}
