"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardPlus, Clock3 } from "lucide-react";

import {
  EmptyState,
  Field,
  FormDrawer,
  Pill,
  ProgressBar,
  SearchField,
  Segmented,
  SelectInput,
  TextArea,
  TextInput,
  buttonClass,
} from "@/components/dashboard/controls";
import { PageHeader, StatCard, StatRow, cardOutline } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { daysBetween, formatDate } from "@/lib/format";
import {
  CLASS_SIZE,
  TODAY_ISO,
  classById,
  classes,
  studentById,
  subjectById,
  subjects,
  teacherById,
  teacherClassIds,
  teachers,
  type Assignment,
} from "@/lib/mock-data";
import { canManage } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";
import { assignmentsStore, logActivity, newId, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | Assignment["status"];

const NEXT_STEP: Record<Assignment["status"], { label: string; next: Assignment["status"] } | null> = {
  open: { label: "Stop & grade", next: "grading" },
  grading: { label: "Mark as graded", next: "closed" },
  closed: null,
};

const STATUS_LABEL: Record<Assignment["status"], string> = {
  open: "Open",
  grading: "To grade",
  closed: "Graded",
};

function dueLabel(assignment: Assignment) {
  if (assignment.status !== "open") return `Was due ${formatDate(assignment.due)}`;
  const days = daysBetween(TODAY_ISO, assignment.due);
  if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} late`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function AssignmentsView({ user }: { user: SessionUser }) {
  const all = assignmentsStore.useStore();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const student = user.studentId ? studentById(user.studentId) : null;
  const inScope = all.filter((item) => {
    if (student) return item.classId === student.classId;
    if (user.teacherId) return item.teacherId === user.teacherId;
    return true;
  });
  const term = query.trim().toLowerCase();
  const visible = inScope
    .filter((item) => status === "all" || item.status === status)
    .filter((item) => !term || item.title.toLowerCase().includes(term) || subjectById(item.subjectId).name.toLowerCase().includes(term))
    .sort((a, b) => a.due.localeCompare(b.due));

  const count = (value: Assignment["status"]) => inScope.filter((item) => item.status === value).length;
  const dueSoon = inScope.filter((item) => item.status === "open" && daysBetween(TODAY_ISO, item.due) <= 7);
  const handedIn = inScope.filter((item) => item.handedIn).length;
  const classOptions = user.teacherId
    ? classes.filter((item) => teacherClassIds(user.teacherId!).includes(item.id))
    : classes;

  function advance(assignment: Assignment) {
    const step = NEXT_STEP[assignment.status];
    if (!step) return;
    assignmentsStore.set((list) => list.map((item) => (item.id === assignment.id ? { ...item, status: step.next } : item)));
    toast(`“${assignment.title}” moved to ${STATUS_LABEL[step.next].toLowerCase()}`);
  }

  function handIn(assignment: Assignment) {
    assignmentsStore.set((list) =>
      list.map((item) => (item.id === assignment.id ? { ...item, handedIn: true, submitted: item.submitted + 1 } : item))
    );
    logActivity({ actor: student!.name, text: `handed in “${assignment.title}”`, kind: "assignment", tone: subjectById(assignment.subjectId).tone });
    toast("Handed in. Nice one!");
  }

  function create(data: FormData) {
    const title = String(data.get("title")).trim();
    const classId = String(data.get("classId"));
    const subjectId = String(data.get("subjectId"));
    const assignment: Assignment = {
      id: newId("a"),
      title,
      description: String(data.get("description")).trim(),
      classId,
      subjectId,
      teacherId: String(data.get("teacherId") ?? user.teacherId),
      assigned: TODAY_ISO,
      due: String(data.get("due")),
      submitted: 0,
      status: "open",
    };
    assignmentsStore.set((list) => [assignment, ...list]);
    logActivity({ actor: user.name, text: `set “${title}” for ${classById(classId).short}`, kind: "assignment", tone: subjectById(subjectId).tone });
    toast(`“${title}” set for ${classById(classId).name}`);
    setCreating(false);
  }

  return (
    <>
      <PageHeader
        eyebrow={student ? "Your homework" : "Set it, track it, grade it"}
        title="Assignments"
        description={student ? "Everything your teachers have set. Hand work in before the due date." : "Set work for a class, watch submissions come in, and mark it as graded."}
        actions={
          canManage(user.role) && (
            <button type="button" onClick={() => setCreating(true)} className={buttonClass("dark")}>
              <ClipboardPlus aria-hidden /> New assignment
            </button>
          )
        }
      />

      <StatRow label="Assignment summary">
        <StatCard label="Open" value={String(count("open"))} hint="still collecting" fill={toneStyles.yellow.fill} doodle="star" />
        <StatCard label="Due this week" value={String(dueSoon.length)} hint="in the next 7 days" fill={toneStyles.pink.fill} doodle="heart" />
        {student ? (
          <StatCard label="Handed in" value={String(handedIn)} hint="this term" fill={toneStyles.green.fill} />
        ) : (
          <StatCard label="To grade" value={String(count("grading"))} hint="ready for marking" fill={toneStyles.green.fill} />
        )}
        <StatCard label="Graded" value={String(count("closed"))} hint="done this term" fill={toneStyles.blue.fill} />
      </StatRow>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          label="Filter by status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All", count: inScope.length },
            { value: "open", label: "Open", count: count("open") },
            { value: "grading", label: "To grade", count: count("grading") },
            { value: "closed", label: "Graded", count: count("closed") },
          ]}
        />
        <SearchField value={query} onChange={setQuery} placeholder="Find an assignment" className="lg:w-72" />
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Nothing here" hint="Try a different filter." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {visible.map((assignment) => {
            const subject = subjectById(assignment.subjectId);
            const step = NEXT_STEP[assignment.status];
            const late = assignment.status === "open" && assignment.due < TODAY_ISO;
            const percent = Math.round((assignment.submitted / CLASS_SIZE) * 100);
            return (
              <li key={assignment.id} className={cn("flex flex-col gap-3 bg-white p-4", cardOutline)}>
                <div className="flex items-start gap-3">
                  <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink", toneStyles[subject.tone].fill)}>
                    <subject.icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-heading text-lg font-medium leading-tight">{assignment.title}</h2>
                    <p className="text-xs font-medium text-muted-foreground">
                      {subject.name} · {classById(assignment.classId).name} · {teacherById(assignment.teacherId).name}
                    </p>
                  </div>
                  <Pill tone={assignment.status === "open" ? "yellow" : assignment.status === "grading" ? "pink" : "green"}>
                    {STATUS_LABEL[assignment.status]}
                  </Pill>
                </div>

                <p className="text-sm text-muted-foreground">{assignment.description}</p>

                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", late && "text-destructive")}>
                    <Clock3 className="size-4" aria-hidden /> {dueLabel(assignment)}
                  </span>
                  {!student && (
                    <span className="flex min-w-40 flex-1 items-center gap-2">
                      <ProgressBar value={percent} label={`${assignment.title} submissions`} className="flex-1" />
                      <span className="text-xs font-medium tabular-nums text-muted-foreground">
                        {assignment.submitted}/{CLASS_SIZE}
                      </span>
                    </span>
                  )}
                  <span className="ml-auto">
                    {student ? (
                      assignment.handedIn ? (
                        <Pill tone="green" icon={CheckCircle2}>Handed in</Pill>
                      ) : assignment.status === "open" && user.role === "STUDENT" ? (
                        <button type="button" onClick={() => handIn(assignment)} className={buttonClass("dark", "sm")}>
                          Hand in
                        </button>
                      ) : assignment.status === "open" ? (
                        <Pill tone="yellow">Not handed in yet</Pill>
                      ) : null
                    ) : (
                      step && (
                        <button type="button" onClick={() => advance(assignment)} className={buttonClass("outline", "sm")}>
                          {step.label}
                        </button>
                      )
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <FormDrawer open={creating} onOpenChange={setCreating} title="New assignment" submitLabel="Set assignment" onSubmit={create}>
        <Field label="Title" required>
          <TextInput name="title" required placeholder="e.g. Trigonometry worksheet" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Class" required>
            <SelectInput name="classId" className="w-full" defaultValue={classOptions[0]?.id}>
              {classOptions.map((item) => (
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
        {!user.teacherId && (
          <Field label="Teacher" required>
            <SelectInput name="teacherId" className="w-full" defaultValue="t0">
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </SelectInput>
          </Field>
        )}
        <Field label="Due date" required>
          <TextInput name="due" type="date" required min={TODAY_ISO} defaultValue="2026-05-22" />
        </Field>
        <Field label="Instructions" required>
          <TextArea name="description" required rows={3} placeholder="What should students do?" />
        </Field>
      </FormDrawer>
    </>
  );
}
