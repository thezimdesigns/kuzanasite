import { db } from "@/lib/db";

/** RFC 8058 one-click unsubscribe (List-Unsubscribe-Post). */
export async function POST(_: Request, ctx: RouteContext<"/api/unsubscribe/[token]">) {
  const { token } = await ctx.params;
  await db.visitor.updateMany({ where: { unsubscribeToken: token }, data: { emailConsent: false } });
  return new Response(null, { status: 204 });
}
