import "server-only";
import { headers } from "next/headers";

export async function clientIp() {
  const h = await headers();
  const raw = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "";
  return raw.split(",")[0].trim() || "unknown";
}
