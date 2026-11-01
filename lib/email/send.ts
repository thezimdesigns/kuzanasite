import "server-only";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

/**
 * Outgoing email. Resend is used when RESEND_KEY is set; Amazon SES is the
 * fallback when its keys are set. sendEmail never throws, so an email outage
 * never breaks a page or a form.
 *
 * EMAIL_FROM sets the sender (its domain must be verified with the provider);
 * NOTIFY_EMAIL is the team inbox for form notifications.
 */
const FROM_NAME = process.env.SES_FROM_NAME || "KUZANA SCEEZ";
const FROM_ADDRESS = process.env.EMAIL_FROM || process.env.SES_FROM_EMAIL || "noreply@kuzana.org.zw";
const REPLY_TO = process.env.SES_REPLY_TO_EMAIL || undefined;

const resendKey = () => process.env.RESEND_KEY || process.env.RESEND_API_KEY;
const sesConfigured = () => !!(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.SES_FROM_EMAIL);

export function emailConfigured() {
  return !!resendKey() || sesConfigured();
}

/** Where form notifications go. */
export function teamInbox() {
  return process.env.NOTIFY_EMAIL || process.env.SES_REPLY_TO_EMAIL || "technical-partner@kuzana.org.zw";
}

export type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Replies go here instead of the default reply address (e.g. the visitor who filled in a form). */
  replyTo?: string;
  unsubscribeUrl?: string;
};

export async function sendEmail(input: EmailInput) {
  if (resendKey()) return sendWithResend(input);
  if (sesConfigured()) return sendWithSes(input);
  return false;
}

async function sendWithResend({ to, subject, text, html, replyTo, unsubscribeUrl }: EmailInput) {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_ADDRESS}>`,
        to: [to],
        subject,
        html,
        text,
        reply_to: replyTo ?? REPLY_TO,
        headers: unsubscribeUrl ? { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : undefined,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error("Resend send failed", res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (error) {
    console.error("Resend send failed", error);
    return false;
  }
}

let ses: SESv2Client | null = null;

async function sendWithSes({ to, subject, text, html, replyTo, unsubscribeUrl }: EmailInput) {
  ses ??= new SESv2Client({ region: process.env.AWS_REGION });
  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: `${FROM_NAME} <${FROM_ADDRESS}>`,
        Destination: { ToAddresses: [to] },
        ReplyToAddresses: replyTo ? [replyTo] : REPLY_TO ? [REPLY_TO] : undefined,
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: { Text: { Data: text, Charset: "UTF-8" }, Html: { Data: html, Charset: "UTF-8" } },
            Headers: unsubscribeUrl
              ? [
                  { Name: "List-Unsubscribe", Value: `<${unsubscribeUrl}>` },
                  { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" },
                ]
              : undefined,
          },
        },
      }),
    );
    return true;
  } catch (error) {
    console.error("SES send failed", error);
    return false;
  }
}
