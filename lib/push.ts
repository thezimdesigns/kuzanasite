import "server-only";
import webpush from "web-push";
import { db } from "@/lib/db";

let configured = false;
export function pushConfigured() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:technical-partner@kuzana.org.zw", pub, priv);
  configured = true;
  return true;
}

export type PushPayload = { title: string; body: string; url?: string | null };

/**
 * Sends to the given subscriptions. Subscriptions that the push service reports
 * as gone (404/410) are deactivated; others are deactivated after 5 failures.
 */
export async function sendPush(subscriptionIds: string[], payload: PushPayload) {
  if (!pushConfigured() || subscriptionIds.length === 0) return { sent: 0, failed: 0 };
  const subs = await db.pushSubscription.findMany({
    where: { id: { in: subscriptionIds }, active: true },
  });
  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < subs.length; i += 50) {
    await Promise.all(
      subs.slice(i, i + 50).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
            { TTL: 60 * 60 * 6 },
          );
          sent++;
          await db.pushSubscription.update({
            where: { id: s.id },
            data: { lastSuccessfulSendAt: new Date(), failureCount: 0 },
          });
        } catch (error) {
          failed++;
          const status = (error as { statusCode?: number }).statusCode;
          const gone = status === 404 || status === 410;
          await db.pushSubscription.update({
            where: { id: s.id },
            data: {
              failureCount: { increment: 1 },
              active: gone || s.failureCount + 1 >= 5 ? false : undefined,
            },
          });
        }
      }),
    );
  }
  return { sent, failed };
}
