import { ArrowDown, ArrowUp } from "lucide-react";
import { db } from "@/lib/db";
import { DEFAULT_LOGO } from "@/lib/branding";
import { fileUrl } from "@/lib/files";
import { can, requireStaff } from "@/lib/permissions";
import { deleteHeroSlide, moveHeroSlide, toggleHeroSlide } from "@/app/admin/actions/content";
import { ActionButton } from "@/components/admin/admin-form";
import { HeroSlideForm, LogoForm } from "@/components/admin/branding-forms";
import { AdminPage, Panel, ReadOnlyNotice } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export const metadata = { title: "Homepage & branding" };

export default async function AdminBranding() {
  const user = await requireStaff();
  const editable = can(user, "site");
  const [logo, slides] = await Promise.all([
    db.siteSetting.findUnique({ where: { key: "brand.logoKey" } }),
    db.heroSlide.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);

  return (
    <AdminPage title="Homepage & branding" description="The site logo and the photos that slide behind the homepage headline.">
      {!editable && <ReadOnlyNotice />}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Panel title="Logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(logo?.value) ?? DEFAULT_LOGO} alt="Current logo" className="mb-4 h-16 w-auto" />
            {editable && <LogoForm current={logo?.value ?? ""} />}
          </Panel>
          {editable && (
            <Panel title="Add a hero photo">
              <HeroSlideForm />
            </Panel>
          )}
        </div>
        <Panel title={`Hero photos (${slides.filter((s) => s.active).length} showing)`}>
          <p className="mb-4 text-sm text-muted">
            Photos crossfade every few seconds under a dark green tint, so the headline stays readable. Landscape photos of at least
            1920 × 1080 px work best.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {slides.map((s, i) => {
              const src = s.imageUrl ?? fileUrl(s.imageKey);
              return (
                <li key={s.id} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
                  <div className="relative aspect-video bg-green-950">
                    {src && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={s.alt ?? ""} className="size-full object-cover opacity-60" loading="lazy" />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-r from-green-950/80 to-green-950/30" aria-hidden />
                    {!s.active && (
                      <span className="absolute top-2 left-2">
                        <Badge>hidden</Badge>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 p-2">
                    <span className="flex-1 truncate text-xs text-muted">{s.alt || "No description"}</span>
                    {editable && (
                      <>
                        <ActionButton action={moveHeroSlide.bind(null, s.id, -1)} variant="ghost" className={i === 0 ? "invisible" : ""}>
                          <ArrowUp className="size-4" aria-label="Earlier" />
                        </ActionButton>
                        <ActionButton action={moveHeroSlide.bind(null, s.id, 1)} variant="ghost" className={i === slides.length - 1 ? "invisible" : ""}>
                          <ArrowDown className="size-4" aria-label="Later" />
                        </ActionButton>
                        <ActionButton action={toggleHeroSlide.bind(null, s.id, !s.active)} variant="ghost">
                          {s.active ? "Hide" : "Show"}
                        </ActionButton>
                        <ActionButton action={deleteHeroSlide.bind(null, s.id)} variant="ghost" confirm="Delete this photo from the homepage?">
                          Delete
                        </ActionButton>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {slides.length === 0 && <p className="text-sm text-muted">No photos: the hero shows a plain dark green background.</p>}
        </Panel>
      </div>
    </AdminPage>
  );
}
