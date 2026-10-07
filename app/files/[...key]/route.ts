import { getObject } from "@/lib/storage";

/**
 * Serves stored objects. Keys contain a random UUID and never change, so
 * responses are cached for a year by browsers and Cloudflare.
 */
export async function GET(request: Request, ctx: RouteContext<"/files/[...key]">) {
  const { key } = await ctx.params;
  const objectKey = key.join("/");
  if (!/^(public|staff)\/[\w/.-]+$/.test(objectKey) || objectKey.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  const object = await getObject(objectKey);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "Content-Type": object.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  if (object.size) headers.set("Content-Length", String(object.size));

  const name = new URL(request.url).searchParams.get("name");
  if (name) {
    const safe = name.replace(/[^\w .()-]/g, "_").slice(0, 150);
    headers.set("Content-Disposition", `attachment; filename="${safe}"`);
  } else if (!object.contentType.startsWith("image/")) {
    headers.set("Content-Disposition", "inline");
  }
  return new Response(object.body, { headers });
}
