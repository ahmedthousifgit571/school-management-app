"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarRange, ClipboardCheck, FileText, Users } from "lucide-react";

import {
  Drawer,
  EmptyState,
  Field,
  SearchField,
  Segmented,
  SelectInput,
  buttonClass,
  filterRowClass,
  rowClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/dashboard/controls";
import { PageHeader, Panel, StatCard, StatRow, cardOutline } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import {
  GRADES,
  allSlots,
  classAverage,
  classById,
  classSubjectTeachers,
  classes,
  gradeFor,
  subjectById,
  subjects,
  teacherById,
  teacherClassIds,
  teachers as seededTeachers,
} from "@/lib/mock-data";
import { isOffice } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";
import { attendanceStore, classTeachersStore, studentsStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

type Tab = "classes" | "subjects";

export function ClassesView({ user, initialQuery }: { user: SessionUser; initialQuery: string }) {
  const students = studentsStore.useStore();
  const attendance = attendanceStore.useStore();
  const classTeachers = classTeachersStore.useStore();
  const [tab, setTab] = useState<Tab>("classes");
  const [query, setQuery] = useState(initialQuery);
  const [grade, setGrade] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mine = user.teacherId ? teacherClassIds(user.teacherId) : null;
  const inScope = mine ? classes.filter((item) => mine.includes(item.id)) : classes;
  const term = query.trim().toLowerCase();
  const visible = inScope.filter((item) => {
    if (grade !== "all" && String(item.grade) !== grade) return false;
    return !term || item.name.toLowerCase().includes(term) || item.short.toLowerCase().includes(term);
  });

  const selected = selectedId ? classById(selectedId) : null;
  const teacherIdOf = (id: string) => classTeachers[id] ?? classById(id).classTeacherId;
  const countIn = (id: string) => students.filter((student) => student.classId === id).length;
  const rosterOf = (id: string) => students.filter((student) => student.classId === id);
  const openRegisters = inScope.filter((item) => !attendance.submitted[item.id]).length;
  const totalStudents = inScope.reduce((sum, item) => sum + countIn(item.id), 0);

  return (
    <>
      <PageHeader
        eyebrow="Rooms, rosters, subjects"
        title="Classes"
        description="Every class and section, who leads it, and who teaches what."
      />

      <StatRow label="Class summary">
        <StatCard label="Classes" value={String(inScope.length)} hint={mine ? "you teach" : `Grades ${GRADES[0]}–${GRADES[GRADES.length - 1]}`} fill={toneStyles.blue.fill} doodle="star" />
        <StatCard label="Students" value={String(totalStudents)} hint={`about ${Math.round(totalStudents / Math.max(1, inScope.length))} per class`} fill={toneStyles.yellow.fill} />
        <StatCard label="Subjects" value={String(subjects.length)} hint="on the curriculum" fill={toneStyles.pink.fill} doodle="heart" />
        <StatCard label="Registers open" value={String(openRegisters)} hint="today" fill={toneStyles.green.fill} />
      </StatRow>

      <Segmented
        label="Class views"
        value={tab}
        onChange={setTab}
        options={[
          { value: "classes", label: "Classes" },
          { value: "subjects", label: "Subjects & teachers" },
        ]}
      />

      {tab === "classes" ? (
        <Panel
          title="All classes"
          action={
            <div className={filterRowClass}>
              <SearchField value={query} onChange={setQuery} placeholder="Find a class" className="sm:w-56" />
              <SelectInput aria-label="Filter by grade" value={grade} onChange={(event) => setGrade(event.target.value)}>
                <option value="all">All grades</option>
                {GRADES.map((value) => (
                  <option key={value} value={value}>Grade {value}</option>
                ))}
              </SelectInput>
            </div>
          }
        >
          {visible.length === 0 ? (
            <EmptyState title="No classes match that" />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visible.map((item) => {
                const teacher = teacherById(teacherIdOf(item.id));
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={cn(
                        "flex w-full cursor-pointer flex-col gap-2 p-4 text-left transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-safe:hover:-translate-y-0.5",
                        cardOutline,
                        toneStyles[item.tone].fill
                      )}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-heading text-xl font-medium">{item.name}</span>
                        <span className="rounded-full bg-white/60 px-2 py-0.5 font-heading text-sm font-semibold">{gradeFor(classAverage(item.id))}</span>
                      </span>
                      <span className="text-sm text-ink/80">Class teacher: {teacher.name}</span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink/80">
                        <span className="inline-flex items-center gap-1"><Users className="size-3.5" aria-hidden />{countIn(item.id)}</span>
                        <span>{item.room}</span>
                        <span>{attendance.submitted[item.id] ? "Register in" : "Register open"}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      ) : (
        <Panel title="Subjects & teachers" description="Each subject's teachers and how many periods they run a week." bodyClassName="p-3 md:p-4">
          <div className="overflow-x-auto">
            <table className={cn(tableClass, "min-w-[640px]")}>
              <thead>
                <tr>
                  <th scope="col" className={thClass}>Subject</th>
                  <th scope="col" className={thClass}>Code</th>
                  <th scope="col" className={thClass}>Teachers</th>
                  <th scope="col" className={cn(thClass, "text-right")}>Periods / week</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => {
                  const staff = seededTeachers.filter((teacher) => teacher.subjectId === subject.id);
                  return (
                    <tr key={subject.id} className={rowClass}>
                      <td className={tdClass}>
                        <span className="inline-flex items-center gap-2.5 font-medium">
                          <span className={cn("flex size-9 items-center justify-center rounded-full border-[1.5px] border-ink", toneStyles[subject.tone].fill)}>
                            <subject.icon className="size-4" aria-hidden />
                          </span>
                          {subject.name}
                        </span>
                      </td>
                      <td className={cn(tdClass, "tabular-nums text-muted-foreground")}>{subject.code}</td>
                      <td className={tdClass}>{staff.map((teacher) => teacher.name).join(", ")}</td>
                      <td className={cn(tdClass, "text-right font-semibold tabular-nums")}>
                        {allSlots.filter((slot) => slot.subjectId === subject.id).length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selected?.name ?? ""}
        description={selected ? `${selected.room} · ${countIn(selected.id)} students` : undefined}
        footer={
          selected && (
            <>
              <Link href={`/dashboard/timetable?class=${selected.id}`} className={buttonClass("dark", "sm")}>
                <CalendarRange aria-hidden /> Timetable
              </Link>
              <Link href={`/dashboard/attendance?class=${selected.id}`} className={buttonClass("outline", "sm")}>
                <ClipboardCheck aria-hidden /> Register
              </Link>
              <Link href={`/dashboard/grades?class=${selected.id}`} className={buttonClass("outline", "sm")}>
                <FileText aria-hidden /> Gradebook
              </Link>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            {isOffice(user.role) ? (
              <Field label="Class teacher">
                <SelectInput
                  className="w-full"
                  value={teacherIdOf(selected.id)}
                  onChange={(event) => {
                    const teacherId = event.target.value;
                    classTeachersStore.set((current) => ({ ...current, [selected.id]: teacherId }));
                    toast(`${teacherById(teacherId).name} now leads ${selected.name}`);
                  }}
                >
                  {seededTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </SelectInput>
              </Field>
            ) : (
              <p className="text-sm"><span className="text-muted-foreground">Class teacher:</span> {teacherById(teacherIdOf(selected.id)).name}</p>
            )}

            <section>
              <h3 className="font-heading text-lg font-medium">Who teaches what</h3>
              <ul className="mt-2 space-y-1.5">
                {classSubjectTeachers(selected.id).map(({ subjectId, teacherId }) => (
                  <li key={subjectId} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 text-sm">
                    <span className="font-medium">{subjectById(subjectId).name}</span>
                    <span className="truncate text-muted-foreground">{teacherById(teacherId).name}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-heading text-lg font-medium">Roster</h3>
              <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {rosterOf(selected.id).map((student) => (
                  <li key={student.id} className="flex items-center gap-2 text-sm">
                    <UserAvatar name={student.name} size="sm" />
                    <span className="truncate">{student.name}</span>
                  </li>
                ))}
              </ol>
            </section>

          </div>
        )}
      </Drawer>
    </>
  );
}
