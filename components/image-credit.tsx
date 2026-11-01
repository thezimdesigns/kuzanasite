/** Caption and "Photo: …" credit under an image; the credit links to its source when one is given. */
export function ImageCredit({ caption, credit, creditUrl }: { caption?: string | null; credit?: string | null; creditUrl?: string | null }) {
  if (!caption && !credit) return null;
  return (
    <figcaption className="mt-2 text-sm leading-snug text-muted">
      {caption && <span className="text-ink/80">{caption}</span>}
      {caption && credit && " "}
      {credit && (
        <span className="text-xs whitespace-nowrap">
          Photo:{" "}
          {creditUrl ? (
            <a href={creditUrl} target="_blank" rel="noopener nofollow" className="underline underline-offset-2 hover:text-green-800">
              {credit}
            </a>
          ) : (
            credit
          )}
        </span>
      )}
    </figcaption>
  );
}
