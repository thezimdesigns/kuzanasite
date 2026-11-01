import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { fileUrl } from "@/lib/files";
import { ImageCredit } from "@/components/image-credit";

export type InlineImage = {
  number: number;
  key: string;
  alt: string | null;
  caption: string | null;
  credit: string | null;
  creditUrl: string | null;
  width: number | null;
  height: number | null;
};

/** [image 2], [Image 2], [ image 2 ]: a story's in-text image shortcodes. */
export const IMAGE_CODE = /\[\s*image\s+(\d+)\s*\]/gi;

const components = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
    const external = href?.startsWith("http");
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
        {children}
      </a>
    );
  },
};

/**
 * Renders CMS Markdown. Raw HTML is not rendered, so content is safe to display.
 * With `images`, [image N] shortcodes become figures; they only resolve to
 * images stored for this content, and unknown numbers render nothing.
 */
export function Markdown({ children, images }: { children: string | null | undefined; images?: InlineImage[] }) {
  if (!children) return null;
  if (!images?.length) {
    return (
      <div className="prose-kuzana">
        <ReactMarkdown components={components}>{children.replace(IMAGE_CODE, "")}</ReactMarkdown>
      </div>
    );
  }

  const byNumber = new Map(images.map((i) => [i.number, i]));
  // split() with a capture group alternates text and image numbers: [text, "2", text, "3", text].
  const parts = children.split(IMAGE_CODE);
  return (
    <div className="prose-kuzana">
      {parts.map((part, i) => {
        if (i % 2 === 0)
          return part.trim() ? (
            <ReactMarkdown key={i} components={components}>
              {part}
            </ReactMarkdown>
          ) : null;
        const img = byNumber.get(Number(part));
        const src = img && fileUrl(img.key);
        if (!img || !src) return null;
        return (
          <figure key={i} className="story-figure">
            <Image
              src={src}
              alt={img.alt ?? img.caption ?? ""}
              width={img.width ?? 1600}
              height={img.height ?? 1067}
              sizes="(min-width: 768px) 720px, 100vw"
              className="h-auto w-full rounded-[var(--radius-card)] bg-cream-dark"
            />
            <ImageCredit caption={img.caption} credit={img.credit} creditUrl={img.creditUrl} />
          </figure>
        );
      })}
    </div>
  );
}
