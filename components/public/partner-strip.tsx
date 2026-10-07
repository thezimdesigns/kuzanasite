import Image from "next/image";
import { fileUrl } from "@/lib/files";
import { cn } from "@/components/ui";

type Partner = {
  id: string;
  name: string;
  logoUrl: string | null;
  logoKey: string | null;
  url: string | null;
  caption: string | null;
  prominent: boolean;
};

/**
 * Partner logos. Prominent partners (the hosting ministry) get a large mark;
 * every other logo sits in an identical box so they read at the same size.
 */
export function PartnerStrip({ partners }: { partners: Partner[] }) {
  const lead = partners.filter((p) => p.prominent);
  const rest = partners.filter((p) => !p.prominent);
  return (
    <div className="flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-12">
      {lead.length > 0 && (
        <ul className="flex flex-wrap items-center justify-center gap-8">
          {lead.map((p) => (
            <PartnerLogo key={p.id} partner={p} className="h-32 w-32 sm:h-36 sm:w-36" sizes="144px" />
          ))}
        </ul>
      )}
      {lead.length > 0 && rest.length > 0 && <span className="hidden h-24 w-px bg-line md:block" aria-hidden />}
      {rest.length > 0 && (
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {rest.map((p) => (
            <PartnerLogo key={p.id} partner={p} className="h-[4.5rem] w-44" sizes="176px" />
          ))}
        </ul>
      )}
    </div>
  );
}

function PartnerLogo({ partner: p, className, sizes }: { partner: Partner; className: string; sizes: string }) {
  const logo = p.logoUrl ?? fileUrl(p.logoKey);
  const mark = logo ? (
    <span className={cn("relative block", className)}>
      <Image src={logo} alt={p.name} fill sizes={sizes} className="object-contain" />
    </span>
  ) : (
    <span className={cn("flex items-center justify-center text-center font-heading font-bold", className)}>{p.name}</span>
  );
  return (
    <li className="flex flex-col items-center gap-2">
      {p.url ? (
        <a href={p.url} target="_blank" rel="noopener" className="transition-opacity hover:opacity-80">
          {mark}
        </a>
      ) : (
        mark
      )}
      <span className={cn("text-xs font-semibold text-muted", !p.caption && "sr-only")}>{p.caption ?? p.name}</span>
    </li>
  );
}
