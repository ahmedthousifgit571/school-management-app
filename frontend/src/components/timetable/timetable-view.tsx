"use client";

import { Fragment, useState } from "react";
import { AlertTriangle, Printer } from "lucide-react";

import { Drawer, Field, Pill, Segmented, SelectInput, buttonClass } from "@/components/dashboard/controls";
import { PageHeader } from "@/components/dashboard/panel";
import { cardOutline } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { formatTime } from "@/lib/format";
import {
  BREAKS,
  DAYS,
  PERIODS,
  TODAY_DAY_INDEX,
  allSlots,
  classById,
  classTimetable,
  classes,
  studentById,
  subjectById,
  teacherById,
  teacherTimetable,
  teachers as seededTeachers,
  type Slot,
} from "@/lib/mock-data";
import { isOffice } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";
import { logActivity, substitutionsStore, teachersStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

type Mode = "class" | "teacher";

export function TimetableView({
  user,
  initialClassId,
  initialTeacherId,
}: {
  user: SessionUser;
  initialClassId?: string;
  initialTeacherId?: string;
}) {
  const teachers = teachersStore.useStore();
  const substitutions = substitutionsStore.useStore();
  const familyClassId = user.studentId ? studentById(user.studentId).classId : null;

  const [mode, setMode] = useState<Mode>(initialTeacherId || user.teacherId ? "teacher" : "class");
  const [classId, setClassId] = useState(familyClassId ?? initialClassId ?? "10a");
  const [teacherId, setTeacherId] = useState(initialTeacherId ?? user.teacherId ?? "t0");
  const [selected, setSelected] = useState<Slot | null>(null);

  const slots = mode === "class" ? classTimetable(classId) : teacherTimetable(teacherId);
  const cell = (day: number, period: number) => slots.find((slot) => slot.day === day && slot.period === period);

  const isAway = (id: string) => teachers.find((teacher) => teacher.id === id)?.status === "leave";
  const needsCover = (slot: Slot) => slot.day === TODAY_DAY_INDEX && isAway(slot.teacherId) && !substitutions[slot.id];

  // Cover is a principal's job, so only they see the school-wide count.
  const uncovered = isOffice(user.role) ? allSlots.filter(needsCover).length : 0;

  const free = selected
    ? teachers.filter(
        (teacher) =>
          teacher.status === "in" &&
          !allSlots.some(
            (slot) =>
              slot.day === selected.day &&
              slot.period === selected.period &&
              (slot.teacherId === teacher.id || substitutions[slot.id] === teacher.id)
          )
      )
    : [];

  const heading = mode === "class" ? classById(classId).name : teacherById(teacherId).name;

  function assignCover(slot: Slot, coverId: string) {
    const cover = teacherById(coverId);
    substitutionsStore.set((current) => ({ ...current, [slot.id]: coverId }));
    logActivity({ actor: user.name, text: `asked ${cover.name} to cover ${classById(slot.classId).short}`, kind: "staff", tone: "lilac" });
    toast(`${cover.name} is covering ${classById(slot.classId).short}`);
    setSelected(null);
  }

  return (
    <>
      <PageHeader
        eyebrow="Monday to Friday"
        title="Timetable"
        description={familyClassId ? `The weekly plan for ${classById(familyClassId).name}.` : "Weekly periods by class or by teacher. Select a period to see details or arrange cover."}
        actions={
          <button type="button" onClick={() => window.print()} className={buttonClass("outline")}>
            <Printer aria-hidden /> Print
          </button>
        }
      />

      {!familyClassId && (
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Segmented
            label="View timetable by"
            value={mode}
            onChange={setMode}
            options={[
              { value: "class", label: "By class" },
              { value: "teacher", label: "By teacher" },
            ]}
          />
          {mode === "class" ? (
            <SelectInput aria-label="Class" value={classId} onChange={(event) => setClassId(event.target.value)}>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </SelectInput>
          ) : (
            <SelectInput aria-label="Teacher" value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
              {seededTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </SelectInput>
          )}
          {uncovered > 0 && (
            <Pill tone="peach" icon={AlertTriangle} className="py-2">
              {uncovered} {uncovered === 1 ? "period needs" : "periods need"} cover today
            </Pill>
          )}
        </div>
      )}

      <section aria-label={`Timetable for ${heading}`} className={cn("bg-white p-3 md:p-4", cardOutline)}>
        <h2 className="mb-3 hidden font-heading text-2xl font-medium print:block">{heading}</h2>
        <div className="overflow-x-auto">
          <div className="grid min-w-[820px] grid-cols-[84px_repeat(5,minmax(0,1fr))] gap-1.5">
            <div />
            {DAYS.map((day, index) => (
              <div key={day} className="pb-1 text-center">
                <span
                  className={cn(
                    "inline-block rounded-full px-3 py-1 text-sm font-semibold",
                    index === TODAY_DAY_INDEX && "bg-pastel-pink"
                  )}
                  aria-current={index === TODAY_DAY_INDEX ? "date" : undefined}
                >
                  {day}
                </span>
              </div>
            ))}

            {PERIODS.map((period) => (
              <Fragment key={period.id}>
                <div className="flex flex-col justify-center pr-1 text-right">
                  <span className="text-xs font-semibold">{period.label}</span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{formatTime(period.start)}</span>
                </div>
                {DAYS.map((_, day) => {
                  const slot = cell(day, period.id);
                  if (!slot) {
                    return (
                      <div key={day} className="flex min-h-[4.25rem] items-center justify-center rounded-[20px] border-[1.5px] border-dashed border-black/10 text-xs text-muted-foreground">
                        Free
                      </div>
                    );
                  }
                  const subject = subjectById(slot.subjectId);
                  const coverId = substitutions[slot.id];
                  const flagged = needsCover(slot);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelected(slot)}
                      aria-label={`${DAYS[day]} ${period.label}: ${subject.name}, ${classById(slot.classId).name}, ${teacherById(slot.teacherId).name}${flagged ? ", needs cover" : ""}`}
                      className={cn(
                        "flex min-h-[4.25rem] cursor-pointer flex-col justify-center rounded-[20px] border-[1.5px] px-3 py-2 text-left transition-colors duration-200 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink",
                        toneStyles[subject.tone].soft,
                        flagged ? "border-dashed border-ink" : "border-transparent"
                      )}
                    >
                      <span className="truncate text-sm font-semibold">{subject.name}</span>
                      <span className="truncate text-xs text-ink/75">
                        {mode === "class" ? (coverId ? `Cover: ${teacherById(coverId).name}` : teacherById(slot.teacherId).name) : classById(slot.classId).name}
                      </span>
                      {flagged && <span className="truncate text-[11px] font-semibold">Needs cover</span>}
                    </button>
                  );
                })}
                {BREAKS[period.id] && (
                  <div className="col-span-6 rounded-full bg-black/[0.04] py-1 text-center font-hand text-lg text-ink/70">
                    {BREAKS[period.id]}
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? subjectById(selected.subjectId).name : ""}
        description={selected ? `${DAYS[selected.day]} · ${PERIODS[selected.period]!.label} · ${formatTime(PERIODS[selected.period]!.start)}–${formatTime(PERIODS[selected.period]!.end)}` : undefined}
      >
        {selected && (
          <div className="space-y-5">
            <dl className="space-y-2 rounded-[28px] bg-white p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Class</dt>
                <dd className="font-medium">{classById(selected.classId).name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Teacher</dt>
                <dd className="font-medium">
                  {teacherById(selected.teacherId).name}
                  {isAway(selected.teacherId) && " (on leave)"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Room</dt>
                <dd className="font-medium">{selected.room}</dd>
              </div>
              {substitutions[selected.id] && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Cover</dt>
                  <dd className="font-medium">{teacherById(substitutions[selected.id]!).name}</dd>
                </div>
              )}
            </dl>

            {isOffice(user.role) && (
              <Field label="Arrange cover" hint={`${free.length} teachers are free this period.`}>
                <SelectInput
                  className="w-full"
                  value=""
                  onChange={(event) => event.target.value && assignCover(selected, event.target.value)}
                >
                  <option value="">Choose a teacher…</option>
                  {free.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} · {subjectById(teacher.subjectId).name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
