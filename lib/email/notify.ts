import "server-only";
import { after } from "next/server";
import { emailConfigured, sendEmail, teamInbox } from "@/lib/email/send";
import { layout } from "@/lib/email/templates";
import { siteUrl } from "@/lib/site";

type Row = [label: string, value: string | null | undefined];

/** Plain "Label: value" lines, skipping empty answers. */
const rowsText = (rows: Row[]) =>
  rows
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v!.trim()}`)
    .join("\n\n");

/**
 * Tells the team about a form submission, after the response is sent so the
 * visitor never waits on email. Replies go straight to the person who wrote in.
 */
export function notifyTeam(opts: { subject: string; intro: string; rows: Row[]; adminPath: string; replyTo?: string | null }) {
  if (!emailConfigured()) return;
  after(async () => {
    const { html, text } = layout({
      title: opts.subject,
      body: `${opts.intro}\n\n${rowsText(opts.rows)}`,
      ctaUrl: siteUrl(opts.adminPath),
      ctaLabel: "Open in admin",
    });
    await sendEmail({ to: teamInbox(), subject: `[KUZANA] ${opts.subject}`, html, text, replyTo: opts.replyTo ?? undefined });
  });
}

/** A short "we got it" email to the person who filled in a form (only when they gave an email). */
export function confirmToSender(opts: { to: string | null | undefined; subject: string; title: string; body: string; ctaPath?: string; ctaLabel?: string }) {
  if (!opts.to || !emailConfigured()) return;
  const to = opts.to;
  after(async () => {
    const { html, text } = layout({ title: opts.title, body: opts.body, ctaUrl: opts.ctaPath ? siteUrl(opts.ctaPath) : null, ctaLabel: opts.ctaLabel });
    await sendEmail({ to, subject: opts.subject, html, text });
  });
}
