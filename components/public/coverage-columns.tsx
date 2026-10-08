import type { ReactNode } from "react";
import { IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin, IconBrandTiktok, IconBrandX, IconBrandYoutube } from "@tabler/icons-react";
import { ArrowUpRight, Globe, Newspaper, Radio, Tv } from "lucide-react";
import type { MentionPlatform } from "@/lib/generated/prisma/enums";
import { balanceColumns, PLATFORM_LABELS } from "@/lib/coverage";
import { fileUrl } from "@/lib/files";
import { formatDate } from "@/lib/time";

type Mention = {
  id: string;
  url: string;
  title: string;
  outlet: string | null;
  platform: MentionPlatform;
  excerpt: string | null;
  imageUrl: string | null;
  imageKey?: string | null;
  publishedAt: Date | null;
};

/** The admin's uploaded picture wins over the one found on the linked page. */
const pictureOf = (m: Mention) => fileUrl(m.imageKey) ?? m.imageUrl;

const ICONS: Record<MentionPlatform, (p: { className?: string }) => ReactNode> = {
  FACEBOOK: ({ className }) => <IconBrandFacebook className={className} stroke={1.75} />,
  INSTAGRAM: ({ className }) => <IconBrandInstagram className={className} stroke={1.75} />,
  X: ({ className }) => <IconBrandX className={className} stroke={1.75} />,
  YOUTUBE: ({ className }) => <IconBrandYoutube className={className} stroke={1.75} />,
  TIKTOK: ({ className }) => <IconBrandTiktok className={className} stroke={1.75} />,
  LINKEDIN: ({ className }) => <IconBrandLinkedin className={className} stroke={1.75} />,
  NEWS: ({ className }) => <Newspaper className={className} />,
  RADIO: ({ className }) => <Radio className={className} />,
  TV: ({ className }) => <Tv className={className} />,
  WEBSITE: ({ className }) => <Globe className={className} />,
  OTHER: ({ className }) => <Globe className={className} />,
};

/** Rough visual height, used to keep the three columns level. */
const weight = (m: Mention) => 3 + m.title.length / 38 + (m.excerpt ? Math.min(m.excerpt.length, 180) / 55 : 0) + (pictureOf(m) ? 5 : 0);

/**
 * Links to coverage of KUZANA elsewhere. On wider screens items flow into three
 * balanced columns (each new item goes to the shortest column); on phones they
 * stay in one list in their original order.
 */
export function CoverageColumns({ mentions }: { mentions: Mention[] }) {
  const cols = balanceColumns(mentions, 3, weight);
  return (
    <>
      <div className="hidden gap-4 md:grid md:grid-cols-3">
        {cols.map((col, i) => (
          <ul key={i} className="reveal-list flex flex-col gap-4">
            {col.map((m) => (
              <li key={m.id}>
                <MentionCard mention={m} />
              </li>
            ))}
          </ul>
        ))}
      </div>
      <ul className="reveal-list flex flex-col gap-3 md:hidden">
        {mentions.map((m) => (
          <li key={m.id}>
            <MentionCard mention={m} />
          </li>
        ))}
      </ul>
    </>
  );
}

function MentionCard({ mention: m }: { mention: Mention }) {
  const Icon = ICONS[m.platform];
  return (
    <a
      href={m.url}
      target="_blank"
      rel="noopener nofollow"
      className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-green-800/40 hover:shadow-[var(--shadow-lift)]"
    >
      {pictureOf(m) && (
        // Uploaded picture, or the preview image from the linked site.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pictureOf(m)!} alt="" loading="lazy" referrerPolicy="no-referrer" className="aspect-[16/9] w-full bg-cream-dark object-cover" />
      )}
      <div className="p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-green-900">
          <Icon className="size-[1.05rem] shrink-0 text-orange-dark" />
          <span className="truncate">{m.outlet ?? PLATFORM_LABELS[m.platform]}</span>
        </p>
        <h3 className="mt-2 font-heading leading-snug font-bold text-balance text-ink group-hover:text-green-800">
          {m.title}
          <ArrowUpRight
            className="ml-1 inline size-4 align-[-2px] text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </h3>
        {m.excerpt && <p className="mt-1.5 line-clamp-3 text-sm text-muted">{m.excerpt}</p>}
        {m.publishedAt && <p className="mt-2 text-xs font-semibold text-muted">{formatDate(m.publishedAt)}</p>}
      </div>
    </a>
  );
}
