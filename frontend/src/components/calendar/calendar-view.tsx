"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck, CalendarPlus, Download, MapPin } from "lucide-react";

import {
  WEEKDAYS,
  cursorFrom,
  downloadICS,
  eventsOn,
  monthCells,
  shiftMonth,
  visibleCategories,
  visibleEvents,
} from "@/components/calendar/calendar-utils";
import { EventDrawer } from "@/components/calendar/event-drawer";
import { EmptyState, buttonClass, iconButtonClass } from "@/components/dashboard/controls";
import { PageHeader, Panel, cardOutline } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { formatDate, formatMonth, formatTime, parseISO } from "@/lib/format";
import { TODAY_ISO, eventTone, type EventCategory } from "@/lib/mock-data";
import { canManage } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";
import { eventsStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

const MAX_CHIPS_PER_DAY = 2;

export function CalendarView({ user }: { user: SessionUser }) {
  const events = visibleEvents(eventsStore.useStore(), user);
  const [cursor, setCursor] = useState(() => cursorFrom(TODAY_ISO));
  const [selected, setSelected] = useState(TODAY_ISO);
  const [hidden, setHidden] = useState<EventCategory[]>([]);
  const [adding, setAdding] = useState(false);

  const monthLabel = formatMonth(new Date(cursor.year, cursor.month, 1));
  const shown = events.filter((event) => !hidden.includes(event.category));
  const agenda = eventsOn(shown, selected);

  function toggleCategory(category: EventCategory) {
    setHidden((list) => (list.includes(category) ? list.filter((item) => item !== category) : [...list, category]));
  }

  function exportMonth() {
    const prefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
    const monthEvents = shown.filter((event) => event.date.startsWith(prefix));
    downloadICS(`school-calendar-${prefix}.ics`, monthEvents);
    toast(`Exported ${monthEvents.length} events for ${monthLabel}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="The school year"
        title="Calendar"
        description="Exams, meetings, activities, parent events and holidays in one place."
        actions={
          <>
            <button type="button" onClick={exportMonth} className={buttonClass("outline")}>
              <Download aria-hidden /> Export month
            </button>
            {canManage(user.role) && (
              <button type="button" onClick={() => setAdding(true)} className={buttonClass("dark")}>
                <CalendarPlus aria-hidden /> Add event
              </button>
            )}
          </>
        }
      />

      <div role="group" aria-label="Show event types" className="flex flex-wrap gap-2">
        {visibleCategories(user).map((category) => {
          const on = !hidden.includes(category.id);
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggleCategory(category.id)}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-[1.5px] px-3.5 text-xs font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                on ? "border-ink bg-white" : "border-black/10 text-ink/60 line-through"
              )}
            >
              <span aria-hidden className={cn("size-3 rounded-full border-[1.5px] border-ink", toneStyles[category.tone].solid)} />
              {category.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label={`Calendar for ${monthLabel}`} className={cn("bg-white p-3 md:p-5", cardOutline)}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <button type="button" aria-label="Previous month" onClick={() => setCursor((value) => shiftMonth(value, -1))} className={iconButtonClass()}>
              <ArrowLeft aria-hidden />
            </button>
            <div className="flex items-center gap-2">
              <h2 aria-live="polite" className="rounded-full bg-pastel-pink px-4 py-1.5 font-heading text-lg font-medium">{monthLabel}</h2>
              <button
                type="button"
                aria-label="Jump to today"
                title="Jump to today"
                onClick={() => {
                  setCursor(cursorFrom(TODAY_ISO));
                  setSelected(TODAY_ISO);
                }}
                className={iconButtonClass()}
              >
                <CalendarCheck aria-hidden />
              </button>
            </div>
            <button type="button" aria-label="Next month" onClick={() => setCursor((value) => shiftMonth(value, 1))} className={iconButtonClass()}>
              <ArrowRight aria-hidden />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <span key={day} className="pb-1 text-center text-xs font-semibold text-muted-foreground">
                {day}
              </span>
            ))}
            {monthCells(cursor).map((iso, index) => {
              if (!iso) return <span key={`blank-${index}`} aria-hidden />;
              const dayEvents = eventsOn(shown, iso);
              const isSelected = iso === selected;
              return (
                <button
                  key={iso}
                  type="button"
                  aria-pressed={isSelected}
                  aria-current={iso === TODAY_ISO ? "date" : undefined}
                  aria-label={`${formatDate(iso, { day: "numeric", month: "long" })}, ${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}`}
                  onClick={() => setSelected(iso)}
                  className={cn(
                    "flex min-h-14 cursor-pointer flex-col gap-1 rounded-[18px] border-[1.5px] border-transparent bg-black/[0.03] p-1.5 text-left transition-colors duration-200 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink md:min-h-24 md:p-2",
                    isSelected && "border-ink bg-pastel-pink/40"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                      iso === TODAY_ISO && "bg-ink text-white"
                    )}
                  >
                    {parseISO(iso).getDate()}
                  </span>
                  <span className="hidden min-w-0 space-y-0.5 md:block">
                    {dayEvents.slice(0, MAX_CHIPS_PER_DAY).map((event) => (
                      <span key={event.id} className={cn("block truncate rounded-full px-2 py-0.5 text-[11px] font-medium", toneStyles[eventTone(event.category)].fill)}>
                        {event.title}
                      </span>
                    ))}
                    {dayEvents.length > MAX_CHIPS_PER_DAY && (
                      <span className="block px-2 text-[11px] font-medium text-muted-foreground">+{dayEvents.length - MAX_CHIPS_PER_DAY} more</span>
                    )}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="flex flex-wrap gap-0.5 md:hidden" aria-hidden>
                      {dayEvents.slice(0, 3).map((event) => (
                        <span key={event.id} className={cn("size-2 rounded-full border border-ink", toneStyles[eventTone(event.category)].solid)} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <Panel title={formatDate(selected, { weekday: "long", day: "numeric", month: "long" })} description={`${agenda.length} ${agenda.length === 1 ? "event" : "events"}`}>
          {agenda.length === 0 ? (
            <EmptyState title="Nothing planned" hint="Pick another day, or add an event." />
          ) : (
            <ol className="relative space-y-2.5">
              <span aria-hidden className="absolute bottom-6 left-[7px] top-6 w-[1.5px] bg-ink/20" />
              {agenda.map((event) => (
                <li key={event.id} className="relative flex items-center gap-3">
                  <span aria-hidden className={cn("relative size-4 shrink-0 rounded-full border-[1.5px] border-ink", toneStyles[eventTone(event.category)].solid)} />
                  <div className="min-w-0 flex-1 rounded-[20px] bg-black/[0.04] px-4 py-2.5">
                    <p className="text-sm font-semibold tabular-nums">{formatTime(event.time)}</p>
                    <p className="text-sm leading-snug">{event.title}</p>
                    {event.location && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" aria-hidden /> {event.location}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      {canManage(user.role) && <EventDrawer open={adding} onOpenChange={setAdding} defaultDate={selected} actor={user.name} />}
    </>
  );
}
