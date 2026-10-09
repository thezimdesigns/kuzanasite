"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Download, Mail } from "lucide-react";
import { emailEnquiries, markEnquiriesForwarded } from "@/app/admin/actions/exhibitors";
import { Button, buttonClass, cn } from "@/components/ui";

type Result = { ok: boolean; message: string };

/** "Email all pending" for the whole expo. */
export function EmailAllEnquiries({ exhibitors, enquiries, disabled }: { exhibitors: number; enquiries: number; disabled: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        disabled={pending || disabled || !enquiries}
        onClick={() => {
          if (!window.confirm(`Email ${enquiries} pending enquiries to ${exhibitors} exhibitors? Each gets one email with all of theirs.`)) return;
          start(async () => setResult(await emailEnquiries()));
        }}
      >
        <Mail className="size-4" aria-hidden /> {pending ? "Sending…" : "Email all pending"}
      </Button>
      {result && <Outcome result={result} />}
    </span>
  );
}

/** Per exhibitor: email, copy as text (for WhatsApp or a personal email), CSV, mark as passed on. */
export function ExhibitorEnquiryActions({
  exhibitorId,
  hasEmail,
  canEmail,
  digest,
}: {
  exhibitorId: string;
  hasEmail: boolean;
  canEmail: boolean;
  digest: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || !hasEmail || !canEmail}
          title={!hasEmail ? "This exhibitor has no email address" : !canEmail ? "Email isn't set up on the server yet" : undefined}
          onClick={() => start(async () => setResult(await emailEnquiries(exhibitorId)))}
        >
          <Mail className="size-4" aria-hidden /> Email
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(digest);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setResult({ ok: false, message: "Couldn't copy. Use the CSV instead." });
            }
          }}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? "Copied" : "Copy text"}
        </Button>
        <a href={`/admin/enquiries/export?exhibitor=${exhibitorId}`} className={buttonClass("outline", "sm")}>
          <Download className="size-4" aria-hidden /> CSV
        </a>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Mark these enquiries as passed on (for example by WhatsApp)?")) return;
            start(async () => {
              await markEnquiriesForwarded(exhibitorId);
              setResult({ ok: true, message: "Marked as passed on." });
            });
          }}
        >
          Mark as passed on
        </Button>
      </div>
      {result && <Outcome result={result} />}
    </div>
  );
}

function Outcome({ result }: { result: Result }) {
  return (
    <span role="status" className={cn("text-xs font-semibold", result.ok ? "text-green-800" : "text-danger")}>
      {result.message}
    </span>
  );
}
