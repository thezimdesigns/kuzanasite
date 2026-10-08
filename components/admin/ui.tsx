import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import type { PublishStatus } from "@/lib/generated/prisma/enums";
import { Badge, cn } from "@/components/ui";

export function AdminPage({
  title,
  back,
  actions,
  children,
  description,
}: {
  title: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-green-800">
          <ChevronLeft className="size-4" /> {back.label}
        </Link>
      )}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-green-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: ReactNode; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-[var(--radius-card)] border border-line bg-white p-4 sm:p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-heading text-lg font-bold text-green-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white", className)}>
      <table className="w-full text-left text-sm [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2.5 [&_th]:font-semibold [&_th]:whitespace-nowrap [&_thead]:bg-cream-dark [&_tr]:border-b [&_tr]:border-line [&_tbody_tr:last-child]:border-0">
        {children}
      </table>
    </div>
  );
}

export function RowLink({ className, ...props }: ComponentProps<typeof Link>) {
  return <Link className={cn("font-semibold text-green-900 hover:underline", className)} {...props} />;
}

export function PublishBadge({ status }: { status: PublishStatus }) {
  return <Badge tone={status === "PUBLISHED" ? "green" : status === "DRAFT" ? "gold" : "neutral"}>{status.toLowerCase()}</Badge>;
}

export function Tabs({ tabs, current }: { tabs: { href: string; label: string; count?: number; value: string }[]; current: string }) {
  return (
    <nav className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <Link
          key={t.value}
          href={t.href}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap",
            current === t.value ? "border-orange text-green-900" : "border-transparent text-muted hover:text-ink",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-cream-dark px-1.5 text-xs">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function ReadOnlyNotice() {
  return <p className="mb-4 rounded-lg bg-cream-dark px-3 py-2 text-sm text-muted">You have read-only access to this section.</p>;
}
