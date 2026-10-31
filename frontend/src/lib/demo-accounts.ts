import type { Tone } from "@/components/dashboard/tone";
import { classById, demoStudent } from "@/lib/mock-data";
import type { Role } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";

// The API's mock login only issues a role, so each role maps to a sample person.
// TODO: remove these once /api/auth/login is backed by the database.

/** Shown on the login page; the sample API accepts any password. */
export const DEMO_PASSWORD = "mgm-demo";

export type DemoAccount = SessionUser & {
  /** The role as people say it, e.g. "Principal". */
  label: string;
  summary: string;
  tone: Tone;
};

const childName = demoStudent.name.split(" ")[0]!;
const childClass = classById(demoStudent.classId).name;

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "SUPERADMIN",
    label: "Super admin",
    title: "Director",
    name: "Imran Qadir",
    email: "superadmin@school.test",
    summary: "The whole school, as its director. Same access as the principal for now.",
    tone: "lilac",
  },
  {
    role: "ADMIN",
    label: "Principal",
    title: "Principal",
    name: "Sarah Thomas",
    email: "principal@school.test",
    summary: "Runs the school: all 16 sections, every student and teacher.",
    tone: "pink",
  },
  {
    role: "TEACHER",
    label: "Teacher",
    teacherId: "t0",
    name: "Ayesha Rahman",
    email: "teacher@school.test",
    summary: "Registers, marks and assignments for 8 maths classes.",
    tone: "yellow",
  },
  {
    role: "STUDENT",
    label: "Student",
    studentId: demoStudent.id,
    name: demoStudent.name,
    email: "student@school.test",
    summary: `In ${childClass}: own timetable, marks, homework and fees.`,
    tone: "blue",
  },
  {
    role: "PARENT",
    label: "Parent",
    studentId: demoStudent.id,
    name: demoStudent.guardian.name,
    email: "parent@school.test",
    summary: `Follows ${childName}'s marks, attendance and fees.`,
    tone: "green",
  },
];

export function accountForRole(role: Role): DemoAccount {
  return DEMO_ACCOUNTS.find((account) => account.role === role)!;
}

export function accountForEmail(email: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((account) => account.email === email.trim().toLowerCase());
}
