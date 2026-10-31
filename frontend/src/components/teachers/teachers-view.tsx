"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarRange, Check, Mail, MessageCircle, Phone, UserPlus, X } from "lucide-react";

import {
  Drawer,
  EmptyState,
  Field,
  FormDrawer,
  Pill,
  SearchField,
  Segmented,
  SelectInput,
  TextInput,
  buttonClass,
  filterRowClass,
} from "@/components/dashboard/controls";
import { PageHeader, Panel, StatCard, StatRow, cardOutline } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { daysBetween, formatDate, formatTime } from "@/lib/format";
import {
  PERIODS,
  TODAY_DAY_INDEX,
  TODAY_ISO,
  classById,
  classes,
  subjectById,
  subjects,
  teacherById,
  teacherClassIds,
  teacherTimetable,
  type LeaveRequest,
  type Teacher,
} from "@/lib/mock-data";
import { leaveStore, logActivity, newId, teachersStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

type Tab = "directory" | "leave";

export function TeachersView({ initialQuery, actor }: { initialQuery: string; actor: string }) {
  const teachers = teachersStore.useStore();
  const leave = leaveStore.useStore();
  const [tab, setTab] = useState<Tab>("directory");
  const [query, setQuery] = useState(initialQuery);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const checkedIn = teachers.filter((teacher) => teacher.status === "in").length;
  const pending = leave.filter((request) => request.status === "pending");
  const selected = teachers.find((teacher) => teacher.id === selectedId) ?? null;

  const term = query.trim().toLowerCase();
  const visible = teachers.filter((teacher) => {
    if (subjectFilter !== "all" && teacher.subjectId !== subjectFilter) return false;
    return !term || teacher.name.toLowerCase().includes(term);
  });

  function decide(request: LeaveRequest, status: "approved" | "declined") {
    const teacher = teacherById(request.teacherId);
    leaveStore.set((list) => list.map((item) => (item.id === request.id ? { ...item, status } : item)));
    if (status === "approved" && request.from <= TODAY_ISO && request.to >= TODAY_ISO) {
      teachersStore.set((list) =>
        list.map((item) => (item.id === teacher.id ? { ...item, status: "leave", checkIn: null } : item))
      );
    }
    logActivity({ actor, text: `${status} leave for ${teacher.name}`, kind: "staff", tone: status === "approved" ? "green" : "peach" });
    toast(`Leave ${status} for ${teacher.name}`);
  }

  function addTeacher(data: FormData) {
    const name = String(data.get("name")).trim();
    const teacher: Teacher = {
      id: newId("tn"),
      name,
      email: String(data.get("email")).trim(),
      phone: String(data.get("phone")).trim(),
      subjectId: String(data.get("subjectId")),
      qualification: String(data.get("qualification")).trim() || "B.Ed",
      joined: "2026",
      status: "in",
      checkIn: null,
    };
    teachersStore.set((list) => [...list, teacher]);
    logActivity({ actor, text: `added ${name} to the staff list`, kind: "staff", tone: "lilac" });
    toast(`${name} added`);
    setAdding(false);
  }

  const schedule = selected
    ? teacherTimetable(selected.id)
        .filter((slot) => slot.day === TODAY_DAY_INDEX)
        .sort((a, b) => a.period - b.period)
    : [];
  const leadOf = selected ? classes.filter((item) => item.classTeacherId === selected.id) : [];

  return (
    <>
      <PageHeader
        eyebrow="The staff room"
        title="Teachers"
        description="Who's in today, what they teach, and leave requests waiting on you."
        actions={
          <button type="button" onClick={() => setAdding(true)} className={buttonClass("dark")}>
            <UserPlus aria-hidden /> Add teacher
          </button>
        }
      />

      <StatRow label="Staff summary">
        <StatCard label="Teaching staff" value={String(teachers.length)} hint={`${subjects.length} subjects`} fill={toneStyles.lilac.fill} doodle="star" />
        <StatCard label="Checked in" value={String(checkedIn)} hint="this morning" fill={toneStyles.green.fill} />
        <StatCard label="On leave" value={String(teachers.length - checkedIn)} hint="today" fill={toneStyles.peach.fill} doodle="heart" />
        <StatCard label="Leave to review" value={String(pending.length)} hint="waiting on you" fill={toneStyles.yellow.fill} />
      </StatRow>

      <Segmented
        label="Teacher views"
        value={tab}
        onChange={setTab}
        options={[
          { value: "directory", label: "Directory", count: teachers.length },
          { value: "leave", label: "Leave requests", count: pending.length },
        ]}
      />

      {tab === "directory" ? (
        <Panel
          title="Directory"
          description={`${visible.length} ${visible.length === 1 ? "teacher" : "teachers"}`}
          action={
            <div className={filterRowClass}>
              <SearchField value={query} onChange={setQuery} placeholder="Find a teacher" className="sm:w-64" />
              <SelectInput aria-label="Filter by subject" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
                <option value="all">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </SelectInput>
            </div>
          }
        >
          {visible.length === 0 ? (
            <EmptyState title="No teachers match that" hint="Try another name or subject." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visible.map((teacher) => {
                const subject = subjectById(teacher.subjectId);
                return (
                  <li key={teacher.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(teacher.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 p-3 text-left transition-colors duration-200 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
                        cardOutline,
                        "rounded-[28px]"
                      )}
                    >
                      <UserAvatar name={teacher.name} tone={subject.tone} size="lg" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{teacher.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{subject.name}</span>
                        <span className="mt-1 block">
                          {teacher.status === "in" ? (
                            <Pill tone="green">{teacher.checkIn ? `In since ${formatTime(teacher.checkIn)}` : "New"}</Pill>
                          ) : (
                            <Pill tone="peach">On leave</Pill>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      ) : (
        <Panel title="Leave requests" description="Approved leave that covers today flags their classes for cover on the timetable.">
          <ul className="space-y-2">
            {leave.map((request) => {
              const teacher = teacherById(request.teacherId);
              const days = daysBetween(request.from, request.to) + 1;
              return (
                <li key={request.id} className="flex flex-col gap-3 rounded-[24px] bg-black/[0.04] p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <UserAvatar name={teacher.name} size="lg" />
                    <div className="min-w-0">
                      <p className="font-medium">{teacher.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(request.from)}
                        {days > 1 && ` – ${formatDate(request.to)}`} · {days} {days === 1 ? "day" : "days"} · {request.reason}
                      </p>
                    </div>
                  </div>
                  {request.status === "pending" ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => decide(request, "approved")} className={buttonClass("dark", "sm")}>
                        <Check aria-hidden /> Approve
                      </button>
                      <button type="button" onClick={() => decide(request, "declined")} className={buttonClass("outline", "sm")}>
                        <X aria-hidden /> Decline
                      </button>
                    </div>
                  ) : (
                    <Pill tone={request.status === "approved" ? "green" : "peach"} icon={request.status === "approved" ? Check : X}>
                      {request.status === "approved" ? "Approved" : "Declined"}
                    </Pill>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selected?.name ?? ""}
        description={selected ? `${subjectById(selected.subjectId).name} · ${selected.qualification} · Joined ${selected.joined}` : undefined}
        footer={
          selected && (
            <>
              <Link href={`/dashboard/timetable?teacher=${selected.id}`} className={buttonClass("dark", "sm")}>
                <CalendarRange aria-hidden /> Full timetable
              </Link>
              <Link href="/dashboard/messaging" className={buttonClass("outline", "sm")}>
                <MessageCircle aria-hidden /> Message
              </Link>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${selected.phone.replaceAll(" ", "")}`} className={buttonClass("soft", "sm")}>
                <Phone aria-hidden /> {selected.phone}
              </a>
              <a href={`mailto:${selected.email}`} className={buttonClass("soft", "sm")}>
                <Mail aria-hidden /> Email
              </a>
            </div>

            {leadOf.length > 0 && (
              <section>
                <h3 className="font-heading text-lg font-medium">Class teacher of</h3>
                <p className="text-sm">{leadOf.map((item) => item.name).join(", ")}</p>
              </section>
            )}

            <section>
              <h3 className="font-heading text-lg font-medium">Teaches</h3>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {teacherClassIds(selected.id).map((id) => (
                  <li key={id}><Pill tone={classById(id).tone}>{classById(id).short}</Pill></li>
                ))}
                {teacherClassIds(selected.id).length === 0 && <li className="text-sm text-muted-foreground">No classes assigned yet.</li>}
              </ul>
            </section>

            <section>
              <h3 className="font-heading text-lg font-medium">Today</h3>
              {schedule.length === 0 ? (
                <p className="text-sm text-muted-foreground">No classes today.</p>
              ) : (
                <ol className="mt-2 space-y-1.5">
                  {schedule.map((slot) => (
                    <li key={slot.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 text-sm">
                      <span className="font-medium tabular-nums">{formatTime(PERIODS[slot.period]!.start)}</span>
                      <span className="min-w-0 flex-1 truncate">{classById(slot.classId).name}</span>
                      <span className="truncate text-xs text-muted-foreground">{slot.room}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}
      </Drawer>

      <FormDrawer open={adding} onOpenChange={setAdding} title="Add teacher" submitLabel="Add teacher" onSubmit={addTeacher}>
        <Field label="Full name" required>
          <TextInput name="name" required autoComplete="off" />
        </Field>
        <Field label="Subject" required>
          <SelectInput name="subjectId" className="w-full" defaultValue="math">
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Qualification">
          <TextInput name="qualification" placeholder="e.g. M.Sc, B.Ed" autoComplete="off" />
        </Field>
        <Field label="Email" required>
          <TextInput name="email" type="email" required autoComplete="off" />
        </Field>
        <Field label="Phone" required>
          <TextInput name="phone" type="tel" required placeholder="+91" autoComplete="off" />
        </Field>
      </FormDrawer>
    </>
  );
}
