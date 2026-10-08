import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-orange-dark text-white hover:bg-orange-deeper",
  secondary: "bg-green-900 text-white hover:bg-green-800",
  outline: "border border-green-900/40 bg-white text-green-900 hover:border-green-900 hover:bg-green-100",
  ghost: "text-green-900 hover:bg-green-100",
  danger: "bg-danger text-white hover:opacity-90",
};

export function buttonClass(variant: Variant = "primary", size: "sm" | "md" | "lg" = "md") {
  return cn(
    "group/btn inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-heading font-semibold whitespace-nowrap",
    "transition-[background-color,border-color,color,transform] duration-200 ease-[var(--ease-out-expo)] active:scale-[0.98]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-dark disabled:pointer-events-none disabled:opacity-60",
    size === "sm" && "px-3.5 py-1.5 text-sm",
    size === "md" && "px-5 py-2.5 text-[0.95rem]",
    size === "lg" && "px-6 py-3.5 text-base",
    variants[variant],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}) {
  return <button className={cn(buttonClass(variant, size), className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}) {
  return <Link className={cn(buttonClass(variant, size), className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-[var(--radius-card)] border border-line bg-white", className)} {...props} />;
}

type Tone = "neutral" | "green" | "orange" | "red" | "gold";
const tones: Record<Tone, string> = {
  neutral: "bg-cream-dark text-muted",
  green: "bg-green-100 text-green-900",
  orange: "bg-orange-50 text-orange-deeper",
  red: "bg-danger-50 text-danger",
  gold: "bg-[#f8efd6] text-[#8a6a14]",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="group/back mb-3 inline-flex items-center gap-1 text-sm font-semibold text-green-800 hover:text-green-900">
      <ChevronLeft className="size-4 transition-transform duration-200 group-hover/back:-translate-x-0.5" aria-hidden />
      {label}
    </Link>
  );
}

export function PageHeader({
  title,
  intro,
  back,
  children,
}: {
  title: ReactNode;
  intro?: ReactNode;
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-ivory-pattern">
      <div className="mx-auto max-w-6xl px-4 pt-7 pb-8 sm:px-6 sm:pt-10 sm:pb-12">
        {back && <BackLink {...back} />}
        <h1 className="text-[2rem] leading-[1.05] font-extrabold tracking-[-0.025em] text-balance text-green-900 sm:text-5xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-pretty text-muted sm:text-lg">{intro}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  );
}

export function Section({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10", className)} {...props} />;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-xl font-extrabold text-green-900 sm:text-2xl">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-white/60 px-5 py-10 text-center text-muted">{children}</div>;
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------

const inputBase =
  "w-full rounded-[var(--radius-control)] border border-line bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-[#767676] " +
  "transition-[border-color,box-shadow] duration-150 focus:border-green-800 focus:outline-none focus:ring-3 focus:ring-green-100";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="text-orange"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-semibold text-danger">{error}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputBase, "min-h-24", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(inputBase, "appearance-auto", className)} {...props} />;
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm", className)}>
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-green-900" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Alert({ tone = "green", children }: { tone?: "green" | "red" | "orange"; children: ReactNode }) {
  const styles = {
    green: "border-green-800/30 bg-green-100 text-green-900",
    red: "border-danger/30 bg-danger-50 text-danger",
    orange: "border-orange/30 bg-orange-50 text-orange-dark",
  }[tone];
  return <div className={cn("rounded-[var(--radius-control)] border px-4 py-3 text-sm", styles)}>{children}</div>;
}
