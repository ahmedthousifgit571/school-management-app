import { downloadFile, parseISO, toISO } from "@/lib/format";
import { EVENT_CATEGORIES, studentById, teacherClassIds, type CalendarEvent } from "@/lib/mock-data";
import type { SessionUser } from "@/lib/session";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type MonthCursor = { year: number; month: number };

export function cursorFrom(iso: string): MonthCursor {
  const date = parseISO(iso);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function shiftMonth({ year, month }: MonthCursor, delta: number): MonthCursor {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

/** ISO dates for a Monday-first month grid; null pads the days outside the month. */
export function monthCells({ year, month }: MonthCursor): (string | null)[] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= days; day++) cells.push(toISO(new Date(year, month, day)));
  return cells;
}

/** Staff meetings stay with staff, and exams only reach the classes sitting them. */
export function visibleEvents(events: CalendarEvent[], user: SessionUser): CalendarEvent[] {
  if (user.studentId) {
    const classId = studentById(user.studentId).classId;
    return events.filter((event) => event.category !== "meeting" && (!event.classId || event.classId === classId));
  }
  if (user.teacherId) {
    const classIds = teacherClassIds(user.teacherId);
    return events.filter((event) => !event.classId || classIds.includes(event.classId));
  }
  return events;
}

export function visibleCategories(user: SessionUser) {
  return user.studentId ? EVENT_CATEGORIES.filter((category) => category.id !== "meeting") : EVENT_CATEGORIES;
}

export function eventsOn(events: CalendarEvent[], iso: string): CalendarEvent[] {
  return events.filter((event) => event.date === iso).sort((a, b) => a.time.localeCompare(b.time));
}

/** Saves events as an .ics file that any calendar app can import. */
export function downloadICS(filename: string, events: CalendarEvent[]) {
  const stamp = (event: CalendarEvent) => `${event.date.replaceAll("-", "")}T${event.time.replace(":", "")}00`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MGM school management//School calendar//EN",
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.id}@mgm-school-management`,
      `DTSTAMP:${stamp(event)}`,
      `DTSTART:${stamp(event)}`,
      `SUMMARY:${event.title.replaceAll(",", "\\,")}`,
      ...(event.location ? [`LOCATION:${event.location.replaceAll(",", "\\,")}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  downloadFile(filename, lines.join("\r\n"), "text/calendar;charset=utf-8");
}
