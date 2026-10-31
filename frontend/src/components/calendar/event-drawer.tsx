"use client";

import { Field, FormDrawer, SelectInput, TextInput } from "@/components/dashboard/controls";
import { formatDate } from "@/lib/format";
import { EVENT_CATEGORIES, eventTone, type EventCategory } from "@/lib/mock-data";
import { eventsStore, logActivity, newId, toast } from "@/lib/stores";

export function EventDrawer({
  open,
  onOpenChange,
  defaultDate,
  actor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: string;
  actor: string;
}) {
  function addEvent(data: FormData) {
    const title = String(data.get("title")).trim();
    const date = String(data.get("date"));
    const category = String(data.get("category")) as EventCategory;
    const location = String(data.get("location")).trim();

    eventsStore.set((events) => [
      ...events,
      {
        id: newId("ev"),
        title,
        date,
        time: String(data.get("time")),
        category,
        location: location || undefined,
      },
    ]);
    logActivity({ actor, text: `added “${title}” to the calendar`, kind: "event", tone: eventTone(category) });
    toast(`Added “${title}” on ${formatDate(date)}`);
    onOpenChange(false);
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Add event"
      description="It appears on the dashboard and the school calendar."
      submitLabel="Add event"
      onSubmit={addEvent}
    >
      <Field label="Title" required>
        <TextInput name="title" required placeholder="e.g. Staff meeting" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required>
          <TextInput name="date" type="date" required defaultValue={defaultDate} />
        </Field>
        <Field label="Time" required>
          <TextInput name="time" type="time" required defaultValue="09:00" />
        </Field>
      </div>
      <Field label="Category" required>
        <SelectInput name="category" className="w-full" defaultValue="meeting">
          {EVENT_CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Location">
        <TextInput name="location" placeholder="e.g. Conference room" />
      </Field>
    </FormDrawer>
  );
}
