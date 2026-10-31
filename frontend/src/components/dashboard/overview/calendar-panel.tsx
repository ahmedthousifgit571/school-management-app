"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck, Download } from "lucide-react";

import {
  WEEKDAYS,
  cursorFrom,
  downloadICS,
  eventsOn,
  monthCells,
  shiftMonth,
  visibleEvents,
} from "@/components/calendar/calendar-utils";
import { EventDrawer } from "@/components/calendar/event-drawer";
import { buttonClass, iconButtonClass } from "@/components/dashboard/controls";
import { Sparkle } from "@/components/dashboard/doodles";
import { toneStyles } from "@/components/dashboard/tone";
import { formatDate, formatMonth, formatTime, parseISO } from "@/lib/format";
import { TODAY_ISO, eventTone } from "@/lib/mock-data";
import { canManage } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";
import { eventsStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

export function CalendarPanel({ user }: { user: SessionUser }) {
  const events = visibleEvents(eventsStore.useStore(), user);
  const canAddEvents = canManage(user.role);
  const [cursor, setCursor] = useState(() => cursorFrom(TODAY_ISO));
  const [selected, setSelected] = useState(TODAY_ISO);
  const [adding, setAdding] = useState(false);

  const monthLabel = formatMonth(new Date(cursor.year, cursor.month, 1));
  const selectedEvents = eventsOn(events, selected);
  const datesWithEvents = new Set(events.map((event) => event.date));

  function jumpToToday() {
    setCursor(cursorFrom(TODAY_ISO));
    setSelected(TODAY_ISO);
  }

  function exportMonth() {
    const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
    const monthEvents = events.filter((event) => event.date.startsWith(prefix));
    downloadICS(`school-calendar-${prefix}.ics`, monthEvents);
    toast(`Exported ${monthEvents.length} events for ${monthLabel}`);
  }

  return (
    <aside
      aria-label="Calendar and timeline"
      className="flex min-w-0 flex-col gap-5 rounded-[32px] border-[1.5px] border-black/10 bg-black/[0.06] p-4 sm:p-5"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor((value) => shiftMonth(value, -1))}
            className={cn(iconButtonClass(), "size-10 bg-transparent")}
          >
            <ArrowLeft aria-hidden />
          </button>
          <h2 aria-live="polite" className="rounded-full bg-pastel-pink px-4 py-1 text-sm font-semibold">
            {monthLabel}
          </h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor((value) => shiftMonth(value, 1))}
            className={cn(iconButtonClass(), "size-10 bg-transparent")}
          >
            <ArrowRight aria-hidden />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAYS.map((day) => (
            <span key={day} className="pb-1 text-[11px] font-semibold text-muted-foreground">
              {day.slice(0, 2).toUpperCase()}
            </span>
          ))}
          {monthCells(cursor).map((iso, index) =>
            iso ? (
              <div key={iso} className="flex justify-center">
                <button
                  type="button"
                  aria-pressed={iso === selected}
                  aria-current={iso === TODAY_ISO ? "date" : undefined}
                  aria-label={`${formatDate(iso, { day: "numeric", month: "long" })}${
                    datesWithEvents.has(iso) ? ", has events" : ""
                  }`}
                  onClick={() => setSelected(iso)}
                  className={cn(
                    "flex size-9 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-transparent text-sm tabular-nums transition-colors duration-200 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink",
                    datesWithEvents.has(iso) && "bg-black/[0.08]",
                    iso === TODAY_ISO && "border-ink font-semibold",
                    iso === selected && "border-ink bg-pastel-pink font-semibold"
                  )}
                >
                  {parseISO(iso).getDate()}
                </button>
              </div>
            ) : (
              <span key={`blank-${index}`} aria-hidden />
            )
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {canAddEvents && (
            <button type="button" onClick={() => setAdding(true)} className={cn(buttonClass("dark"), "flex-1")}>
              Add event
            </button>
          )}
          <button type="button" onClick={jumpToToday} aria-label="Jump to today" title="Jump to today" className={iconButtonClass("outline")}>
            <CalendarCheck aria-hidden />
          </button>
          <button type="button" onClick={exportMonth} aria-label="Export this month" title="Export this month" className={iconButtonClass("outline")}>
            <Download aria-hidden />
          </button>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-heading text-2xl font-medium tracking-tight">Timeline</h2>
          <span className="font-hand text-lg text-ink/75">
            {selected === TODAY_ISO ? "today" : formatDate(selected)}
          </span>
        </div>

        {selectedEvents.length === 0 ? (
          <div className="mt-3 flex items-center gap-3 rounded-3xl bg-white p-4 text-sm text-muted-foreground">
            <Sparkle className="size-6 text-pastel-yellow" />
            Nothing planned for this day.
          </div>
        ) : (
          <ol className="relative mt-3 space-y-2.5">
            <span aria-hidden className="absolute bottom-6 left-[7px] top-6 w-[1.5px] bg-ink/20" />
            {selectedEvents.map((event) => (
              <li key={event.id} className="relative flex items-center gap-3">
                <span
                  aria-hidden
                  className={cn(
                    "relative size-4 shrink-0 rounded-full border-[1.5px] border-ink",
                    toneStyles[eventTone(event.category)].solid
                  )}
                />
                <div className="min-w-0 flex-1 rounded-[20px] bg-white px-4 py-2.5">
                  <p className="text-sm font-semibold tabular-nums">{formatTime(event.time)}</p>
                  <p className="text-sm leading-snug">{event.title}</p>
                  {event.location && <p className="truncate text-xs text-muted-foreground">{event.location}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {canAddEvents && <EventDrawer open={adding} onOpenChange={setAdding} defaultDate={selected} actor={user.name} />}
    </aside>
  );
}
