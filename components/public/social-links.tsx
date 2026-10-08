import { IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin, IconBrandX, IconBrandYoutube } from "@tabler/icons-react";
import { cn } from "@/components/ui";

const NETWORKS = [
  { key: "facebook", label: "Facebook", Icon: IconBrandFacebook },
  { key: "instagram", label: "Instagram", Icon: IconBrandInstagram },
  { key: "youtube", label: "YouTube", Icon: IconBrandYoutube },
  { key: "linkedin", label: "LinkedIn", Icon: IconBrandLinkedin },
  { key: "x", label: "X", Icon: IconBrandX },
] as const;

export type SocialUrls = Partial<Record<(typeof NETWORKS)[number]["key"], string | null>>;

/** Brand icon links. A network only appears when its link has been entered. */
export function SocialLinks({
  urls,
  name,
  tone = "light",
  size = "md",
  className,
}: {
  urls: SocialUrls;
  /** Whose profiles these are, for screen readers ("KUZANA SCEEZ on Facebook"). */
  name: string;
  tone?: "light" | "dark";
  size?: "sm" | "md";
  className?: string;
}) {
  const present = NETWORKS.filter((n) => urls[n.key]);
  if (!present.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {present.map(({ key, label, Icon }) => (
        <li key={key}>
          <a
            href={urls[key]!}
            target="_blank"
            rel="noopener"
            aria-label={`${name} on ${label}`}
            title={label}
            className={cn(
              "inline-flex items-center justify-center rounded-[var(--radius-control)] border transition-[background-color,border-color,color,transform] duration-200 active:scale-95",
              size === "md" ? "size-10" : "size-8",
              tone === "light"
                ? "border-white/15 text-white/85 hover:border-white/40 hover:bg-white/10 hover:text-white"
                : "border-line bg-white text-green-900 hover:border-green-800 hover:text-green-800",
            )}
          >
            <Icon size={size === "md" ? 20 : 17} stroke={1.75} aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
