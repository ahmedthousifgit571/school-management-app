"use client";

import { useState } from "react";
import { Printer } from "lucide-react";

import { Field, Pill, TextArea, buttonClass, tdClass, thClass } from "@/components/dashboard/controls";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import {
  assessments,
  classById,
  gradeFor,
  gradedSubjects,
  term,
  type Student,
} from "@/lib/mock-data";
import { markFor, marksStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

export function overallFor(edits: Record<string, number>, studentId: string, assessmentId: string) {
  const total = gradedSubjects.reduce((sum, subject) => sum + markFor(edits, studentId, subject.id, assessmentId), 0);
  return Math.round(total / gradedSubjects.length);
}

function defaultRemark(overall: number, firstName: string) {
  if (overall >= 85) return `${firstName} is doing excellent work and leads by example in class.`;
  if (overall >= 70) return `${firstName} is making steady progress. Keep up the regular revision.`;
  if (overall >= 50) return `${firstName} is working towards the expected level. Extra practice will help.`;
  return `${firstName} needs extra support this term. Please meet the class teacher.`;
}

/** Marks for every assessment, the overall grade, attendance and remarks. */
export function ReportCard({ student, canEditRemarks }: { student: Student; canEditRemarks: boolean }) {
  const edits = marksStore.useStore();
  const latest = assessments[assessments.length - 1]!;
  const overall = overallFor(edits, student.id, latest.id);
  const [remarks, setRemarks] = useState(() => defaultRemark(overall, student.name.split(" ")[0]!));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-[28px] bg-white p-4">
        <UserAvatar name={student.name} size="xl" />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-xl font-medium">{student.name}</p>
          <p className="text-sm text-muted-foreground">
            {classById(student.classId).name} · Roll {student.roll} · {term.name}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill tone="green">Attendance {student.attendance}%</Pill>
            <Pill tone="yellow">Overall {overall}% · {gradeFor(overall)}</Pill>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[28px] bg-white p-3">
        <table className="w-full text-sm">
          <caption className="sr-only">Marks out of 100 by subject</caption>
          <thead>
            <tr>
              <th scope="col" className={thClass}>Subject</th>
              {assessments.map((assessment) => (
                <th key={assessment.id} scope="col" className={cn(thClass, "text-right")}>{assessment.name}</th>
              ))}
              <th scope="col" className={cn(thClass, "text-right")}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {gradedSubjects.map((subject) => {
              const latestMark = markFor(edits, student.id, subject.id, latest.id);
              return (
                <tr key={subject.id} className="border-t-[1.5px] border-black/[0.06]">
                  <th scope="row" className={cn(tdClass, "text-left font-medium")}>{subject.name}</th>
                  {assessments.map((assessment) => (
                    <td key={assessment.id} className={cn(tdClass, "text-right tabular-nums")}>
                      {markFor(edits, student.id, subject.id, assessment.id)}
                    </td>
                  ))}
                  <td className={cn(tdClass, "text-right font-heading font-semibold")}>{gradeFor(latestMark)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canEditRemarks ? (
        <Field label="Teacher's remarks">
          <TextArea rows={3} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        </Field>
      ) : (
        <section className="rounded-[28px] bg-white p-4">
          <h3 className="text-sm font-semibold">Teacher&apos;s remarks</h3>
          <p className="mt-1 font-hand text-xl leading-snug">{remarks}</p>
        </section>
      )}

      <button type="button" onClick={() => window.print()} className={cn(buttonClass("outline"), "print:hidden")}>
        <Printer aria-hidden /> Print report card
      </button>
    </div>
  );
}
