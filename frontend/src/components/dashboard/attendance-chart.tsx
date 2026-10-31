import type { AttendancePoint } from "@/lib/mock-data";

const SERIES = [
  { key: "present", label: "Present", bar: "bg-status-good" },
  { key: "late", label: "Late", bar: "bg-status-warn" },
  { key: "absent", label: "Absent", bar: "bg-status-bad" },
] as const;

/** 100%-stacked columns: each column is one day/week split into present / late / absent. */
export function AttendanceChart({ points }: { points: AttendancePoint[] }) {
  const average =
    Math.round((points.reduce((sum, p) => sum + p.present + p.late, 0) / points.length) * 10) / 10;
  const summary = points
    .map((p) => `${p.label}: ${p.present}% present, ${p.late}% late, ${p.absent}% absent`)
    .join("; ");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-heading text-4xl font-medium tracking-tight tabular-nums">{average}%</p>
          <p className="text-sm text-muted-foreground">Average attendance (present + late)</p>
        </div>
        <ul className="flex flex-wrap gap-4 text-sm" aria-label="Legend">
          {SERIES.map((s) => (
            <li key={s.key} className="flex items-center gap-2 text-muted-foreground">
              <span className={`size-2.5 rounded-full ${s.bar}`} aria-hidden />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      <div
        role="img"
        aria-label={`Attendance breakdown. ${summary}`}
        className="relative grid flex-1 gap-3 sm:gap-5"
        style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
      >
        {points.map((p) => (
          <div key={p.label} className="flex h-full min-w-0 flex-col items-center gap-2">
            <span className="text-xs font-semibold tabular-nums text-foreground">{p.present}%</span>
            <div
              className="flex min-h-44 w-full max-w-10 flex-1 flex-col-reverse gap-0.5 overflow-hidden rounded-full"
              title={`${p.label}: ${p.present}% present, ${p.late}% late, ${p.absent}% absent`}
            >
              {SERIES.map((s) =>
                p[s.key] > 0 ? <div key={s.key} className={s.bar} style={{ height: `${p[s.key]}%` }} /> : null
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
