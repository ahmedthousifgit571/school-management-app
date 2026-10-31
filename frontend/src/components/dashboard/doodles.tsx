import { cn } from "@/lib/utils";

// Hand-drawn stickers. Decorative only (aria-hidden) and always outlined with
// the 1.5px ink stroke; non-scaling-stroke keeps it 1.5px at any size.

type DoodleProps = { className?: string; fill?: string; outlined?: boolean };

function Doodle({
  className,
  fill,
  outlined = true,
  viewBox = "0 0 24 24",
  d,
}: DoodleProps & { viewBox?: string; d: string }) {
  return (
    <svg
      aria-hidden
      viewBox={viewBox}
      className={cn("pointer-events-none shrink-0 overflow-visible", className)}
    >
      <path
        d={d}
        fill={fill ?? "currentColor"}
        stroke={outlined ? "var(--ink)" : "none"}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

const STAR =
  "M12 2.6l2.8 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.8 3.3 1.3-6.6-4.9-4.6 6.6-.8z";
const HEART =
  "M12 20.6s-7.6-4.6-9.2-9.4C1.7 7.9 3.7 4.8 7 4.8c2 0 3.6 1 5 3 1.4-2 3-3 5-3 3.3 0 5.3 3.1 4.2 6.4-1.6 4.8-9.2 9.4-9.2 9.4z";
const SPARKLE = "M12 2c.9 5.8 3.9 8.9 10 10-6.1 1.1-9.1 4.2-10 10-.9-5.8-3.9-8.9-10-10 6.1-1.1 9.1-4.2 10-10z";
const BLOB =
  "M12.6 2.2c3.4-.4 7 1.3 8.4 4.6 1.3 3-.4 5.3-.2 8.1.2 2.7-1.9 5.6-5 6.5-3.3 1-6 .3-8.7-1.4C4.300 18.300 1.900 15.600 2.300 12.100c.3-2.700 2-3.900 3.200-6 1.400-2.300 3.900-3.600 7.100-3.900z";
const PLUS =
  "M8.700 2.800c2-1.200 4.600-1.100 6.500.1 1.300.8 1.200 3.300 2.300 4.200 1.300 1 3.800.500 4.500 2.100.800 2 .700 4.400-.5 6.100-.9 1.300-3.400.900-4.400 2-1 1.200-.700 3.600-2.200 4.300-2 .900-4.500.800-6.300-.4-1.300-.9-1-3.300-2.100-4.300-1.100-1-3.600-.800-4.300-2.200-.9-1.900-.800-4.400.3-6.200.8-1.300 3.300-.800 4.300-1.900 1-1.100.600-3 1.900-3.800z";

export function Star(props: DoodleProps) {
  return <Doodle {...props} d={STAR} />;
}

export function Heart(props: DoodleProps) {
  return <Doodle {...props} d={HEART} />;
}

export function Sparkle(props: DoodleProps) {
  return <Doodle {...props} d={SPARKLE} />;
}

export function Blob(props: DoodleProps) {
  return <Doodle {...props} d={BLOB} />;
}

export function PlusBlob(props: DoodleProps) {
  return <Doodle {...props} d={PLUS} />;
}

function burstPath(points: number, outer: number, inner: number) {
  const vertices = Array.from({ length: points * 2 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    return `${(12 + radius * Math.cos(angle)).toFixed(2)} ${(12 + radius * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${vertices.join("L")}z`;
}

const BURST_8 = burstPath(8, 11, 6.2);

/** The 8-pointed star from the Assessments card. */
export function Burst(props: DoodleProps) {
  return <Doodle {...props} d={BURST_8} />;
}

/** Hand-drawn underline, sized to its container. */
export function Squiggle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className={cn("pointer-events-none overflow-visible", className)}
    >
      <path
        d="M2 8c20-7 32-7 50-2s30 5 48 0 32-5 50 0 28 4 48-2"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
