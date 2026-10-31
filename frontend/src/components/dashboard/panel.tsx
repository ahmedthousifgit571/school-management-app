import { cn } from "@/lib/utils";
import { Heart, Sparkle, Star } from "@/components/dashboard/doodles";

/** The outline every organic card shares. */
export const cardOutline = "rounded-[32px] border-[1.5px] border-black/10";

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col bg-card", cardOutline, className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-medium tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      <div className={cn("flex-1 p-5 md:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="relative">
        {eyebrow && (
          <p className="-mb-0.5 inline-block -rotate-1 font-hand text-2xl font-semibold leading-tight text-ink/80">
            {eyebrow}
          </p>
        )}
        <h1 className="flex items-center gap-3 font-heading text-4xl font-medium tracking-tight md:text-5xl">
          {title}
          <Star className="size-7 text-pastel-yellow motion-safe:animate-float md:size-8" />
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 print:hidden">{actions}</div>}
    </div>
  );
}

const CORNER_DOODLES = {
  star: <Star className="absolute right-3 top-3 size-7 rotate-12 text-white/80" />,
  heart: <Heart className="absolute right-3 top-3 size-6 -rotate-12 text-white/80" />,
  sparkle: <Sparkle className="absolute right-3 top-3 size-7 text-white/80" />,
};

/** Pastel sticker with one big figure; the module pages open with a row of these. */
export function StatCard({
  label,
  value,
  hint,
  fill,
  doodle = "sparkle",
}: {
  label: string;
  value: string;
  hint: string;
  /** toneStyles[...].fill */
  fill: string;
  doodle?: keyof typeof CORNER_DOODLES;
}) {
  return (
    <article className={cn("relative overflow-hidden p-5", cardOutline, fill)}>
      {CORNER_DOODLES[doodle]}
      <p className="font-heading text-base font-medium">{label}:</p>
      <p className="mt-2 font-heading text-4xl font-medium tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-ink/75">{hint}</p>
    </article>
  );
}

export function StatRow({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <section aria-label={label} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </section>
  );
}
