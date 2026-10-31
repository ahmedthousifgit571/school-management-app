"use client";

import { useState } from "react";
import { CalendarPlus, Clock3, MapPin, UserRound } from "lucide-react";

import {
  EmptyState,
  Field,
  FormDrawer,
  Pill,
  Segmented,
  SelectInput,
  TextInput,
  buttonClass,
  rowClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/dashboard/controls";
import { PageHeader, Panel, StatCard, StatRow, cardOutline } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { formatDate, formatTime, parseISO } from "@/lib/format";
import {
  TODAY_ISO,
  classById,
  classes,
  gradeFor,
  scoreFor,
  studentAverage,
  studentById,
  studentsInClass,
  subjectById,
  subjects,
  teacherById,
  teacherClassIds,
  teachers,
  term,
  type Exam,
} from "@/lib/mock-data";
import { canManage } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";
import { eventsStore, examsStore, logActivity, markFor, marksStore, newId, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

type Tab = "today" | "upcoming" | "completed";

function byDate(a: Exam, b: Exam) {
  return (a.date + a.start).localeCompare(b.date + b.start);
}

function ExamCard({ exam, highlight }: { exam: Exam; highlight?: boolean }) {
  const subject = subjectById(exam.subjectId);
  const date = parseISO(exam.date);

  return (
    <article className={cn("flex gap-4 bg-white p-4", cardOutline, highlight && "border-ink")}>
      <div className={cn("flex w-16 shrink-0 flex-col items-center justify-center rounded-[24px] border-[1.5px] border-ink py-2.5", toneStyles[subject.tone].fill)}>
        <span className="text-[11px] font-semibold uppercase">{formatDate(exam.date, { month: "short" })}</span>
        <span className="font-heading text-3xl font-medium leading-none">{date.getDate()}</span>
        <span className="mt-0.5 text-[11px] font-medium">{formatDate(exam.date, { weekday: "short" })}</span>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-heading text-lg font-medium leading-tight">{subject.name}</h3>
            <p className="text-xs font-medium text-muted-foreground">
              {classById(exam.classId).name} · {exam.title} · {exam.type}
            </p>
          </div>
          {highlight && <Pill tone="pink">Today</Pill>}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-4" aria-hidden />
            {formatTime(exam.start)} – {formatTime(exam.end)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {exam.room}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-4" aria-hidden />
            {teacherById(exam.invigilatorId).name}
          </span>
        </div>

        {exam.topics.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={`${subject.name} topics`}>
            {exam.topics.map((topic) => (
              <li key={topic} className="rounded-full bg-black/[0.05] px-2.5 py-1 text-xs font-medium">
                {topic}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function ExamsView({ user }: { user: SessionUser }) {
  const allExams = examsStore.useStore();
  const edits = marksStore.useStore();
  const [tab, setTab] = useState<Tab>("today");
  const [scheduling, setScheduling] = useState(false);

  const student = user.studentId ? studentById(user.studentId) : null;
  const myClassIds = user.teacherId ? teacherClassIds(user.teacherId) : null;
  const exams = allExams
    .filter((exam) => {
      if (student) return exam.classId === student.classId;
      if (myClassIds) return myClassIds.includes(exam.classId) || exam.invigilatorId === user.teacherId;
      return true;
    })
    .sort(byDate);

  const today = exams.filter((exam) => exam.date === TODAY_ISO);
  const upcoming = exams.filter((exam) => exam.date > TODAY_ISO);
  const completed = exams.filter((exam) => exam.date < TODAY_ISO);
  const lists = { today, upcoming, completed };

  const average = student
    ? studentAverage(student.id, "ut1")
    : Math.round(
        completed.reduce((sum, exam) => sum + examStats(exam).average, 0) / Math.max(1, completed.length)
      );

  function schedule(data: FormData) {
    const classId = String(data.get("classId"));
    const subjectId = String(data.get("subjectId"));
    const exam: Exam = {
      id: newId("e"),
      title: String(data.get("title")).trim() || "Unit Test 1",
      classId,
      subjectId,
      date: String(data.get("date")),
      start: String(data.get("start")),
      end: String(data.get("end")),
      room: String(data.get("room")).trim() || "Exam Hall A",
      type: String(data.get("type")) as Exam["type"],
      maxMarks: 100,
      invigilatorId: String(data.get("invigilatorId")),
      topics: [],
    };
    const label = `${subjectById(subjectId).name} exam · ${classById(classId).short}`;
    examsStore.set((list) => [...list, exam]);
    eventsStore.set((list) => [
      ...list,
      { id: `ev-${exam.id}`, title: label, date: exam.date, time: exam.start, category: "exam", location: exam.room, classId },
    ]);
    logActivity({ actor: user.name, text: `scheduled ${label}`, kind: "event", tone: "pink" });
    toast(`${label} scheduled for ${formatDate(exam.date)}`);
    setScheduling(false);
  }

  return (
    <>
      <PageHeader
        eyebrow={term.name}
        title="Exams"
        description={student ? "Your exam timetable and results so far." : "The exam timetable, rooms, invigilators and results."}
        actions={
          canManage(user.role) && (
            <button type="button" onClick={() => setScheduling(true)} className={buttonClass("dark")}>
              <CalendarPlus aria-hidden /> Schedule exam
            </button>
          )
        }
      />

      <StatRow label="Exam summary">
        <StatCard label="Today" value={String(today.length)} hint={today.length === 1 ? "exam" : "exams"} fill={toneStyles.pink.fill} doodle="heart" />
        <StatCard label="Ahead" value={String(upcoming.length)} hint={upcoming[0] ? `next on ${formatDate(upcoming[0].date)}` : "none left"} fill={toneStyles.blue.fill} />
        <StatCard label="Marked" value={String(completed.length)} hint="this term" fill={toneStyles.green.fill} />
        <StatCard label={student ? "My average" : "Average score"} value={`${average}%`} hint="Unit Test 1" fill={toneStyles.yellow.fill} doodle="star" />
      </StatRow>

      <Segmented
        label="Which exams"
        value={tab}
        onChange={setTab}
        options={[
          { value: "today", label: "Today", count: today.length },
          { value: "upcoming", label: "Ahead", count: upcoming.length },
          { value: "completed", label: "Results", count: completed.length },
        ]}
      />

      {tab !== "completed" ? (
        lists[tab].length === 0 ? (
          <EmptyState title={tab === "today" ? "No exams today" : "Nothing else scheduled"} />
        ) : (
          <section aria-label={`${tab} exams`} className="grid gap-4 lg:grid-cols-2">
            {lists[tab].map((exam) => (
              <ExamCard key={exam.id} exam={exam} highlight={exam.date === TODAY_ISO} />
            ))}
          </section>
        )
      ) : completed.length === 0 ? (
        <EmptyState title="No results yet" />
      ) : (
        <Panel title="Results" description="Marked exams this term" bodyClassName="p-3 md:p-4">
          <div className="overflow-x-auto">
            <table className={cn(tableClass, "min-w-[640px]")}>
              <thead>
                <tr>
                  <th scope="col" className={thClass}>Subject</th>
                  <th scope="col" className={thClass}>Class</th>
                  <th scope="col" className={thClass}>Date</th>
                  {student ? (
                    <>
                      <th scope="col" className={cn(thClass, "text-right")}>My marks</th>
                      <th scope="col" className={cn(thClass, "text-right")}>Grade</th>
                    </>
                  ) : (
                    <>
                      <th scope="col" className={cn(thClass, "text-right")}>Average</th>
                      <th scope="col" className={cn(thClass, "text-right")}>Highest</th>
                      <th scope="col" className={cn(thClass, "text-right")}>Passed</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {completed.map((exam) => {
                  const stats = examStats(exam);
                  const mine = student ? markFor(edits, student.id, exam.subjectId, "ut1") : 0;
                  return (
                    <tr key={exam.id} className={rowClass}>
                      <td className={cn(tdClass, "font-medium")}>{subjectById(exam.subjectId).name}</td>
                      <td className={tdClass}><Pill tone={classById(exam.classId).tone}>{classById(exam.classId).short}</Pill></td>
                      <td className={cn(tdClass, "tabular-nums text-muted-foreground")}>{formatDate(exam.date)}</td>
                      {student ? (
                        <>
                          <td className={cn(tdClass, "text-right font-semibold tabular-nums")}>{mine}/{exam.maxMarks}</td>
                          <td className={cn(tdClass, "text-right font-heading font-semibold")}>{gradeFor(mine)}</td>
                        </>
                      ) : (
                        <>
                          <td className={cn(tdClass, "text-right font-semibold tabular-nums")}>{stats.average}%</td>
                          <td className={cn(tdClass, "text-right tabular-nums")}>{stats.highest}</td>
                          <td className={cn(tdClass, "text-right tabular-nums")}>{stats.passed}%</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <FormDrawer open={scheduling} onOpenChange={setScheduling} title="Schedule exam" description="Also adds it to the school calendar." submitLabel="Schedule" onSubmit={schedule}>
        <Field label="Exam name">
          <TextInput name="title" defaultValue="Unit Test 1" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Class" required>
            <SelectInput name="classId" className="w-full" defaultValue={myClassIds?.[0] ?? "10a"}>
              {classes
                .filter((item) => !myClassIds || myClassIds.includes(item.id))
                .map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
            </SelectInput>
          </Field>
          <Field label="Subject" required>
            <SelectInput name="subjectId" className="w-full" defaultValue="math">
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label="Date" required>
          <TextInput name="date" type="date" required min={TODAY_ISO} defaultValue="2026-05-25" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts" required>
            <TextInput name="start" type="time" required defaultValue="09:00" />
          </Field>
          <Field label="Ends" required>
            <TextInput name="end" type="time" required defaultValue="10:30" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <SelectInput name="type" className="w-full" defaultValue="Written">
              <option>Written</option>
              <option>Practical</option>
              <option>Oral</option>
            </SelectInput>
          </Field>
          <Field label="Room">
            <TextInput name="room" placeholder="Exam Hall A" />
          </Field>
        </div>
        <Field label="Invigilator" required>
          <SelectInput name="invigilatorId" className="w-full" defaultValue={user.teacherId ?? "t1"}>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
            ))}
          </SelectInput>
        </Field>
      </FormDrawer>
    </>
  );
}

function examStats(exam: Exam) {
  const scores = studentsInClass(exam.classId).map((student) => scoreFor(student.id, exam.subjectId, "ut1"));
  return {
    average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    highest: Math.max(...scores),
    passed: Math.round((scores.filter((score) => score >= 40).length / scores.length) * 100),
  };
}
