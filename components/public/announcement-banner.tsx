import Link from "next/link";
import { AlertTriangle, Megaphone } from "lucide-react";
import { db } from "@/lib/db";

/** Site-wide strip showing the most recent IMPORTANT or URGENT announcement. */
export async function AnnouncementBanner() {
  const a = await db.announcement.findFirst({
    where: {
      publishStatus: "PUBLISHED",
      priority: { in: ["IMPORTANT", "URGENT"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
  if (!a) return null;
  const urgent = a.priority === "URGENT";
  const Icon = urgent ? AlertTriangle : Megaphone;
  return (
    <div role={urgent ? "alert" : "status"} className={urgent ? "bg-danger text-white" : "bg-gold text-ink"}>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 text-sm sm:px-6">
        <Icon className="size-5 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1">
          <strong className="font-heading">{a.title}</strong>
          {a.body && <span className="hidden sm:inline">: {a.body}</span>}
        </p>
        <Link href="/live#announcements" className="shrink-0 font-semibold underline underline-offset-2">
          Details
        </Link>
      </div>
    </div>
  );
}
