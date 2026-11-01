"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Copy, CornerDownLeft, Trash2 } from "lucide-react";
import { Uploader } from "@/components/uploader";
import { Button, Field, Input } from "@/components/ui";

export type StoryImage = {
  number: number;
  key: string;
  url: string;
  alt: string;
  caption: string;
  credit: string;
  creditUrl: string;
  width: number | null;
  height: number | null;
};

const code = (n: number) => `[image ${n}]`;
const CODE = /\[\s*image\s+(\d+)\s*\]/gi;

/**
 * Images placed inside the story text. Each upload gets a code like [image 3]
 * to paste (or insert) into the story; the public page shows the picture
 * there with its caption and photo credit. Saved with the story as JSON.
 */
export function StoryImages({ initial, nextNumber, bodyId }: { initial: StoryImage[]; nextNumber: number; bodyId: string }) {
  const [images, setImages] = useState(initial);
  // Numbers are never reused; a ref so several uploads finishing together each get their own.
  const next = useRef(nextNumber);
  const [copied, setCopied] = useState<number | null>(null);
  const [body, setBody] = useState("");

  // Follow the story text, to warn about codes without an image and images not placed.
  useEffect(() => {
    const el = document.getElementById(bodyId) as HTMLTextAreaElement | null;
    if (!el) return;
    const sync = () => setBody(el.value);
    sync();
    el.addEventListener("input", sync);
    return () => el.removeEventListener("input", sync);
  }, [bodyId]);

  const used = useMemo(() => new Set([...body.matchAll(CODE)].map((m) => Number(m[1]))), [body]);
  const missing = [...used].filter((n) => !images.some((i) => i.number === n)).sort((a, b) => a - b);
  const unplaced = images.filter((i) => !used.has(i.number));

  const update = (n: number, patch: Partial<StoryImage>) => setImages((list) => list.map((i) => (i.number === n ? { ...i, ...patch } : i)));

  /** Puts the code at the cursor in the story, on a line of its own. */
  const insert = (n: number) => {
    const el = document.getElementById(bodyId) as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const pre = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const post = after.startsWith("\n") ? "" : "\n\n";
    const text = `${pre}${code(n)}${post}`;
    el.focus();
    el.setRangeText(text, start, end, "end");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const copy = async (n: number) => {
    try {
      await navigator.clipboard.writeText(code(n));
      setCopied(n);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const payload = JSON.stringify(
    images.map(({ number, key, alt, caption, credit, creditUrl, width, height }) => ({ number, key, alt, caption, credit, creditUrl, width, height })),
  );

  return (
    <div className="space-y-4">
      <input type="hidden" name="images" value={payload} />
      <p className="text-sm text-muted">
        Upload photos, then put each one&apos;s code, like <code className="rounded bg-cream-dark px-1">[image 1]</code>, on its own line in the story where the
        photo should appear.
      </p>

      {images.length > 0 && (
        <ul className="space-y-3">
          {images.map((img) => (
            <li key={img.number} className="grid gap-3 rounded-[var(--radius-control)] border border-line bg-cream/50 p-3 sm:grid-cols-[7rem_1fr]">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="aspect-[4/3] w-full rounded object-cover" />
                <p className="mt-2 text-center font-mono text-sm font-bold text-green-900">{code(img.number)}</p>
                <div className="mt-1 flex justify-center gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => insert(img.number)} title="Insert into the story at the cursor">
                    <CornerDownLeft className="size-4" aria-hidden /> Insert
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => copy(img.number)} aria-label={`Copy ${code(img.number)}`}>
                    {copied === img.number ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Caption" className="sm:col-span-2">
                  <Input value={img.caption} onChange={(e) => update(img.number, { caption: e.target.value })} maxLength={300} />
                </Field>
                <Field label="Photo credit / source" hint="Photographer or outlet">
                  <Input value={img.credit} onChange={(e) => update(img.number, { credit: e.target.value })} maxLength={150} />
                </Field>
                <Field label="Credit link (optional)">
                  <Input type="url" value={img.creditUrl} onChange={(e) => update(img.number, { creditUrl: e.target.value })} placeholder="https://" />
                </Field>
                <Field label="Alt text" hint="Describes the photo for screen readers" className="sm:col-span-2">
                  <Input value={img.alt} onChange={(e) => update(img.number, { alt: e.target.value })} maxLength={200} />
                </Field>
                <div className="flex items-center justify-between gap-2 sm:col-span-2">
                  {!used.has(img.number) ? <span className="text-xs font-semibold text-orange-deeper">Not placed in the story yet</span> : <span />}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`Remove ${code(img.number)}? It is deleted when you save.`))
                        setImages((list) => list.filter((i) => i.number !== img.number));
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden /> Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && (
        <p className="flex items-start gap-2 rounded-[var(--radius-control)] bg-orange-50 px-3 py-2 text-sm text-orange-deeper">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          The story uses {missing.map(code).join(", ")} but there is no image with {missing.length === 1 ? "that number" : "those numbers"}. Visitors won&apos;t
          see anything there.
        </p>
      )}
      {unplaced.length > 1 && <p className="text-xs text-muted">{unplaced.length} images are not placed in the story yet.</p>}

      <Uploader
        label="Add photos to the story"
        multiple
        max={10}
        folder="news"
        maxDim={2000}
        onUploaded={(f) => {
          const number = next.current++;
          setImages((list) => [
            ...list,
            { number, key: f.key, url: f.preview ?? "", alt: "", caption: "", credit: "", creditUrl: "", width: f.width ?? null, height: f.height ?? null },
          ]);
        }}
      />
    </div>
  );
}
