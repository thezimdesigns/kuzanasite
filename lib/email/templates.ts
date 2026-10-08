const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Plain branded layout shared by every KUZANA email. */
export function layout(opts: { title: string; body: string; ctaUrl?: string | null; ctaLabel?: string; unsubscribeUrl?: string }) {
  const paragraphs = opts.body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.55">${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const cta = opts.ctaUrl
    ? `<p style="margin:22px 0"><a href="${escape(opts.ctaUrl)}" style="background:#f36c21;color:#fff;padding:12px 22px;border-radius:30px;text-decoration:none;font-weight:700">${escape(opts.ctaLabel ?? "Open")}</a></p>`
    : "";
  const footer = opts.unsubscribeUrl
    ? `<p style="font-size:12px;color:#777;margin-top:28px">You are receiving this because you registered with KUZANA SCEEZ. <a href="${escape(opts.unsubscribeUrl)}" style="color:#777">Unsubscribe</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#fbfaf6;font-family:Arial,sans-serif;color:#111">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<div style="font-weight:800;color:#00512D;font-size:20px;margin-bottom:18px">KUZANA SCEEZ</div>
<h1 style="font-size:22px;margin:0 0 16px;color:#00512D">${escape(opts.title)}</h1>
${paragraphs}${cta}${footer}
</div></body></html>`;
  const text = `${opts.title}\n\n${opts.body}${opts.ctaUrl ? `\n\n${opts.ctaUrl}` : ""}${opts.unsubscribeUrl ? `\n\nUnsubscribe: ${opts.unsubscribeUrl}` : ""}`;
  return { html, text };
}
