import "server-only";
import { db } from "@/lib/db";

const planInclude = {
  venue: { select: { name: true, slug: true } },
  stalls: {
    include: {
      exhibitor: {
        select: {
          name: true,
          slug: true,
          status: true,
          category: { select: { name: true } },
        },
      },
    },
  },
} as const;

export function getFloorPlans() {
  return db.floorPlan.findMany({
    where: { publishStatus: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      venue: { select: { name: true } },
      _count: { select: { stalls: true } },
    },
  });
}

export async function getFloorPlan(slug: string) {
  const plan = await db.floorPlan.findFirst({
    where: { slug, publishStatus: "PUBLISHED" },
    include: planInclude,
  });
  if (!plan) return null;
  return {
    ...plan,
    stalls: plan.stalls.map((s) => ({
      id: s.id,
      label: s.label,
      x: s.x,
      y: s.y,
      // Only approved exhibitors are named publicly.
      exhibitor:
        s.exhibitor?.status === "APPROVED"
          ? {
              name: s.exhibitor.name,
              slug: s.exhibitor.slug,
              sector: s.exhibitor.category?.name ?? null,
            }
          : null,
    })),
  };
}

/** Where an exhibitor's stand is drawn, for "Find on floor plan" links. */
export async function findExhibitorStall(exhibitorId: string) {
  const stall = await db.floorPlanStall.findFirst({
    where: { exhibitorId, floorPlan: { publishStatus: "PUBLISHED" } },
    select: {
      id: true,
      label: true,
      floorPlan: { select: { slug: true, title: true } },
    },
  });
  return (
    stall && {
      href: `/floor-plan/${stall.floorPlan.slug}?stand=${stall.id}`,
      label: stall.label,
      plan: stall.floorPlan.title,
    }
  );
}
