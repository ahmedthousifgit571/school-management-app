"use client";

import { useState } from "react";
import { BellRing, Check, CheckCheck, CheckCircle2, Clock3, X } from "lucide-react";

import { AttendanceChart } from "@/components/dashboard/attendance-chart";
import {
  EmptyState,
  Field,
  FormDrawer,
  ProgressBar,
  SearchField,
  TextArea,
  TextInput,
  buttonClass,
  filterRowClass,
} from "@/components/dashboard/controls";
import { PageHeader, Panel, StatCard, StatRow } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { formatDate } from "@/lib/format";
import {
  TODAY_ISO,
  classById,
  classes,
  schoolAttendanceWeek,
  studentAttendanceWeeks,
  studentById,
  teacherClassIds,
  type AttendanceStatus,
} from "@/lib/mock-data";
import type { SessionUser } from "@/lib/session";
import { attendanceStore, logActivity, studentsStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

const STATUSES: { value: AttendanceStatus; label: string; icon: typeof Check; active: string }[] = [
  { value: "present", label: "Present", icon: Check, active: "bg-pastel-green border-ink" },
  { value: "late", label: "Late", icon: Clock3, active: "bg-pastel-yellow border-ink" },
  { value: "absent", label: "Absent", icon: X, active: "bg-pastel-peach border-ink" },
];

export function AttendanceView({ user, initialClassId }: { user: SessionUser; initialClassId?: string }) {
  if (user.studentId) return <FamilyAttendance user={user} />;
  return <StaffAttendance user={user} initialClassId={initialClassId} />;
}

function StaffAttendance({ user, initialClassId }: { user: SessionUser; initialClassId?: string }) {
  const attendance = attendanceStore.useStore();
  const students = studentsStore.useStore();
  const allowedIds = user.teacherId ? teacherClassIds(user.teacherId) : classes.map((item) => item.id);
  const allowed = classes.filter((item) => allowedIds.includes(item.id));

  const firstOpen = allowed.find((item) => !attendance.submitted[item.id]) ?? allowed[0]!;
  const [activeId, setActiveId] = useState(
    initialClassId && allowedIds.includes(initialClassId) ? initialClassId : firstOpen.id
  );
  const [query, setQuery] = useState("");

  const active = classById(activeId);
  const roster = students.filter((student) => student.classId === activeId);
  const marks = attendance.marks[activeId] ?? {};
  const saved = attendance.submitted[activeId] ?? false;

  const rosterMarks = roster.map((student) => marks[student.id]);
  const counts = {
    present: rosterMarks.filter((status) => status === "present").length,
    late: rosterMarks.filter((status) => status === "late").length,
    absent: rosterMarks.filter((status) => status === "absent").length,
    unmarked: rosterMarks.filter((status) => !status).length,
  };
  const marked = roster.length - counts.unmarked;
  const visibleStudents = roster.filter((student) => student.name.toLowerCase().includes(query.trim().toLowerCase()));

  // School-wide (or my classes) numbers for the stat row
  const scopeMarks = allowedIds.flatMap((id) => Object.values(attendance.marks[id] ?? {}));
  const scopeEnrolled = students.filter((student) => allowedIds.includes(student.classId)).length;
  const scopePresent = scopeMarks.filter((status) => status !== "absent").length;
  const scopeLate = scopeMarks.filter((status) => status === "late").length;
  const scopeAbsent = scopeMarks.filter((status) => status === "absent").length;
  const openCount = allowed.filter((item) => !attendance.submitted[item.id]).length;

  const lowAttendance = students
    .filter((student) => allowedIds.includes(student.classId) && student.attendance < 80)
    .sort((a, b) => a.attendance - b.attendance)
    .slice(0, 6);

  function setStatus(studentId: string, status: AttendanceStatus) {
    attendanceStore.set((current) => ({
      marks: { ...current.marks, [activeId]: { ...current.marks[activeId], [studentId]: status } },
      submitted: { ...current.submitted, [activeId]: false },
    }));
  }

  function markAllPresent() {
    attendanceStore.set((current) => ({
      marks: { ...current.marks, [activeId]: Object.fromEntries(roster.map((student) => [student.id, "present" as const])) },
      submitted: { ...current.submitted, [activeId]: false },
    }));
  }

  function save() {
    // TODO: POST to the attendance API once it exists.
    attendanceStore.set((current) => ({ ...current, submitted: { ...current.submitted, [activeId]: true } }));
    logActivity({ actor: user.name, text: `submitted the ${active.name} attendance`, kind: "attendance", tone: "green" });
    toast(`${active.name} register saved`);
    const next = allowed.find((item) => item.id !== activeId && !attendance.submitted[item.id]);
    if (next) setActiveId(next.id);
  }

  return (
    <>
      <PageHeader
        eyebrow="Daily register"
        title="Attendance"
        description={`Pick a class, mark each student, then save the register. ${formatDate(TODAY_ISO, { weekday: "long", day: "numeric", month: "long" })}.`}
      />

      <StatRow label="Attendance today">
        <StatCard label="In today" value={`${scopeEnrolled ? Math.round((scopePresent / scopeEnrolled) * 100) : 0}%`} hint={`${scopePresent} of ${scopeEnrolled} students`} fill={toneStyles.green.fill} doodle="star" />
        <StatCard label="Absent" value={String(scopeAbsent)} hint="so far today" fill={toneStyles.peach.fill} />
        <StatCard label="Late" value={String(scopeLate)} hint="arrived after 8:30" fill={toneStyles.yellow.fill} doodle="heart" />
        <StatCard label="Registers open" value={String(openCount)} hint={`of ${allowed.length} classes`} fill={toneStyles.blue.fill} />
      </StatRow>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Panel title="Registers" description={`${openCount} still open`} bodyClassName="p-3">
          <ul className="max-h-[32rem] space-y-1 overflow-y-auto pr-1" aria-label="Choose a class">
            {allowed.map((item) => {
              const isActive = item.id === activeId;
              const submitted = attendance.submitted[item.id];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setActiveId(item.id);
                      setQuery("");
                    }}
                    className={cn(
                      "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-full border-[1.5px] px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink",
                      isActive ? "border-ink bg-ink text-white" : "border-transparent hover:bg-black/[0.05]"
                    )}
                  >
                    {item.name}
                    {submitted ? (
                      <span className={cn("inline-flex items-center gap-1 text-xs", isActive ? "text-white/80" : "text-muted-foreground")}>
                        <CheckCircle2 className="size-3.5" aria-hidden /> Saved
                      </span>
                    ) : (
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold text-ink", toneStyles.yellow.fill)}>Open</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title={`${active.name} register`}
          description={counts.unmarked ? `${counts.unmarked} left to mark` : `${counts.present + counts.late} attending, ${counts.absent} absent`}
          action={
            <div className={filterRowClass}>
              <SearchField value={query} onChange={setQuery} placeholder="Find a student" className="sm:w-56" />
              <button type="button" onClick={markAllPresent} className={buttonClass("outline")}>
                <CheckCheck aria-hidden /> Mark all present
              </button>
            </div>
          }
          bodyClassName="p-3 md:p-4"
        >
          {visibleStudents.length === 0 ? (
            <EmptyState title={`No students match “${query}”`} />
          ) : (
            <ul className="max-h-[32rem] divide-y-[1.5px] divide-black/[0.06] overflow-y-auto pr-1">
              {visibleStudents.map((student) => {
                const status = marks[student.id];
                return (
                  <li key={student.id} className="flex flex-col gap-2 px-1 py-2.5 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="w-6 text-right text-sm font-medium tabular-nums text-muted-foreground">{student.roll}</span>
                      <UserAvatar name={student.name} />
                      <p className="truncate font-medium">{student.name}</p>
                    </div>
                    <div role="radiogroup" aria-label={`Attendance for ${student.name}`} className="flex gap-1">
                      {STATUSES.map((option) => {
                        const checked = status === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            onClick={() => setStatus(student.id, option.value)}
                            className={cn(
                              "inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border-[1.5px] px-3 text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink sm:flex-none",
                              checked ? option.active : "border-black/10 text-ink/70 hover:border-ink hover:text-ink"
                            )}
                          >
                            <option.icon className="size-3.5" aria-hidden />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-3 flex flex-col gap-3 border-t-[1.5px] border-black/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <ProgressBar value={roster.length ? (marked / roster.length) * 100 : 0} label="Students marked" className="w-full max-w-48" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold tabular-nums text-foreground">{marked}</span> of {roster.length} marked
              </p>
            </div>
            <button type="button" onClick={save} disabled={counts.unmarked > 0 || saved} className={buttonClass("dark")}>
              {counts.unmarked > 0 ? `${counts.unmarked} left to mark` : saved ? "Register saved" : "Save register"}
            </button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="This week" description="Share of students each day" className="lg:col-span-3" bodyClassName="flex flex-col">
          <AttendanceChart points={schoolAttendanceWeek} />
        </Panel>
        <Panel title="Needs a nudge" description="Below 80% this term" className="lg:col-span-2" bodyClassName="p-3 md:p-4">
          {lowAttendance.length === 0 ? (
            <EmptyState title="Everyone is above 80%" />
          ) : (
            <ul className="space-y-1.5">
              {lowAttendance.map((student) => (
                <li key={student.id} className="flex items-center gap-3 rounded-[24px] bg-black/[0.04] p-2 pr-2.5">
                  <UserAvatar name={student.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{classById(student.classId).short} · {student.attendance}%</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast(`Note sent to ${student.guardian.name}`)}
                    className={buttonClass("soft", "sm")}
                  >
                    <BellRing aria-hidden /> Notify
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function FamilyAttendance({ user }: { user: SessionUser }) {
  const students = studentsStore.useStore();
  const student = studentById(user.studentId!, students);
  const attendance = attendanceStore.useStore();
  const [reporting, setReporting] = useState(false);
  const today = attendance.marks[student.classId]?.[student.id];
  const isParent = user.role === "PARENT";

  function report(data: FormData) {
    const date = String(data.get("date"));
    logActivity({ actor: user.name, text: `reported an absence for ${formatDate(date)}`, kind: "attendance", tone: "peach" });
    toast("Absence sent to the class teacher");
    setReporting(false);
  }

  return (
    <>
      <PageHeader
        eyebrow={classById(student.classId).name}
        title="Attendance"
        description={isParent ? `How ${student.name.split(" ")[0]} is doing this term.` : "Your attendance so far this term."}
        actions={
          <button type="button" onClick={() => setReporting(true)} className={buttonClass("dark")}>
            Report an absence
          </button>
        }
      />
      <StatRow label="Attendance summary">
        <StatCard label="This term" value={`${student.attendance}%`} hint="present or late" fill={toneStyles.green.fill} doodle="star" />
        <StatCard label="Today" value={today ? today[0]!.toUpperCase() + today.slice(1) : "Not marked"} hint="from the morning register" fill={toneStyles.yellow.fill} />
        <StatCard label="Days missed" value={String(Math.round(((100 - student.attendance) / 100) * 34))} hint="of 34 school days" fill={toneStyles.peach.fill} doodle="heart" />
        <StatCard label="Target" value="85%" hint={student.attendance >= 85 ? "On track" : "Below target"} fill={toneStyles.blue.fill} />
      </StatRow>
      <Panel title="Week by week" description="Share of school days in each week" bodyClassName="flex flex-col">
        <AttendanceChart points={studentAttendanceWeeks} />
      </Panel>
      <FormDrawer
        open={reporting}
        onOpenChange={setReporting}
        title="Report an absence"
        description="Goes straight to the class teacher."
        submitLabel="Send"
        onSubmit={report}
      >
        <Field label="Date" required>
          <TextInput name="date" type="date" required defaultValue={TODAY_ISO} />
        </Field>
        <Field label="Reason" required>
          <TextArea name="reason" required rows={3} placeholder="e.g. Doctor's appointment" />
        </Field>
      </FormDrawer>
    </>
  );
}
