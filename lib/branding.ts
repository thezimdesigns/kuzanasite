import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { fileUrl } from "@/lib/files";

export const DEFAULT_LOGO = "/brand/kuzana-sceez.png";

/** Site logo (Admin → Homepage & branding) and the active hero slides. */
export const getBranding = cache(async () => {
  const [logo, slides] = await Promise.all([
    db.siteSetting.findUnique({ where: { key: "brand.logoKey" } }),
    db.heroSlide.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  return {
    logoUrl: (logo?.value && fileUrl(logo.value)) || DEFAULT_LOGO,
    slides: slides
      .map((s) => ({
        id: s.id,
        src: s.imageUrl ?? fileUrl(s.imageKey),
        alt: s.alt ?? "",
      }))
      .filter((s): s is { id: string; src: string; alt: string } => !!s.src),
  };
});
