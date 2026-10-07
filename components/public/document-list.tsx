import Link from "next/link";
import { FileText } from "lucide-react";
import { formatBytes } from "@/lib/files";
import { DOCUMENT_TYPE_LABELS } from "@/lib/options";
import { formatDate } from "@/lib/time";
import type { DocumentType } from "@/lib/generated/prisma/enums";

type Doc = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: DocumentType;
  date: Date | null;
  size: number | null;
  author: string | null;
  event?: { title: string } | null;
};

export function DocumentList({ docs }: { docs: Doc[] }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
      {docs.map((d) => (
        <li key={d.id}>
          <Link href={`/media/documents/${d.slug}`} className="flex gap-3 p-4 hover:bg-cream">
            <FileText className="mt-0.5 size-5 shrink-0 text-orange" />
            <div className="min-w-0">
              <p className="font-heading font-bold">{d.title}</p>
              <p className="mt-0.5 text-xs text-muted">
                {[DOCUMENT_TYPE_LABELS[d.type], d.date && formatDate(d.date), d.author, d.event?.title, d.size && formatBytes(d.size)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {d.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{d.description}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
