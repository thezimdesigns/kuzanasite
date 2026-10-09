import type { Metadata } from "next";
import { can, requireStaff, ROLE_LABELS } from "@/lib/permissions";
import { AdminNav, type NavItem } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | KUZANA Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireStaff({ moderatorOk: true });
  const items: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    {
      href: "/admin/capture",
      label: "Capture",
      icon: "capture",
      highlight: true,
    },
    {
      href: "/admin/events",
      label: "Events & sessions",
      icon: "events",
      editable: can(user, "programme"),
    },
    {
      href: "/admin/announcements",
      label: "Announcements",
      icon: "announcements",
      editable: can(user, "announcements"),
    },
    {
      href: "/admin/news",
      label: "News",
      icon: "news",
      editable: can(user, "press"),
    },
    {
      href: "/admin/coverage",
      label: "In the media",
      icon: "coverage",
      editable: can(user, "press"),
    },
    { href: "/admin/stats", label: "Daily figures", icon: "stats", editable: can(user, "press") },
    { href: "/admin/qa", label: "Conference Q&A", icon: "qa", editable: can(user, "qa") },
    {
      href: "/admin/exhibitors",
      label: "Exhibitors",
      icon: "exhibitors",
      editable: can(user, "exhibitors"),
    },
    {
      href: "/admin/enquiries",
      label: "Visitor enquiries",
      icon: "enquiries",
      editable: can(user, "exhibitors"),
      hidden: !can(user, "exhibitors"),
    },
    {
      href: "/admin/floor-plans",
      label: "Floor plans",
      icon: "floorplans",
      editable: can(user, "exhibitors"),
    },
    {
      href: "/admin/speakers",
      label: "Speakers",
      icon: "speakers",
      editable: can(user, "programme"),
    },
    {
      href: "/admin/venues",
      label: "Venues",
      icon: "venues",
      editable: can(user, "programme"),
    },
    {
      href: "/admin/galleries",
      label: "Galleries",
      icon: "galleries",
      editable: can(user, "media"),
    },
    {
      href: "/admin/videos",
      label: "Videos",
      icon: "videos",
      editable: can(user, "media"),
    },
    {
      href: "/admin/documents",
      label: "Documents & press",
      icon: "documents",
      editable: can(user, "press"),
    },
    {
      href: "/admin/feedback",
      label: "Feedback",
      icon: "feedback",
      editable: can(user, "feedback"),
    },
    { href: "/admin/ratings", label: "Ratings", icon: "ratings" },
    {
      href: "/admin/visitors",
      label: "Visitors",
      icon: "visitors",
      editable: can(user, "visitors"),
    },
    {
      href: "/admin/messages",
      label: "Messaging",
      icon: "messages",
      editable: can(user, "messages"),
    },
    {
      href: "/admin/partners",
      label: "Partners",
      icon: "partners",
      editable: can(user, "site"),
    },
    {
      href: "/admin/credits",
      label: "Service providers",
      icon: "credits",
      editable: can(user, "site"),
    },
    {
      href: "/admin/branding",
      label: "Homepage & branding",
      icon: "branding",
      editable: can(user, "site"),
    },
    {
      href: "/admin/pages",
      label: "Pages",
      icon: "pages",
      editable: can(user, "site"),
    },
    {
      href: "/admin/menu",
      label: "Menu",
      icon: "menu",
      editable: can(user, "site"),
    },
    {
      href: "/admin/footer",
      label: "Footer",
      icon: "footer",
      editable: can(user, "site"),
    },
    {
      href: "/admin/editions",
      label: "Editions",
      icon: "editions",
      editable: can(user, "site"),
    },
    { href: "/admin/qr", label: "QR codes", icon: "qr" },
    {
      href: "/admin/users",
      label: "Users",
      icon: "users",
      editable: can(user, "users"),
      hidden: !can(user, "users"),
    },
  ];

  return (
    <div className="min-h-dvh bg-cream lg:grid lg:grid-cols-[15rem_1fr]">
      <AdminNav
        items={user.role === "QA_MODERATOR" ? items.filter((i) => i.href === "/admin/qa") : items.filter((i) => !i.hidden)}
        user={{ name: user.name, role: ROLE_LABELS[user.role] }}
      />
      <main className="min-w-0 pb-16">{children}</main>
    </div>
  );
}
