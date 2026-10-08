import "server-only";
import { db } from "@/lib/db";
import { emailConfigured, sendEmail } from "@/lib/email/ses";
import { layout } from "@/lib/email/templates";
import type { Channel } from "@/lib/generated/prisma/enums";
import { VISITOR_INTERESTS, VISITOR_TYPES } from "@/lib/options";
import { pushConfigured, sendPush } from "@/lib/push";
import { siteUrl } from "@/lib/site";

/**
 * Audience keys:
 *   all                 everyone who opted in on the selected channels
 *   event:<eventId>     people who tapped "Notify me" on that event
 *   interest:<name>     visitors who selected that interest
 *   type:<visitorType>  visitors of that type (e.g. Media, Conference Delegate)
 *   exhibitors          approved exhibitors with an email (operational messages)
 */
export async function audienceOptions() {
  const events = await db.event.findMany({
    where: { publishStatus: "PUBLISHED" },
    orderBy: { startsAt: "asc" },
    select: { id: true, title: true },
  });
  return [
    {
      group: "General",
      options: [
        { value: "all", label: "All opted-in visitors and alert subscribers" },
        { value: "exhibitors", label: "Exhibitors (email)" },
      ],
    },
    {
      group: "Event followers (Notify me)",
      options: events.map((e) => ({
        value: `event:${e.id}`,
        label: `${e.title} followers`,
      })),
    },
    {
      group: "Visitor interests",
      options: VISITOR_INTERESTS.map((i) => ({
        value: `interest:${i}`,
        label: i,
      })),
    },
    {
      group: "Visitor types",
      options: VISITOR_TYPES.map((t) => ({ value: `type:${t}`, label: t })),
    },
  ];
}

type Recipients = {
  pushIds: string[];
  emails: { email: string; token?: string }[];
};

export async function resolveAudience(audience: string, channels: Channel[]): Promise<Recipients> {
  const wantPush = channels.includes("WEB_PUSH");
  const wantEmail = channels.includes("EMAIL");
  const [kind, ...rest] = audience.split(":");
  const value = rest.join(":");

  if (kind === "exhibitors") {
    const ex = wantEmail
      ? await db.exhibitor.findMany({
          where: { status: "APPROVED", email: { not: null } },
          select: { email: true },
        })
      : [];
    return {
      pushIds: [],
      emails: dedupe(ex.map((e) => ({ email: e.email! }))),
    };
  }

  if (kind === "event") {
    const subs = await db.eventSubscription.findMany({
      where: { eventId: value },
      include: { pushSubscription: true, visitor: true },
    });
    return {
      pushIds: wantPush ? subs.filter((s) => s.pushSubscription?.active).map((s) => s.pushSubscriptionId!) : [],
      emails: wantEmail
        ? dedupe(
            subs
              .filter((s) => s.visitor?.emailConsent && s.visitor.email)
              .map((s) => ({
                email: s.visitor!.email!,
                token: s.visitor!.unsubscribeToken,
              })),
          )
        : [],
    };
  }

  const visitorWhere = kind === "interest" ? { interests: { has: value } } : kind === "type" ? { visitorType: value } : {};

  const pushIds = wantPush
    ? (
        await db.pushSubscription.findMany({
          where: {
            active: true,
            ...(kind === "all" ? {} : { visitor: visitorWhere }),
          },
          select: { id: true },
        })
      ).map((p) => p.id)
    : [];
  const visitors = wantEmail
    ? await db.visitor.findMany({
        where: { ...visitorWhere, emailConsent: true, email: { not: null } },
        select: { email: true, unsubscribeToken: true },
      })
    : [];
  return {
    pushIds,
    emails: dedupe(visitors.map((v) => ({ email: v.email!, token: v.unsubscribeToken }))),
  };
}

function dedupe(list: { email: string; token?: string }[]) {
  const seen = new Set<string>();
  return list.filter((r) => {
    const k = r.email.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function channelAvailability() {
  return { WEB_PUSH: pushConfigured(), EMAIL: emailConfigured() };
}

/** Delivers a message. Runs after the admin's request has returned. */
export async function deliverMessage(messageId: string) {
  const message = await db.message.findUniqueOrThrow({
    where: { id: messageId },
  });
  const { pushIds, emails } = await resolveAudience(message.audience, message.channels);
  let sent = 0;
  let failed = 0;

  try {
    if (message.channels.includes("WEB_PUSH") && pushIds.length) {
      const r = await sendPush(pushIds, {
        title: message.title,
        body: message.body,
        url: message.url,
      });
      sent += r.sent;
      failed += r.failed;
      await db.message.update({
        where: { id: messageId },
        data: { sentCount: sent, failedCount: failed },
      });
    }

    if (message.channels.includes("EMAIL") && emails.length) {
      for (const [i, r] of emails.entries()) {
        const unsubscribeUrl = r.token ? siteUrl(`/unsubscribe/${r.token}`) : undefined;
        const { html, text } = layout({
          title: message.title,
          body: message.body,
          ctaUrl: message.url ? (message.url.startsWith("/") ? siteUrl(message.url) : message.url) : null,
          ctaLabel: "Open on the KUZANA website",
          unsubscribeUrl,
        });
        const ok = await sendEmail({
          to: r.email,
          subject: message.title,
          html,
          text,
          unsubscribeUrl,
        });
        if (ok) sent++;
        else failed++;
        // Stay under the SES send rate (default 14/s in production, 1/s in the sandbox).
        await new Promise((res) => setTimeout(res, Number(process.env.SES_SEND_INTERVAL_MS ?? 120)));
        if (i % 25 === 0)
          await db.message.update({
            where: { id: messageId },
            data: { sentCount: sent, failedCount: failed },
          });
      }
    }
  } finally {
    await db.message.update({
      where: { id: messageId },
      data: {
        sentCount: sent,
        failedCount: failed,
        sentAt: new Date(),
        status: failed === 0 ? "SENT" : sent === 0 ? "FAILED" : "PARTIALLY_FAILED",
      },
    });
  }
}
