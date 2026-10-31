import { cn } from "@/lib/utils";

/** The stacked school name. Set its size with a text-* class; the second line scales with it. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("block font-logo leading-tight", className)}>
      MGM{" "}
      {/* mt clears the descender of the G above. */}
      <span className="mt-[0.45em] block text-[0.5em]">school management</span>
    </span>
  );
}
