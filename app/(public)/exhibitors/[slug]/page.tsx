import type { Metadata } from "next";
import { shareMetadata } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Globe, Map as MapIcon, Mail, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { db } from "@/lib/db";
import { fileUrl, formatBytes } from "@/lib/files";
import { findExhibitorStall } from "@/lib/floor-plans";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { RatingForm } from "@/components/public/rating-form";
import { ShareButtons } from "@/components/public/share-buttons";
import { Badge, Card, Section, SectionTitle } from "@/components/ui";

async function getExhibitor(slug: string) {
  return db.exhibitor.findFirst({
    where: { slug, status: "APPROVED" },
    include: {
      category: true,
      media: { orderBy: { sortOrder: "asc" } },
      edition: true,
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/exhibitors/[slug]">): Promise<Metadata> {
  const x = await getExhibitor((await params).slug);
  if (!x) return {};
  const image = fileUrl(x.logoKey ?? x.media.find((m) => m.mimeType.startsWith("image/"))?.key);
  return {
    title: `${x.name}: Exhibitor`,
    description: x.description ?? `${x.name} at KUZANA SCEEZ ${x.edition.year}`,
    ...shareMetadata({ image, imageAlt: x.name }),
  };
}

const waLink = (num: string) => `https://wa.me/${num.replace(/[^\d]/g, "").replace(/^0/, "263")}`;

export default async function ExhibitorPage({ params }: PageProps<"/exhibitors/[slug]">) {
  const x = await getExhibitor((await params).slug);
  if (!x) notFound();

  const [rating, stall] = await Promise.all([
    db.rating.aggregate({
      where: { exhibitorId: x.id },
      _avg: { stars: true },
      _count: { stars: true },
    }),
    findExhibitorStall(x.id),
  ]);
  const images = x.media.filter((m) => m.mimeType.startsWith("image/") && m.kind !== "LOGO");
  const files = x.media.filter((m) => !m.mimeType.startsWith("image/"));
  const logo = fileUrl(x.logoKey);
  const socials = [
    ["Website", x.website],
    ["Facebook", x.facebook],
    ["Instagram", x.instagram],
    ["LinkedIn", x.linkedin],
    ["TikTok", x.tiktok],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <header className="border-b border-line bg-ivory-pattern">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:px-6 sm:py-10">
          {logo && (
            <div className="relative size-28 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
              <Image src={logo} alt={`${x.name} logo`} fill sizes="112px" className="object-contain p-2" />
            </div>
          )}
          <div className="min-w-0">
            <Link href="/exhibitors" className="text-sm font-semibold text-green-800 underline">
              Exhibitors
            </Link>
            <h1 className="mt-1 text-3xl font-extrabold text-green-900 sm:text-4xl">{x.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {x.category && <Badge tone="green">{x.category.name}</Badge>}
              {(x.hall || x.stand) && (
                <Badge tone="orange">
                  <MapPin className="size-3.5" />
                  {[x.hall && `Hall ${x.hall}`, x.stand && `Stand ${x.stand}`].filter(Boolean).join(" · ")}
                </Badge>
              )}
              <Badge>KUZANA SCEEZ {x.edition.year}</Badge>
            </div>
            {stall && (
              <Link
                href={stall.href}
                className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-green-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
              >
                <MapIcon className="size-4" aria-hidden /> Find stand {stall.label} on the floor plan
              </Link>
            )}
          </div>
        </div>
      </header>

      <Section className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-8">
          {x.description && (
            <div>
              <SectionTitle>About</SectionTitle>
              <p className="leading-relaxed whitespace-pre-line">{x.description}</p>
            </div>
          )}
          {(x.showcasing || x.products) && (
            <div>
              <SectionTitle>Showcasing at KUZANA</SectionTitle>
              {x.showcasing && <p className="leading-relaxed whitespace-pre-line">{x.showcasing}</p>}
              {x.products && <p className="mt-3 leading-relaxed whitespace-pre-line">{x.products}</p>}
            </div>
          )}
          {images.length > 0 && (
            <div>
              <SectionTitle>Photos</SectionTitle>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((m) => (
                  <a
                    key={m.id}
                    href={fileUrl(m.key)!}
                    target="_blank"
                    rel="noopener"
                    className="relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-control)] bg-cream-dark"
                  >
                    <Image
                      src={fileUrl(m.key)!}
                      alt={m.caption ?? `${x.name} ${m.kind.toLowerCase().replace("_", " ")}`}
                      fill
                      sizes="(min-width: 640px) 25vw, 50vw"
                      className="object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
          {(x.opportunities.length > 0 || x.seeking || x.offering) && (
            <div>
              <SectionTitle>Opportunities</SectionTitle>
              {x.opportunities.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="text-sm font-semibold">Looking for:</span>
                  {x.opportunities.map((o) => (
                    <Badge key={o} tone="gold">
                      {o}
                    </Badge>
                  ))}
                </div>
              )}
              {x.seeking && <p className="whitespace-pre-line">{x.seeking}</p>}
              {x.offering && (
                <p className="mt-3 whitespace-pre-line">
                  <strong>What we offer:</strong> {x.offering}
                </p>
              )}
            </div>
          )}
          <ShareButtons title={`${x.name} at KUZANA SCEEZ`} path={`/exhibitors/${x.slug}`} />
        </div>

        <aside className="space-y-6">
          <Card className="p-5">
            <EnquiryForm exhibitorId={x.id} exhibitorName={x.name} />
          </Card>
          <Card className="p-5">
            {rating._count.stars >= 3 && (
              <p className="mb-3 flex items-center gap-1.5 text-sm">
                <Star className="size-4 fill-gold text-gold" aria-hidden />
                <strong>{rating._avg.stars?.toFixed(1)}</strong>
                <span className="text-muted">from {rating._count.stars} visitor ratings</span>
              </p>
            )}
            <RatingForm exhibitorId={x.id} label="Visited this stand? Rate it" />
          </Card>
          <Card className="space-y-3 p-5">
            <h2 className="font-heading text-lg font-bold text-green-900">Contact</h2>
            <p className="text-sm">
              <strong>{x.contactName}</strong>
            </p>
            <a href={`tel:${x.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm hover:text-green-800">
              <Phone className="size-4 text-orange-dark" /> {x.phone}
            </a>
            {(x.whatsapp || x.phone) && (
              <a href={waLink(x.whatsapp ?? x.phone)} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm hover:text-green-800">
                <MessageCircle className="size-4 text-[#25D366]" /> WhatsApp
              </a>
            )}
            {x.email && (
              <a href={`mailto:${x.email}`} className="flex items-center gap-2 text-sm break-all hover:text-green-800">
                <Mail className="size-4 text-orange-dark" /> {x.email}
              </a>
            )}
            {x.address && (
              <p className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-orange-dark" /> {x.address}
              </p>
            )}
            {socials.length > 0 && (
              <ul className="flex flex-wrap gap-2 pt-2">
                {socials.map(([label, url]) => (
                  <li key={label}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener nofollow"
                      className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-line px-3 py-1 text-xs font-semibold hover:border-green-800"
                    >
                      <Globe className="size-3" /> {label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {files.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 font-heading text-lg font-bold text-green-900">Brochures &amp; documents</h2>
              <ul className="space-y-2">
                {files.map((m) => (
                  <li key={m.id}>
                    <a href={fileUrl(m.key, m.fileName)!} className="flex items-start gap-2 text-sm hover:text-green-800">
                      <Download className="mt-0.5 size-4 shrink-0 text-orange-dark" />
                      <span>
                        <span className="font-semibold">{m.fileName ?? m.kind.toLowerCase()}</span>
                        <span className="block text-xs text-muted">{formatBytes(m.size)}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </Section>
    </>
  );
}
