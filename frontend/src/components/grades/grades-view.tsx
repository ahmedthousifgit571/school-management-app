"use client";

import { useMemo, useState } from "react";
import { FileText, Send } from "lucide-react";

import { BarList, ColumnChart, TrendChart } from "@/components/dashboard/charts";
import {
  Drawer,
  Pill,
  SelectInput,
  buttonClass,
  filterRowClass,
  rowClass,
  tdClass,
  thClass,
} from "@/components/dashboard/controls";
import { PageHeader, Panel, StatCard, StatRow } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { ReportCard, overallFor } from "@/components/grades/report-card";
import {
  assessments,
  classAverage,
  classById,
  classes,
  gradeFor,
  gradeScale,
  gradedSubjects,
  schoolAverage,
  schoolGradeTrend,
  studentById,
  students as seededStudents,
  teacherClassIds,
} from "@/lib/mock-data";
import type { SessionUser } from "@/lib/session";
import { logActivity, markFor, markKey, marksStore, studentsStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

const PASS_MARK = 40;
const SUPPORT_BELOW = 50;

export function GradesView({
  user,
  initialClassId,
  initialStudentId,
}: {
  user: SessionUser;
  initialClassId?: string;
  initialStudentId?: string;
}) {
  if (user.studentId) return <FamilyGrades user={user} />;
  return <StaffGrades user={user} initialClassId={initialClassId} initialStudentId={initialStudentId} />;
}

function FamilyGrades({ user }: { user: SessionUser }) {
  const students = studentsStore.useStore();
  const edits = marksStore.useStore();
  const student = studentById(user.studentId!, students);
  const overall = overallFor(edits, student.id, "ut1");
  const previous = overallFor(edits, student.id, "ct1");
  const best = [...gradedSubjects].sort(
    (a, b) => markFor(edits, student.id, b.id, "ut1") - markFor(edits, student.id, a.id, "ut1")
  )[0]!;

  return (
    <>
      <PageHeader
        eyebrow={classById(student.classId).name}
        title="Grades & reports"
        description={user.role === "PARENT" ? `${student.name.split(" ")[0]}'s marks and report card.` : "Your marks and report card."}
      />
      <StatRow label="Grade summary">
        <StatCard label="Overall" value={`${overall}%`} hint={`Grade ${gradeFor(overall)}`} fill={toneStyles.pink.fill} doodle="heart" />
        <StatCard label="Since last test" value={`${overall >= previous ? "+" : ""}${overall - previous}`} hint="points" fill={toneStyles.blue.fill} />
        <StatCard label="Best subject" value={best.name} hint={`${markFor(edits, student.id, best.id, "ut1")} in Unit Test 1`} fill={toneStyles.yellow.fill} doodle="star" />
        <StatCard label="Attendance" value={`${student.attendance}%`} hint="this term" fill={toneStyles.green.fill} />
      </StatRow>
      <div className="max-w-3xl">
        <ReportCard student={student} canEditRemarks={false} />
      </div>
    </>
  );
}

function StaffGrades({
  user,
  initialClassId,
  initialStudentId,
}: {
  user: SessionUser;
  initialClassId?: string;
  initialStudentId?: string;
}) {
  const edits = marksStore.useStore();
  const students = studentsStore.useStore();
  const allowedIds = user.teacherId ? teacherClassIds(user.teacherId) : classes.map((item) => item.id);
  const linkedStudent = initialStudentId ? seededStudents.find((student) => student.id === initialStudentId) : undefined;

  const [classId, setClassId] = useState(() => {
    const wanted = linkedStudent?.classId ?? initialClassId;
    return wanted && allowedIds.includes(wanted) ? wanted : allowedIds[0]!;
  });
  const [assessmentId, setAssessmentId] = useState("ut1");
  const [reportId, setReportId] = useState<string | null>(initialStudentId ?? null);
  const [dirty, setDirty] = useState(false);

  const roster = students.filter((student) => student.classId === classId);
  const report = reportId ? students.find((student) => student.id === reportId) : undefined;

  const rows = roster.map((student) => ({ student, overall: overallFor(edits, student.id, assessmentId) }));
  const classMean = Math.round(rows.reduce((sum, row) => sum + row.overall, 0) / Math.max(1, rows.length));
  const passRate = Math.round((rows.filter((row) => row.overall >= PASS_MARK).length / Math.max(1, rows.length)) * 100);
  const support = rows.filter((row) => row.overall < SUPPORT_BELOW);

  const distribution = gradeScale.map(({ grade }) => ({
    label: grade,
    value: rows.filter((row) => gradeFor(row.overall) === grade).length,
  }));

  const rankings = useMemo(
    () =>
      allowedIds
        .map((id) => ({ id, average: classAverage(id, assessmentId) }))
        .sort((a, b) => b.average - a.average),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allowedIds is fixed for the session
    [assessmentId, user.teacherId]
  );
  const top = rankings[0]!;

  function setMark(studentId: string, subjectId: string, raw: string) {
    const value = Math.max(0, Math.min(100, Number(raw)));
    if (raw === "" || Number.isNaN(value)) return;
    marksStore.set((current) => ({ ...current, [markKey(studentId, subjectId, assessmentId)]: value }));
    setDirty(true);
  }

  function publish() {
    const className = classById(classId).name;
    const assessmentName = assessments.find((item) => item.id === assessmentId)!.name;
    logActivity({ actor: user.name, text: `published ${className} ${assessmentName} marks`, kind: "grade", tone: "pink" });
    toast(`${className} marks published`);
    setDirty(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="Marks, trends, report cards"
        title="Grades & reports"
        description="Enter marks in the gradebook, spot who needs support, and print report cards."
        actions={
          <button type="button" onClick={publish} className={buttonClass("dark")}>
            <Send aria-hidden /> {dirty ? "Publish changes" : "Publish marks"}
          </button>
        }
      />

      <StatRow label="Grade summary">
        <StatCard label="School average" value={`${schoolAverage(assessmentId)}%`} hint="across all classes" fill={toneStyles.pink.fill} doodle="heart" />
        <StatCard label="Top class" value={classById(top.id).short} hint={`${top.average}% average`} fill={toneStyles.yellow.fill} doodle="star" />
        <StatCard label="Pass rate" value={`${passRate}%`} hint={`in ${classById(classId).short}, pass mark ${PASS_MARK}`} fill={toneStyles.green.fill} />
        <StatCard label="Need support" value={String(support.length)} hint={`below ${SUPPORT_BELOW}% in ${classById(classId).short}`} fill={toneStyles.peach.fill} />
      </StatRow>

      <Panel
        title="Gradebook"
        description={`${classById(classId).name} averages ${classMean}% · marks out of 100`}
        action={
          <div className={filterRowClass}>
            <SelectInput aria-label="Class" value={classId} onChange={(event) => setClassId(event.target.value)}>
              {classes
                .filter((item) => allowedIds.includes(item.id))
                .map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
            </SelectInput>
            <SelectInput aria-label="Assessment" value={assessmentId} onChange={(event) => setAssessmentId(event.target.value)}>
              {assessments.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </SelectInput>
          </div>
        }
        bodyClassName="p-3 md:p-4"
      >
        <div className="max-h-[34rem] overflow-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr>
                <th scope="col" className={cn(thClass, "sticky left-0 z-10 bg-white")}>Student</th>
                {gradedSubjects.map((subject) => (
                  <th key={subject.id} scope="col" title={subject.name} className={cn(thClass, "text-center")}>
                    {subject.code.split("-")[0]}
                  </th>
                ))}
                <th scope="col" className={cn(thClass, "text-right")}>Overall</th>
                <th scope="col" className={cn(thClass, "text-right")}>Grade</th>
                <th scope="col" className={thClass}><span className="sr-only">Report card</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ student, overall }) => (
                <tr key={student.id} className={rowClass}>
                  <th scope="row" className={cn(tdClass, "sticky left-0 bg-white text-left font-medium")}>
                    <span className="flex items-center gap-2">
                      <UserAvatar name={student.name} size="sm" />
                      <span className="truncate">{student.name}</span>
                    </span>
                  </th>
                  {gradedSubjects.map((subject) => (
                    <td key={subject.id} className="px-1 py-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        aria-label={`${subject.name} marks for ${student.name}`}
                        value={markFor(edits, student.id, subject.id, assessmentId)}
                        onChange={(event) => setMark(student.id, subject.id, event.target.value)}
                        className="h-9 w-14 rounded-full border-[1.5px] border-transparent bg-black/[0.04] text-center text-sm tabular-nums outline-none transition-colors [appearance:textfield] hover:border-black/20 focus-visible:border-ink [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                  ))}
                  <td className={cn(tdClass, "text-right font-semibold tabular-nums")}>{overall}%</td>
                  <td className={cn(tdClass, "text-right")}>
                    <Pill tone={overall >= 70 ? "green" : overall >= SUPPORT_BELOW ? "yellow" : "peach"}>{gradeFor(overall)}</Pill>
                  </td>
                  <td className={cn(tdClass, "text-right")}>
                    <button type="button" onClick={() => setReportId(student.id)} className={buttonClass("soft", "sm")}>
                      <FileText aria-hidden /> Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Average score" description="School-wide, this term">
          <TrendChart
            points={schoolGradeTrend}
            label="School average score by week"
            min={50}
            max={100}
            ticks={[50, 60, 70, 80, 90, 100]}
            className="min-h-52"
          />
        </Panel>
        <Panel title="Grade spread" description={`Students in ${classById(classId).short}`}>
          <ColumnChart items={distribution} label="Students by grade" columnClassName="bg-pastel-lilac border-[1.5px] border-b-0 border-ink" />
        </Panel>
        <Panel title="Class ranking" description="Best five by average">
          <BarList
            label="Class averages"
            barClassName="bg-pastel-blue"
            items={rankings.slice(0, 5).map((item) => ({
              label: classById(item.id).short,
              value: item.average,
              display: `${item.average}%`,
            }))}
          />
        </Panel>
      </div>

      <Drawer
        open={report !== undefined}
        onOpenChange={(open) => !open && setReportId(null)}
        title="Report card"
        description={report?.name}
        printable
      >
        {report && <ReportCard key={report.id} student={report} canEditRemarks />}
      </Drawer>
    </>
  );
}
