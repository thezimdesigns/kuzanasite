"use client";

import { useState } from "react";
import { IconBrandFacebook, IconBrandLinkedin, IconBrandWhatsapp, IconBrandX } from "@tabler/icons-react";
import { Check, Link2 } from "lucide-react";

/**
 * WhatsApp-first sharing. `path` is the canonical path; the origin comes from
 * NEXT_PUBLIC_SITE_URL so shared links always use the public domain.
 */
export function ShareButtons({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const url = `${base || (typeof window !== "undefined" ? window.location.origin : "")}${path}`;
  const enc = encodeURIComponent;

  const others = [
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      Icon: IconBrandFacebook,
    },
    {
      label: "X",
      href: `https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}`,
      Icon: IconBrandX,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      Icon: IconBrandLinkedin,
    },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  const iconBtn =
    "inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] border border-line bg-white text-green-900 transition-[border-color,transform] duration-200 hover:border-green-800 active:scale-95";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`https://wa.me/?text=${enc(`${title}\n${url}`)}`}
        target="_blank"
        rel="noopener"
        className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] bg-[#25D366] px-4 font-heading text-sm font-bold text-[#06371d] transition-[filter,transform] hover:brightness-95 active:scale-[0.98]"
      >
        <IconBrandWhatsapp size={18} stroke={2} aria-hidden /> Share on WhatsApp
      </a>
      {others.map(({ label, href, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noopener" className={iconBtn} aria-label={`Share on ${label}`} title={`Share on ${label}`}>
          <Icon size={18} stroke={1.75} aria-hidden />
        </a>
      ))}
      <button type="button" onClick={copy} className={`${iconBtn} w-auto gap-1.5 px-3 text-sm font-semibold`}>
        {copied ? <Check className="size-4 text-green-800" /> : <Link2 className="size-4" />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
