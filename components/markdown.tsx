import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { fileUrl } from "@/lib/files";
import { PhotoCredit } from "@/components/photo-credit";
import { cn } from "@/components/ui";

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

type Block = { kind: "text"; text: string } | { kind: "images"; images: InlineImage[] };

/**
 * Splits a story into text and image blocks. Codes next to each other (only
 * whitespace between) form one block, shown as a grid. Unknown numbers are dropped.
 */
function toBlocks(body: string, images: InlineImage[]): Block[] {
  const byNumber = new Map(images.map((i) => [i.number, i]));
  // split() with a capture group alternates text and image numbers: [text, "2", text, "3", text].
  const parts = body.split(IMAGE_CODE);
  const blocks: Block[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const text = parts[i];
      const last = blocks.at(-1);
      // Whitespace between two codes keeps them in the same grid.
      if (!text.trim() && last?.kind === "images" && i + 1 < parts.length) continue;
      if (text.trim()) blocks.push({ kind: "text", text });
      continue;
    }
    const img = byNumber.get(Number(parts[i]));
    if (!img) continue;
    const last = blocks.at(-1);
    if (last?.kind === "images" && !parts[i - 1].trim()) last.images.push(img);
    else blocks.push({ kind: "images", images: [img] });
  }
  return blocks;
}

/** The story's in-text images in reading order, for the lightbox. */
export function storyImageOrder(body: string, images: InlineImage[]) {
  return toBlocks(body, images).flatMap((b) => (b.kind === "images" ? b.images : []));
}

/** Columns for a grid of n photos: never more than 4, and no lonely last row where it can be avoided. */
function gridColumns(n: number) {
  if (n <= 4) return n;
  if (n % 4 === 0) return 4;
  return n % 3 === 0 || n % 3 === 2 ? 3 : 4;
}
const COLS: Record<number, string> = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };

/**
 * Renders CMS Markdown. Raw HTML is not rendered, so content is safe to display.
 * With `images`, [image N] shortcodes become figures (adjacent codes become a
 * grid); each photo opens the story lightbox at index `lightboxStart + n`.
 */
export function Markdown({ children, images, lightboxStart = 0 }: { children: string | null | undefined; images?: InlineImage[]; lightboxStart?: number }) {
  if (!children) return null;
  if (!images?.length) {
    return (
      <div className="prose-kuzana">
        <ReactMarkdown components={components}>{children.replace(IMAGE_CODE, "")}</ReactMarkdown>
      </div>
    );
  }

  let order = lightboxStart;
  return (
    <div className="prose-kuzana">
      {toBlocks(children, images).map((block, i) => {
        if (block.kind === "text") {
          return (
            <ReactMarkdown key={i} components={components}>
              {block.text}
            </ReactMarkdown>
          );
        }
        if (block.images.length === 1) {
          const img = block.images[0];
          return (
            <figure key={i} className="story-figure">
              <StoryPhoto img={img} index={order++} />
              {img.caption && <figcaption className="mt-2 text-sm leading-snug text-muted">{img.caption}</figcaption>}
            </figure>
          );
        }
        const cols = gridColumns(block.images.length);
        return (
          <div key={i} className={cn("story-figure grid grid-cols-2 gap-2 sm:gap-3", COLS[cols])}>
            {block.images.map((img) => (
              <figure key={img.number} className="min-w-0">
                <StoryPhoto img={img} index={order++} tile />
                {img.caption && <figcaption className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted">{img.caption}</figcaption>}
              </figure>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** One photo: opens the lightbox; the credit sits behind a camera button in the corner. */
function StoryPhoto({ img, index, tile = false }: { img: InlineImage; index: number; tile?: boolean }) {
  const src = fileUrl(img.key);
  if (!src) return null;
  const alt = img.alt ?? img.caption ?? "";
  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-card)] bg-cream-dark">
      <button
        type="button"
        data-lightbox={index}
        className="block w-full cursor-zoom-in"
        aria-label={`View photo${img.caption ? `: ${img.caption}` : ""} full size`}
      >
        {tile ? (
          <span className="relative block aspect-[4/3]">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(min-width: 1024px) 200px, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
            />
          </span>
        ) : (
          <Image src={src} alt={alt} width={img.width ?? 1600} height={img.height ?? 1067} sizes="(min-width: 768px) 720px, 100vw" className="h-auto w-full" />
        )}
      </button>
      {img.credit && <PhotoCredit credit={img.credit} creditUrl={img.creditUrl} size={tile ? "sm" : "md"} />}
    </div>
  );
}
