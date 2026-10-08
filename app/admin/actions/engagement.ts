"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { adminFormAction, runAdmin } from "@/lib/admin-action";
import { db } from "@/lib/db";
import { checkbox, optionalEmail, optionalText, requiredText } from "@/lib/forms";
import { VISITOR_INTERESTS, VISITOR_TYPES } from "@/lib/options";
import { Channel, FeedbackStatus, type QuestionStatus } from "@/lib/generated/prisma/enums";
import { setQaAutoApprove } from "@/lib/qa";
import { deliverMessage, resolveAudience } from "@/lib/messaging";

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export const updateFeedback = adminFormAction(
  "feedback",
  z.object({
    id: z.string(),
    status: z.enum(FeedbackStatus),
    adminNotes: optionalText(5000),
  }),
  async (d) => {
    await db.feedback.update({
      where: { id: d.id },
      data: { status: d.status, adminNotes: d.adminNotes ?? null },
    });
    return { ok: true, message: "Feedback updated." };
  },
);

export async function setFeedbackStatus(id: string, status: FeedbackStatus) {
  return runAdmin("feedback", () => db.feedback.update({ where: { id }, data: { status } }));
}

// ---------------------------------------------------------------------------
// Messaging centre
// ---------------------------------------------------------------------------

const messageSchema = z.object({
  title: requiredText("Title", 120),
  body: requiredText("Message", 2000),
  url: optionalText(500),
  audience: requiredText("Audience", 200),
  channels: z.array(z.enum(Channel)).min(1, "Choose at least one channel."),
});

export const createMessage = adminFormAction(
  "messages",
  messageSchema,
  async (d, user) => {
    const eventId = d.audience.startsWith("event:") ? d.audience.slice(6) : null;
    const m = await db.message.create({
      data: {
        ...d,
        url: d.url ?? null,
        eventId,
        status: "DRAFT",
        createdById: user.id,
      },
    });
    redirect(`/admin/messages/${m.id}`);
  },
  { arrays: ["channels"] },
);

/** Sends a draft. The recipient list is recomputed at send time. */
export async function sendMessage(id: string) {
  return runAdmin("messages", async () => {
    const m = await db.message.findUniqueOrThrow({ where: { id } });
    if (m.status !== "DRAFT") throw new Error("This message has already been sent.");
    const r = await resolveAudience(m.audience, m.channels);
    await db.message.update({
      where: { id },
      data: {
        status: "SENDING",
        recipientCount: r.pushIds.length + r.emails.length,
        sentCount: 0,
        failedCount: 0,
      },
    });
    after(() => deliverMessage(id).catch((e) => console.error("Message delivery failed", e)));
  });
}

export async function cancelMessage(id: string) {
  return runAdmin("messages", () =>
    db.message.update({
      where: { id, status: "DRAFT" },
      data: { status: "CANCELLED" },
    }),
  );
}

// ---------------------------------------------------------------------------
// Visitors added by staff (e.g. at the registration desk)
// ---------------------------------------------------------------------------

export const createVisitor = adminFormAction(
  "visitors",
  z
    .object({
      name: requiredText("Full name"),
      phone: optionalText(30),
      email: optionalEmail,
      organisation: optionalText(200),
      city: optionalText(100),
      country: optionalText(100),
      visitorType: z.enum(VISITOR_TYPES).optional().catch(undefined),
      interests: z.array(z.enum(VISITOR_INTERESTS)).default([]),
      emailConsent: checkbox,
    })
    .refine((v) => v.email || v.phone, {
      message: "Give a mobile number or an email address.",
      path: ["phone"],
    }),
  async (d) => {
    await db.visitor.create({
      data: { ...d, emailConsent: d.emailConsent && !!d.email },
    });
    return { ok: true, message: `${d.name} added.` };
  },
  { arrays: ["interests"] },
);

// ---------------------------------------------------------------------------
// Conference Q&A moderation
// ---------------------------------------------------------------------------

export async function setQuestionStatus(id: string, status: QuestionStatus) {
  return runAdmin("qa", () =>
    db.conferenceQuestion.update({
      where: { id },
      data: { status, ...(status !== "APPROVED" && { pinned: false }), answeredAt: status === "ANSWERED" ? new Date() : null },
    }),
  );
}

/** Puts one question on the hall screen ("being answered now"); only one per conference at a time. */
export async function pinQuestion(id: string, pinned: boolean) {
  return runAdmin("qa", async () => {
    const q = await db.conferenceQuestion.findUniqueOrThrow({ where: { id } });
    await db.$transaction([
      db.conferenceQuestion.updateMany({ where: { eventId: q.eventId, pinned: true }, data: { pinned: false } }),
      ...(pinned ? [db.conferenceQuestion.update({ where: { id }, data: { pinned: true, status: "APPROVED" } })] : []),
    ]);
  });
}

export async function deleteQuestion(id: string) {
  return runAdmin("qa", () => db.conferenceQuestion.delete({ where: { id } }));
}

export async function setAutoApprove(on: boolean) {
  return runAdmin("qa", () => setQaAutoApprove(on));
}
