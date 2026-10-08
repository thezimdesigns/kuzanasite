import Link from "next/link";
import { Camera, FileUp, ImagePlus, Megaphone, Mic2, Plus, Video } from "lucide-react";
import { can, requireStaff } from "@/lib/permissions";
import { AdminPage } from "@/components/admin/ui";

export const metadata = { title: "Capture" };

export default async function CapturePage() {
  const user = await requireStaff();
  const actions = [
    {
      href: "/admin/capture/exhibitor",
      label: "Capture exhibitor",
      icon: Camera,
      ok: can(user, "exhibitors"),
    },
    {
      href: "/admin/announcements",
      label: "Post announcement",
      icon: Megaphone,
      ok: can(user, "announcements"),
    },
    {
      href: "/admin/events/new",
      label: "Capture programme item",
      icon: Plus,
      ok: can(user, "programme"),
    },
    {
      href: "/admin/speakers/new",
      label: "Capture speaker",
      icon: Mic2,
      ok: can(user, "programme"),
    },
    {
      href: "/admin/galleries",
      label: "Upload photographs",
      icon: ImagePlus,
      ok: can(user, "media"),
    },
    {
      href: "/admin/videos",
      label: "Add video link",
      icon: Video,
      ok: can(user, "media"),
    },
    {
      href: "/admin/documents/new",
      label: "Upload document",
      icon: FileUp,
      ok: can(user, "press"),
    },
  ].filter((a) => a.ok);

  return (
    <AdminPage title="Event capture centre" description="Record it before it's lost. Everything can be completed later.">
      {actions.length === 0 ? (
        <p className="text-muted">Your role has read-only access.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 rounded-[var(--radius-card)] bg-green-900 p-5 font-heading text-lg font-bold text-white hover:bg-green-800"
            >
              <span className="rounded-full bg-white/10 p-3">
                <Icon className="size-7 text-gold-light" />
              </span>
              {label}
            </Link>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
