"use client";

import {
  seededActivities,
  seededApplications,
  seededAssignments,
  seededAttendance,
  seededEvents,
  seededInvoices,
  seededLeave,
  seededLoans,
  seededNotices,
  seededThreads,
  exams as seededExams,
  scoreFor,
  students as seededStudents,
  teachers as seededTeachers,
  type Activity,
  type Payment,
  type Thread,
} from "@/lib/mock-data";
import { isOffice, type Role } from "@/lib/navigation";
import { createStore } from "@/lib/shared-store";

// One store per module. TODO: replace each with a fetch + mutation once the API exists.
export const studentsStore = createStore(seededStudents);
export const teachersStore = createStore(seededTeachers);
export const attendanceStore = createStore(seededAttendance);
export const assignmentsStore = createStore(seededAssignments);
export const examsStore = createStore(seededExams);
export const classTeachersStore = createStore<Record<string, string>>({});
export const eventsStore = createStore(seededEvents);
export const noticesStore = createStore(seededNotices);
export const threadsStore = createStore(seededThreads);
export const invoicesStore = createStore(seededInvoices);
export const paymentsStore = createStore<Payment[]>([]);
export const applicationsStore = createStore(seededApplications);
export const loansStore = createStore(seededLoans);
export const leaveStore = createStore(seededLeave);
export const substitutionsStore = createStore<Record<string, string>>({});
export const marksStore = createStore<Record<string, number>>({});

const activitiesStore = createStore(seededActivities);
export const useActivities = activitiesStore.useStore;

export type Toast = { id: number; message: string };
const toastStore = createStore<Toast[]>([]);
export const useToasts = toastStore.useStore;

let nextId = 1;

/** A unique id for a record created in this session. */
export function newId(prefix: string) {
  return `${prefix}-new-${nextId++}`;
}

/** Short confirmation at the bottom of the screen. */
export function toast(message: string) {
  const id = nextId++;
  toastStore.set((list) => [...list, { id, message }]);
  setTimeout(() => toastStore.set((list) => list.filter((item) => item.id !== id)), 4000);
}

/** Adds a line to "Recent activities" on the dashboard. */
export function logActivity(activity: Omit<Activity, "id" | "when">) {
  activitiesStore.set((list) => [{ ...activity, id: `live-${nextId++}`, when: "Just now" }, ...list]);
}

/** A key for marks that were edited by hand in the gradebook. */
export function markKey(studentId: string, subjectId: string, assessmentId: string) {
  return `${studentId}/${subjectId}/${assessmentId}`;
}

/** A student's mark, preferring a hand-edited value. */
export function markFor(
  edits: Record<string, number>,
  studentId: string,
  subjectId: string,
  assessmentId: string
) {
  return edits[markKey(studentId, subjectId, assessmentId)] ?? scoreFor(studentId, subjectId, assessmentId);
}

export function threadsForRole(threads: Thread[], role: Role): Thread[] {
  const audience = isOffice(role) ? "office" : role === "TEACHER" ? "teacher" : "family";
  return threads.filter((thread) => thread.audience === audience);
}
