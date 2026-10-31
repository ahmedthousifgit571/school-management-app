import { cn } from "@/lib/utils";
import { initials } from "@/lib/session";
import { toneFor, toneStyles, type Tone } from "@/components/dashboard/tone";

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-20 text-2xl",
};

export function UserAvatar({
  name,
  tone,
  size = "md",
  className,
}: {
  name: string;
  tone?: Tone;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full border-[1.5px] border-ink font-heading font-semibold",
        toneStyles[tone ?? toneFor(name)].fill,
        SIZES[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
