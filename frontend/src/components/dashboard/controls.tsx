"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Heart } from "@/components/dashboard/doodles";
import { toneStyles, type Tone } from "@/components/dashboard/tone";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const BUTTON_VARIANTS = {
  dark: "bg-ink text-white hover:bg-ink/80",
  outline: "border-[1.5px] border-ink text-ink hover:bg-ink hover:text-white",
  soft: "bg-black/[0.06] text-ink hover:bg-black/[0.12]",
  danger: "border-[1.5px] border-destructive text-destructive hover:bg-destructive hover:text-white",
};

const BUTTON_SIZES = {
  md: "h-11 gap-2 px-5 text-sm [&_svg]:size-4",
  sm: "h-9 gap-1.5 px-3.5 text-xs [&_svg]:size-3.5",
};

/** Pill button styles, for <button> and <Link> alike. */
export function buttonClass(
  variant: keyof typeof BUTTON_VARIANTS = "dark",
  size: keyof typeof BUTTON_SIZES = "md"
) {
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    focusRing
  );
}

/** Round icon-only button; `label` is required for screen readers. */
export function iconButtonClass(variant: "dark" | "soft" | "outline" = "soft") {
  return cn(
    "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 active:scale-[0.96] [&_svg]:size-5",
    BUTTON_VARIANTS[variant],
    focusRing
  );
}

export function Pill({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
        tone ? toneStyles[tone].fill : "bg-black/[0.06] text-ink",
        className
      )}
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(inputClass, "w-full pl-10")}
      />
    </div>
  );
}

export const inputClass =
  "h-11 rounded-full border-[1.5px] border-black/10 bg-white px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ink";

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">
        {label}
        {required && (
          <span className="text-destructive" aria-hidden>
            {" "}
            *
          </span>
        )}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input {...props} className={cn(inputClass, "w-full", className)} />;
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-3xl border-[1.5px] border-black/10 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ink",
        className
      )}
    />
  );
}

export function SelectInput({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select {...props} className={cn(inputClass, "cursor-pointer pr-8", className)}>
      {children}
    </select>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border-[1.5px] border-black/10 bg-white p-1 [scrollbar-width:none]",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors duration-200",
              focusRing,
              active ? "bg-ink text-white" : "text-ink/75 hover:bg-black/[0.06] hover:text-ink"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn("tabular-nums", active ? "text-white/75" : "text-ink/60")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <Heart className="size-9 text-pastel-pink" />
      <p className="mt-1 font-heading text-lg font-medium">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const first = total === 0 ? 0 : page * pageSize + 1;
  const last = Math.min(total, (page + 1) * pageSize);
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-4">
      <p className="text-sm tabular-nums text-muted-foreground">
        {first}–{last} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          className={cn(iconButtonClass(), "disabled:pointer-events-none disabled:opacity-40")}
        >
          <ChevronLeft aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= pageCount - 1}
          onClick={() => onChange(page + 1)}
          className={cn(iconButtonClass(), "disabled:pointer-events-none disabled:opacity-40")}
        >
          <ChevronRight aria-hidden />
        </button>
      </div>
    </nav>
  );
}

export function usePage<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  return {
    visible: items.slice(safePage * pageSize, (safePage + 1) * pageSize),
    page: safePage,
    pageCount,
  };
}

export function ProgressBar({
  value,
  label,
  className,
  barClassName,
}: {
  value: number;
  label: string;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2.5 overflow-hidden rounded-full bg-black/10", className)}
    >
      <div
        className={cn("h-full rounded-full bg-ink transition-[width] duration-300", barClassName)}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

/** Right-hand drawer with the organic outline and a roomy header. */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  printable,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Marks the drawer as what window.print() should output. */
  printable?: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        data-print-root={printable ? true : undefined}
        className="gap-0 overflow-hidden rounded-l-[32px] border-l-[1.5px] border-black/10 bg-canvas data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        <SheetHeader className="flex-row items-start justify-between gap-3 p-6 pb-3">
          <div className="min-w-0">
            <SheetTitle className="font-heading text-2xl font-medium tracking-tight">{title}</SheetTitle>
            {description && <SheetDescription className="mt-0.5">{description}</SheetDescription>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className={cn(iconButtonClass(), "print:hidden")}
          >
            <X aria-hidden />
          </button>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-1">{children}</div>
        {footer && <div className="flex flex-wrap gap-2 border-t-[1.5px] border-black/10 p-4 px-6 print:hidden">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}

/** A Drawer holding a form: Cancel + submit in the footer. */
export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  onSubmit: (data: FormData) => void;
  children: React.ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(new FormData(event.currentTarget));
        }}
      >
        {children}
        <div className="flex gap-2 pt-2">
          <button type="submit" className={cn(buttonClass("dark"), "flex-1")}>
            {submitLabel}
          </button>
          <button type="button" onClick={() => onOpenChange(false)} className={buttonClass("soft")}>
            Cancel
          </button>
        </div>
      </form>
    </Drawer>
  );
}

/** Search + select row in a panel header; wraps rather than overflowing beside the sidebar. */
export const filterRowClass = "flex w-full max-w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap";

export const tableClass = "w-full text-sm";
export const thClass = "px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground";
export const tdClass = "px-3 py-3 align-middle";
export const rowClass = "border-t-[1.5px] border-black/[0.06] transition-colors hover:bg-black/[0.03]";
