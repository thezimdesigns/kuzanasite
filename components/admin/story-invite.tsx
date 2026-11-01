"use client";

import { useState } from "react";
import { Check, Copy, Mail, MessageCircle } from "lucide-react";
import { Button, buttonClass } from "@/components/ui";

const waNumber = (phone: string) => phone.replace(/[^\d]/g, "").replace(/^0/, "263");

/**
 * Ready-made follow-up for one participant: copy the message, or open it in
 * WhatsApp or email with the personal "Share your story" link filled in.
 */
export function StoryInvite({ message, phone, email, subject }: { message: string; phone: string | null; email: string | null; subject: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
      >
        {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? "Copied" : "Copy invite"}
      </Button>
      {phone && (
        <a
          href={`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener"
          className={buttonClass("outline", "sm")}
        >
          <MessageCircle className="size-4 text-[#25D366]" aria-hidden /> WhatsApp
        </a>
      )}
      {email && (
        <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`} className={buttonClass("outline", "sm")}>
          <Mail className="size-4" aria-hidden /> Email
        </a>
      )}
    </div>
  );
}
