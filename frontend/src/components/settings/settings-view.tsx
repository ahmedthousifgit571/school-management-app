"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";

import {
  Field,
  Segmented,
  SelectInput,
  TextInput,
  buttonClass,
  rowClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/dashboard/controls";
import { PageHeader, Panel } from "@/components/dashboard/panel";
import { gradeScale, term } from "@/lib/mock-data";
import { ALL_ROLES, navItems } from "@/lib/navigation";
import { roleLabel } from "@/lib/session";
import { createStore } from "@/lib/shared-store";
import { toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

type Tab = "school" | "academic" | "access" | "alerts";

const NOTIFICATION_OPTIONS = [
  { id: "absence", label: "Absence alerts", hint: "Text guardians when a student is marked absent." },
  { id: "fees", label: "Fee reminders", hint: "Remind families a week before fees are due." },
  { id: "exams", label: "Exam reminders", hint: "Tell students and parents the day before each exam." },
  { id: "transport", label: "Bus delays", hint: "Alert riders' families when a route runs late." },
  { id: "digest", label: "Daily digest", hint: "Send the principal a summary each evening." },
];

// Kept in a store so changes survive moving to another page and back.
const profileStore = createStore({
  name: "Lakeview International School",
  board: "CBSE",
  email: "office@school.test",
  phone: "+91 90000 00000",
  address: "12 Lake View Road, Bengaluru",
  year: "2026–27",
  startTime: "08:30",
  endTime: "14:45",
});

const alertsStore = createStore<Record<string, boolean>>({
  absence: true,
  fees: true,
  exams: true,
  transport: true,
  digest: false,
});

export function SettingsView() {
  const profile = profileStore.useStore();
  const alerts = alertsStore.useStore();
  const [tab, setTab] = useState<Tab>("school");

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    profileStore.set((current) => ({
      ...current,
      ...Object.fromEntries([...data.entries()].map(([key, value]) => [key, String(value)])),
    }));
    toast("Settings saved");
  }

  return (
    <>
      <PageHeader
        eyebrow="Behind the scenes"
        title="Settings"
        description="Your school's details, the academic calendar, who can see what, and alerts."
      />

      <Segmented
        label="Settings sections"
        value={tab}
        onChange={setTab}
        options={[
          { value: "school", label: "School" },
          { value: "academic", label: "Academic" },
          { value: "access", label: "Roles & access" },
          { value: "alerts", label: "Alerts" },
        ]}
      />

      {tab === "school" && (
        <Panel title="School profile" description="Shown on report cards, receipts and notices." className="max-w-3xl">
          <form key="school" onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="School name" required>
                <TextInput name="name" required defaultValue={profile.name} />
              </Field>
            </div>
            <Field label="Board">
              <SelectInput name="board" className="w-full" defaultValue={profile.board}>
                <option>CBSE</option>
                <option>ICSE</option>
                <option>State board</option>
                <option>IB</option>
              </SelectInput>
            </Field>
            <Field label="Office phone" required>
              <TextInput name="phone" type="tel" required defaultValue={profile.phone} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Office email" required>
                <TextInput name="email" type="email" required defaultValue={profile.email} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Address">
                <TextInput name="address" defaultValue={profile.address} />
              </Field>
            </div>
            <button type="submit" className={cn(buttonClass("dark"), "w-fit")}>Save changes</button>
          </form>
        </Panel>
      )}

      {tab === "academic" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Academic year" description={`Currently week ${term.week} of ${term.totalWeeks}, ${term.name}.`}>
            <form key="academic" onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Academic year" required>
                  <TextInput name="year" required defaultValue={profile.year} />
                </Field>
              </div>
              <Field label="School day starts" required>
                <TextInput name="startTime" type="time" required defaultValue={profile.startTime} />
              </Field>
              <Field label="School day ends" required>
                <TextInput name="endTime" type="time" required defaultValue={profile.endTime} />
              </Field>
              <button type="submit" className={cn(buttonClass("dark"), "w-fit")}>Save changes</button>
            </form>
          </Panel>
          <Panel title="Grading scale" description="Used on the gradebook and report cards." bodyClassName="p-3 md:p-4">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th scope="col" className={thClass}>Grade</th>
                  <th scope="col" className={cn(thClass, "text-right")}>From</th>
                </tr>
              </thead>
              <tbody>
                {gradeScale.map((step) => (
                  <tr key={step.grade} className={rowClass}>
                    <td className={cn(tdClass, "py-2 font-heading font-semibold")}>{step.grade}</td>
                    <td className={cn(tdClass, "py-2 text-right tabular-nums")}>{step.min}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {tab === "access" && (
        <Panel title="Roles & access" description="Which sections each role sees in the sidebar." bodyClassName="p-3 md:p-4">
          <div className="relative overflow-x-auto">
            <table className={cn(tableClass, "min-w-[640px]")}>
              <thead>
                <tr>
                  <th scope="col" className={thClass}>Section</th>
                  {ALL_ROLES.map((role) => (
                    <th key={role} scope="col" className={cn(thClass, "text-center")}>{roleLabel(role)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {navItems.map((item) => (
                  <tr key={item.href} className={rowClass}>
                    <th scope="row" className={cn(tdClass, "py-2 text-left font-medium")}>{item.title}</th>
                    {ALL_ROLES.map((role) => (
                      <td key={role} className={cn(tdClass, "py-2 text-center")}>
                        {item.roles.includes(role) ? (
                          <span className="inline-flex size-6 items-center justify-center rounded-full border-[1.5px] border-ink bg-pastel-green">
                            <Check className="size-3.5" aria-hidden />
                            <span className="sr-only">Yes</span>
                          </span>
                        ) : (
                          <span className="inline-flex size-6 items-center justify-center text-muted-foreground">
                            <Minus className="size-3.5" aria-hidden />
                            <span className="sr-only">No</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "alerts" && (
        <Panel title="Alerts" description="What the school sends automatically." className="max-w-3xl">
          <ul className="space-y-2">
            {NOTIFICATION_OPTIONS.map((option) => {
              const on = alerts[option.id] ?? false;
              return (
                <li key={option.id} className="flex items-center justify-between gap-4 rounded-[24px] bg-black/[0.04] p-3 pl-4">
                  <div className="min-w-0">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.hint}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={option.label}
                    onClick={() => {
                      alertsStore.set((current) => ({ ...current, [option.id]: !on }));
                      toast(`${option.label} ${on ? "off" : "on"}`);
                    }}
                    className={cn(
                      "relative h-8 w-14 shrink-0 cursor-pointer rounded-full border-[1.5px] border-ink transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                      on ? "bg-pastel-green" : "bg-white"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-[3px] top-[3px] size-[22px] rounded-full border-[1.5px] border-ink bg-white transition-transform duration-200",
                        on && "translate-x-6"
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </>
  );
}
