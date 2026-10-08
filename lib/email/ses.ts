import "server-only";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

let client: SESv2Client | null = null;

export function emailConfigured() {
  return !!(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.SES_FROM_EMAIL);
}

function ses() {
  client ??= new SESv2Client({ region: process.env.AWS_REGION });
  return client;
}

export type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  unsubscribeUrl?: string;
};

/** Sends one email through SES. Returns false (never throws) so email outages never break pages. */
export async function sendEmail({ to, subject, text, html, unsubscribeUrl }: EmailInput) {
  if (!emailConfigured()) return false;
  const fromName = process.env.SES_FROM_NAME ?? "KUZANA SCEEZ";
  try {
    await ses().send(
      new SendEmailCommand({
        FromEmailAddress: `${fromName} <${process.env.SES_FROM_EMAIL}>`,
        Destination: { ToAddresses: [to] },
        ReplyToAddresses: process.env.SES_REPLY_TO_EMAIL ? [process.env.SES_REPLY_TO_EMAIL] : undefined,
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: {
              Text: { Data: text, Charset: "UTF-8" },
              Html: { Data: html, Charset: "UTF-8" },
            },
            Headers: unsubscribeUrl
              ? [
                  { Name: "List-Unsubscribe", Value: `<${unsubscribeUrl}>` },
                  {
                    Name: "List-Unsubscribe-Post",
                    Value: "List-Unsubscribe=One-Click",
                  },
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
