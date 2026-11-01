import { getPortal } from "@/lib/edition";

/** kuzana.org.zw/portal: a short, sayable link to the exhibitor and sponsor portal. */
export async function GET() {
  const { url } = await getPortal();
  return Response.redirect(url, 302);
}
