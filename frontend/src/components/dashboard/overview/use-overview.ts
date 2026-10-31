"use client";

import {
  BookMarked,
  Bus,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  MessageCircle,
  NotebookPen,
  UserPlus,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { Tone } from "@/components/dashboard/tone";
import { formatCompactINR, formatINR, formatTime } from "@/lib/format";
import {
  PERIODS,
  TODAY_DAY_INDEX,
  TODAY_ISO,
  allSlots,
  classAverage,
  classById,
  classTimetable,
  classes,
  gradeFor,
  gradedSubjects,
  invoiceStatus,
  routeById,
  routes,
  schoolGradeTrend,
  subjectById,
  studentById,
  teacherById,
  teacherClassIds,
  teacherTimetable,
  term,
  type Exam,
  type Slot,
  type TrendPoint,
} from "@/lib/mock-data";
import type { SessionUser } from "@/lib/session";
import {
  applicationsStore,
  assignmentsStore,
  attendanceStore,
  examsStore,
  invoicesStore,
  leaveStore,
  loansStore,
  markFor,
  marksStore,
  studentsStore,
  teachersStore,
  threadsForRole,
  threadsStore,
} from "@/lib/stores";

export type UpcomingItem = { id: string; name: string; role: string; tag: string; time: string; tone: Tone };
export type GlanceTile = { label: string; value: string; hint: string; href: string; icon: LucideIcon; tone: Tone };

export type Overview = {
  summary: string;
  attendance: {
    title: string;
    rate: number;
    rateLabel: string;
    rateHint: string;
    countLabel: string;
    countValue: string;
    absentRate: number;
    absentLabel: string;
    absentHint: string;
  };
  trend: { title: string; points: TrendPoint[] };
  tags: { title: string; items: { id: string; label: string; grade: string; href: string }[] };
  assessments: { today: number; upcoming: number; next: string };
  upcomingTitle: string;
  upcoming: UpcomingItem[];
  tiles: GlanceTile[];
};

const NEXT_PERIOD = 2; // 10:20, the period after morning break

// Ranked once from the sample marks; hand edits in the gradebook don't reorder this.
const CLASSES_BY_AVERAGE = classes
  .map((schoolClass) => ({ schoolClass, average: classAverage(schoolClass.id) }))
  .sort((a, b) => b.average - a.average);

function slotTime(slot: Slot) {
  return formatTime(PERIODS[slot.period]!.start);
}

function nextExamLabel(list: Exam[]) {
  const next = list.filter((exam) => exam.date >= TODAY_ISO).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))[0];
  if (!next) return "No exams ahead";
  return `Next: ${subjectById(next.subjectId).name} · ${classById(next.classId).short}`;
}

function assessmentStats(list: Exam[]) {
  return {
    today: list.filter((exam) => exam.date === TODAY_ISO).length,
    upcoming: list.filter((exam) => exam.date > TODAY_ISO).length,
    next: nextExamLabel(list),
  };
}

