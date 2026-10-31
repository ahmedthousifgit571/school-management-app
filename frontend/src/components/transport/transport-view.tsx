"use client";

import { useState } from "react";
import { AlertTriangle, BellRing, BusFront, CheckCircle2, Phone } from "lucide-react";

import { Pill, ProgressBar, buttonClass } from "@/components/dashboard/controls";
import { PageHeader, Panel, StatCard, StatRow, cardOutline } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { formatTime } from "@/lib/format";
import { classById, routes, studentById } from "@/lib/mock-data";
import { isOffice } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";
import { logActivity, studentsStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

const MAX_RIDERS_SHOWN = 8;

export function TransportView({ user }: { user: SessionUser }) {
  const students = studentsStore.useStore();
  const myRouteId = user.studentId ? studentById(user.studentId, students).routeId : null;
  const [selectedId, setSelectedId] = useState(myRouteId ?? routes[2]!.id);

  const selected = routes.find((route) => route.id === selectedId)!;
  const ridersOn = (routeId: string) => students.filter((student) => student.routeId === routeId);
  const riders = ridersOn(selected.id);
  const totalRiders = routes.reduce((sum, route) => sum + ridersOn(route.id).length, 0);
  const capacity = routes.reduce((sum, route) => sum + route.capacity, 0);
  const delayed = routes.filter((route) => route.delayMinutes > 0);

  function notifyParents() {
    logActivity({ actor: user.name, text: `told ${riders.length} families about ${selected.name}`, kind: "notice", tone: "blue" });
    toast(`Update sent to ${riders.length} families on ${selected.name}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Morning run"
        title="Transport"
        description={user.studentId ? "Bus routes, stop times and who to call." : "Routes, drivers, riders, and how this morning's run is going."}
      />

      <StatRow label="Transport summary">
        <StatCard label="Routes" value={String(routes.length)} hint="running today" fill={toneStyles.yellow.fill} doodle="star" />
        <StatCard label="Riders" value={String(totalRiders)} hint="students on buses" fill={toneStyles.blue.fill} />
        <StatCard label="Delayed" value={String(delayed.length)} hint={delayed[0] ? `${delayed[0].name} is the latest` : "All on time"} fill={toneStyles.peach.fill} doodle="heart" />
        <StatCard label="Seats filled" value={`${Math.round((totalRiders / capacity) * 100)}%`} hint={`${capacity - totalRiders} seats free`} fill={toneStyles.green.fill} />
      </StatRow>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section aria-label="Routes" className="min-w-0">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {routes.map((route) => {
              const active = route.id === selectedId;
              const late = route.delayMinutes > 0;
              return (
                <li key={route.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedId(route.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 bg-white p-3 text-left transition-colors duration-200 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                      cardOutline,
                      "rounded-[28px]",
                      active && "border-ink"
                    )}
                  >
                    <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink", toneStyles[route.tone].fill)}>
                      <BusFront className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{route.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {route.id.toUpperCase()} · {ridersOn(route.id).length} riders
                      </span>
                    </span>
                    {route.id === myRouteId ? (
                      <Pill tone="pink">Your bus</Pill>
                    ) : late ? (
                      <Pill tone="peach" icon={AlertTriangle}>{route.delayMinutes} min</Pill>
                    ) : (
                      <Pill tone="green" icon={CheckCircle2}>On time</Pill>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <Panel
          title={selected.name}
          description={`${selected.bus} · ${selected.driver}`}
          action={
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${selected.phone.replaceAll(" ", "")}`} className={buttonClass("outline", "sm")}>
                <Phone aria-hidden /> Call driver
              </a>
              {isOffice(user.role) && (
                <button type="button" onClick={notifyParents} className={buttonClass("dark", "sm")}>
                  <BellRing aria-hidden /> Notify parents
                </button>
              )}
            </div>
          }
        >
          {selected.delayMinutes > 0 && (
            <p className="mb-4 flex items-center gap-2 rounded-3xl bg-pastel-peach/50 px-4 py-3 text-sm font-medium">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              Running {selected.delayMinutes} minutes behind this morning.
            </p>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <section>
              <h3 className="font-heading text-lg font-medium">Stops</h3>
              <ol className="relative mt-3 space-y-3">
                <span aria-hidden className="absolute bottom-3 left-[7px] top-3 w-[1.5px] bg-ink/20" />
                {selected.stops.map((stop) => (
                  <li key={stop.name} className="relative flex items-center gap-3">
                    <span aria-hidden className={cn("relative size-4 shrink-0 rounded-full border-[1.5px] border-ink", toneStyles[selected.tone].solid)} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{stop.name}</span>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">{formatTime(stop.time)}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h3 className="font-heading text-lg font-medium">Seats</h3>
              <div className="mt-2 flex items-center gap-3">
                <ProgressBar value={(riders.length / selected.capacity) * 100} label={`${selected.name} seats filled`} className="flex-1" />
                <span className="text-sm font-semibold tabular-nums">{riders.length}/{selected.capacity}</span>
              </div>

              {!user.studentId && (
                <>
                  <h3 className="mt-4 font-heading text-lg font-medium">Riders</h3>
                  <ul className="mt-2 space-y-1.5">
                    {riders.slice(0, MAX_RIDERS_SHOWN).map((student) => (
                      <li key={student.id} className="flex items-center gap-2 text-sm">
                        <UserAvatar name={student.name} size="sm" />
                        <span className="min-w-0 flex-1 truncate">{student.name}</span>
                        <span className="text-xs text-muted-foreground">{classById(student.classId).short}</span>
                      </li>
                    ))}
                  </ul>
                  {riders.length > MAX_RIDERS_SHOWN && (
                    <p className="mt-2 text-xs text-muted-foreground">and {riders.length - MAX_RIDERS_SHOWN} more</p>
                  )}
                </>
              )}
            </section>
          </div>
        </Panel>
      </div>
    </>
  );
}
