import type { Metadata } from "next";

import { CalendarView } from "@/components/calendar/calendar-view";
import { requireAccess } from "@/lib/auth";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const user = await requireAccess("/dashboard/calendar");

  return <CalendarView user={user} />;
}