export function useOverview(user: SessionUser): Overview {
  const attendance = attendanceStore.useStore();
  const students = studentsStore.useStore();
  const teachers = teachersStore.useStore();
  const assignments = assignmentsStore.useStore();
  const invoices = invoicesStore.useStore();
  const applications = applicationsStore.useStore();
  const leave = leaveStore.useStore();
  const loans = loansStore.useStore();
  const exams = examsStore.useStore();
  const edits = marksStore.useStore();
  const threads = threadsStore.useStore();

  const unreadMessages = threadsForRole(threads, user.role).reduce((sum, thread) => sum + thread.unread, 0);
  const activeLoans = loans.filter((loan) => !loan.returned);

  function attendanceFor(classIds: string[]) {
    const marks = classIds.flatMap((id) => Object.values(attendance.marks[id] ?? {}));
    const enrolled = students.filter((student) => classIds.includes(student.classId)).length;
    const present = marks.filter((status) => status !== "absent").length;
    const absent = marks.length - present;
    return {
      enrolled,
      present,
      absent,
      rate: enrolled ? Math.round((present / enrolled) * 100) : 0,
      absentRate: enrolled ? Math.round((absent / enrolled) * 100) : 0,
    };
  }

  // --- Student and parent portal ---
  if (user.studentId) {
    const student = studentById(user.studentId, students);
    const schoolClass = classById(student.classId);
    const myExams = exams.filter((exam) => exam.classId === student.classId);
    const today = classTimetable(student.classId)
      .filter((slot) => slot.day === TODAY_DAY_INDEX)
      .sort((a, b) => a.period - b.period);
    const invoice = invoices.find((item) => item.studentId === student.id);
    const balance = invoice ? invoice.amount - invoice.paid : 0;
    const dueWork = assignments.filter((item) => item.classId === student.classId && item.status === "open" && !item.handedIn);
    const myLoans = activeLoans.filter((loan) => loan.studentId === student.id);
    const route = student.routeId ? routeById(student.routeId) : null;
    const first = user.role === "PARENT" ? student.name.split(" ")[0] : "You";
    const nextExam = myExams.find((exam) => exam.date === TODAY_ISO);

    return {
      summary: `${first} ${user.role === "PARENT" ? "has" : "have"} ${today.length} periods today.${
        nextExam ? ` ${subjectById(nextExam.subjectId).name} exam at ${formatTime(nextExam.start)}.` : ""
      }`,
      attendance: {
        title: "Attendance",
        rate: student.attendance,
        rateLabel: "This term",
        rateHint: `Week ${term.week} of the term`,
        countLabel: "Class",
        countValue: schoolClass.name,
        absentRate: 100 - student.attendance,
        absentLabel: "Missed",
        absentHint: `${Math.round(((100 - student.attendance) / 100) * 34)} of 34 school days`,
      },
      trend: {
        title: "Grade summary",
        points: schoolGradeTrend.map((point) => ({ ...point, value: Math.min(98, point.value + 6) })),
      },
      tags: {
        title: "By subject",
        items: gradedSubjects.slice(0, 4).map((subject) => ({
          id: subject.id,
          label: subject.code.split("-")[0]!,
          grade: gradeFor(markFor(edits, student.id, subject.id, "ut1")),
          href: "/dashboard/grades",
        })),
      },
      assessments: assessmentStats(myExams),
      upcomingTitle: "Today's classes",
      upcoming: today.slice(NEXT_PERIOD, NEXT_PERIOD + 4).map((slot) => ({
        id: slot.id,
        name: teacherById(slot.teacherId).name,
        role: subjectById(slot.subjectId).name,
        tag: slot.room,
        time: slotTime(slot),
        tone: subjectById(slot.subjectId).tone,
      })),
      tiles: [
        { label: "Fee balance", value: formatINR(balance), hint: balance > 0 ? "Due by 31 May" : "All paid up", href: "/dashboard/fees", icon: Wallet, tone: "yellow" },
        { label: "Work due", value: String(dueWork.length), hint: "Open assignments", href: "/dashboard/assignments", icon: ClipboardList, tone: "pink" },
        { label: "Exams ahead", value: String(myExams.filter((exam) => exam.date > TODAY_ISO).length), hint: "Unit Test 1", href: "/dashboard/exams", icon: NotebookPen, tone: "blue" },
        { label: "Books on loan", value: String(myLoans.length), hint: "From the library", href: "/dashboard/library", icon: BookMarked, tone: "lilac" },
        { label: "School bus", value: route ? route.id.toUpperCase() : "None", hint: route ? route.name : "Not on a route", href: "/dashboard/transport", icon: Bus, tone: "green" },
        { label: "Messages", value: String(unreadMessages), hint: "Unread", href: "/dashboard/messaging", icon: MessageCircle, tone: "peach" },
      ],
    };
  }

  // --- Teacher portal ---
  if (user.teacherId) {
    const teacherId = user.teacherId;
    const classIds = teacherClassIds(teacherId);
    const today = teacherTimetable(teacherId)
      .filter((slot) => slot.day === TODAY_DAY_INDEX)
      .sort((a, b) => a.period - b.period);
    const stats = attendanceFor(classIds);
    const openRegisters = classIds.filter((id) => !attendance.submitted[id]);
    const toGrade = assignments.filter((item) => item.teacherId === teacherId && item.status === "grading");
    const myOpenWork = assignments.filter((item) => item.teacherId === teacherId && item.status === "open");

    return {
      summary: `You have ${today.length} classes today and ${openRegisters.length} attendance ${
        openRegisters.length === 1 ? "register" : "registers"
      } waiting for you.`,
      attendance: {
        title: "Students",
        rate: stats.rate,
        rateLabel: "Attendance",
        rateHint: `${stats.present} today`,
        countLabel: "Enrolled",
        countValue: String(stats.enrolled),
        absentRate: stats.absentRate,
        absentLabel: "Absent",
        absentHint: `${stats.absent} students`,
      },
      trend: { title: "Grade summary", points: schoolGradeTrend },
      tags: {
        title: "By class",
        items: classIds.slice(0, 4).map((id) => ({
          id,
          label: classById(id).short,
          grade: gradeFor(classAverage(id)),
          href: `/dashboard/grades?class=${id}`,
        })),
      },
      assessments: assessmentStats(exams.filter((exam) => classIds.includes(exam.classId) || exam.invigilatorId === teacherId)),
      upcomingTitle: "My classes today",
      upcoming: today.slice(0, 4).map((slot) => ({
        id: slot.id,
        name: classById(slot.classId).name,
        role: subjectById(slot.subjectId).name,
        tag: slot.room,
        time: slotTime(slot),
        tone: classById(slot.classId).tone,
      })),
      tiles: [
        { label: "Registers open", value: String(openRegisters.length), hint: "Take attendance", href: "/dashboard/attendance", icon: ClipboardCheck, tone: "green" },
        { label: "To grade", value: String(toGrade.length), hint: "Assignments in", href: "/dashboard/assignments", icon: ClipboardList, tone: "pink" },
        { label: "Work set", value: String(myOpenWork.length), hint: "Still open", href: "/dashboard/assignments", icon: NotebookPen, tone: "yellow" },
        { label: "Classes today", value: String(today.length), hint: "See the timetable", href: "/dashboard/timetable", icon: CalendarCheck, tone: "blue" },
        { label: "My classes", value: String(classIds.length), hint: "This term", href: "/dashboard/classes", icon: UsersRound, tone: "lilac" },
        { label: "Messages", value: String(unreadMessages), hint: "Unread", href: "/dashboard/messaging", icon: MessageCircle, tone: "peach" },
      ],
    };
  }

  // --- Principal / admin portal ---
  const stats = attendanceFor(classes.map((item) => item.id));
  const teachersIn = teachers.filter((teacher) => teacher.status === "in").length;
  const examClasses = new Set(exams.filter((exam) => exam.date === TODAY_ISO).map((exam) => exam.classId)).size;
  const collected = invoices.reduce((sum, invoice) => sum + Math.min(invoice.paid, invoice.amount), 0);
  const billed = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdue = invoices.filter((invoice) => invoiceStatus(invoice) === "overdue").length;
  const activeApplications = applications.filter((item) => item.stage !== "enrolled" && item.stage !== "rejected");
  const pendingLeave = leave.filter((item) => item.status === "pending").length;
  const overdueBooks = activeLoans.filter((loan) => loan.due < TODAY_ISO).length;
  const delayed = routes.filter((route) => route.delayMinutes > 0).length;
  const teachersAway = teachers.length - teachersIn;

  const nextClasses = allSlots
    .filter((slot) => slot.day === TODAY_DAY_INDEX && slot.period === NEXT_PERIOD)
    .filter((slot) => teacherById(slot.teacherId).status === "in" && slot.classId.endsWith("a"))
    .reverse()
    .slice(0, 4);

  return {
    summary: `Here is today's overview. ${teachersIn} teachers checked in. ${examClasses} classes with exams.`,
    attendance: {
      title: "Students",
      rate: stats.rate,
      rateLabel: "Attendance",
      rateHint: `${stats.present} today`,
      countLabel: "Enrolled",
      countValue: String(stats.enrolled),
      absentRate: stats.absentRate,
      absentLabel: "Absent",
      absentHint: `${stats.absent} students`,
    },
    trend: { title: "Grade summary", points: schoolGradeTrend },
    tags: {
      title: "By class",
      items: CLASSES_BY_AVERAGE.slice(0, 4).map(({ schoolClass, average }) => ({
        id: schoolClass.id,
        label: schoolClass.short,
        grade: gradeFor(average),
        href: `/dashboard/grades?class=${schoolClass.id}`,
      })),
    },
    assessments: assessmentStats(exams),
    upcomingTitle: "Upcoming classes",
    upcoming: nextClasses.map((slot) => ({
      id: slot.id,
      name: teacherById(slot.teacherId).name,
      role: `Teacher · ${subjectById(slot.subjectId).name}`,
      tag: classById(slot.classId).short,
      time: slotTime(slot),
      tone: subjectById(slot.subjectId).tone,
    })),
    tiles: [
      { label: "Fees collected", value: formatCompactINR(collected), hint: `${Math.round((collected / billed) * 100)}% of term · ${overdue} overdue`, href: "/dashboard/fees", icon: Wallet, tone: "yellow" },
      { label: "Admissions", value: String(activeApplications.length), hint: "Applications in progress", href: "/dashboard/admissions", icon: UserPlus, tone: "pink" },
      { label: "Leave requests", value: String(pendingLeave), hint: `${teachersAway} teachers away today`, href: "/dashboard/teachers", icon: UsersRound, tone: "lilac" },
      { label: "Open registers", value: String(classes.filter((item) => !attendance.submitted[item.id]).length), hint: "Attendance not in yet", href: "/dashboard/attendance", icon: ClipboardCheck, tone: "green" },
      { label: "Library overdue", value: String(overdueBooks), hint: `${activeLoans.length} books out`, href: "/dashboard/library", icon: BookMarked, tone: "blue" },
      { label: "Buses delayed", value: String(delayed), hint: `${routes.length} routes running`, href: "/dashboard/transport", icon: Bus, tone: "peach" },
    ],
  };
}

