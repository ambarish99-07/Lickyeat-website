import { rupees } from "@/lib/format";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "good" | "warn" | "bad";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink/8 text-charcoal",
    brand: "bg-brand text-brand-ink",
    good: "bg-emerald-100 text-emerald-800",
    warn: "bg-amber-100 text-amber-800",
    bad: "bg-rose-100 text-rose-800",
  };
  return <span className={cn("chip", tones[tone], className)}>{children}</span>;
}

export function Price({
  value,
  original,
  className,
}: {
  value: number;
  original?: number;
  className?: string;
}) {
  return (
    <span className={cn("whitespace-nowrap font-semibold", className)}>
      {original != null && original > value && (
        <span className="mr-1.5 font-normal text-muted line-through">{rupees(original)}</span>
      )}
      {rupees(value)}
    </span>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-8 w-8 text-base" : "h-10 w-10 text-lg";
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-surface p-1">
      <button
        type="button"
        aria-label="Decrease"
        className={cn(dim, "grid place-items-center rounded-full hover:bg-ink/5")}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="w-6 text-center text-sm font-bold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase"
        className={cn(dim, "grid place-items-center rounded-full hover:bg-ink/5")}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-ink/[0.06]", className)} />;
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      {children && <p className="max-w-sm text-sm text-muted">{children}</p>}
      {action}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="text-2xl font-extrabold sm:text-[28px]">{title}</h2>
      </div>
      {children}
    </div>
  );
}
