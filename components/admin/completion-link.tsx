"use client";

import { useState, useTransition } from "react";
import { Copy, Link2, MessageCircle } from "lucide-react";
import { createCompletionLink } from "@/app/admin/actions/exhibitors";
import { Button, Checkbox } from "@/components/ui";

export function CompletionLink({ exhibitorId, phone, name }: { exhibitorId: string; phone: string; name: string }) {
  const [url, setUrl] = useState("");
  const [markNeedsInfo, setMarkNeedsInfo] = useState(true);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  const message = `Hello ${name}, please complete your KUZANA SCEEZ exhibitor profile here: ${url}`;
  const wa = `https://wa.me/${phone.replace(/[^\d]/g, "").replace(/^0/, "263")}?text=${encodeURIComponent(message)}`;

  if (!url) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => start(async () => setUrl(await createCompletionLink(exhibitorId, markNeedsInfo)))}
        >
          <Link2 className="size-4" /> {pending ? "Creating…" : "Create completion link"}
        </Button>
        <Checkbox label="Also mark as “Needs information”" checked={markNeedsInfo} onChange={(e) => setMarkNeedsInfo(e.target.checked)} />
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg bg-cream p-3">
      <p className="text-xs text-muted">Copy this now. For security it won&apos;t be shown again.</p>
      <code className="block rounded bg-white p-2 text-sm break-all">{url}</code>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(message);
            setCopied(true);
          }}
        >
          <Copy className="size-4" /> {copied ? "Copied" : "Copy message"}
        </Button>
        <a
          href={wa}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-1.5 text-sm font-bold text-white"
        >
          <MessageCircle className="size-4" /> Send by WhatsApp
        </a>
        <a
          href={`sms:${phone}?body=${encodeURIComponent(message)}`}
          className="inline-flex items-center rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold"
        >
          SMS
        </a>
      </div>
    </div>
  );
}
