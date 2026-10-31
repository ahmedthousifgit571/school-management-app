// Sample data for the dashboard UI. Each export stands in for an API call —
// replace them with real endpoints as the backend grows, then delete this folder.
// Lists are generated deterministically so server and browser always agree, and
// totals on the dashboard always tie out with the module pages.
import {
  Atom,
  BookOpen,
  Calculator,
  Dna,
  Dumbbell,
  FlaskConical,
  Globe,
  Landmark,
  Languages,
  Laptop,
  Music,
  Palette,
  type LucideIcon,
} from "lucide-react";

import type { Tone } from "@/components/dashboard/tone";
import { TONES } from "@/components/dashboard/tone";

/** The sample school's "today". Swap for the real date once data comes from the API. */
export const TODAY_ISO = "2026-05-15";
export const TODAY_DAY_INDEX = 4; // Friday in DAYS below

export const term = { name: "Term 1 · 2026–27", week: 7, totalWeeks: 16 };

export function hash(seed: string): number {
  let value = 2166136261;
  for (const char of seed) value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0;
  return value;
}

// --- Subjects ---------------------------------------------------------------

export type Subject = {
  id: string;
  name: string;
  code: string;
  tone: Tone;
  icon: LucideIcon;
  /** Appears on report cards. */
  graded: boolean;
  /** Taught in a specialist room rather than the class's home room. */
  room?: string;
};

export const subjects: Subject[] = [
  { id: "math", name: "Mathematics", code: "MATH-101", tone: "yellow", icon: Calculator, graded: true },
  { id: "eng", name: "English", code: "ENG-101", tone: "pink", icon: BookOpen, graded: true },
  { id: "phy", name: "Physics", code: "PHY-101", tone: "blue", icon: Atom, graded: true, room: "Physics Lab" },
  { id: "chem", name: "Chemistry", code: "CHM-101", tone: "green", icon: FlaskConical, graded: true, room: "Chemistry Lab" },
  { id: "bio", name: "Biology", code: "BIO-101", tone: "peach", icon: Dna, graded: true, room: "Biology Lab" },
  { id: "hist", name: "History", code: "HIS-101", tone: "lilac", icon: Landmark, graded: true },
  { id: "geo", name: "Geography", code: "GEO-101", tone: "blue", icon: Globe, graded: true },
  { id: "hin", name: "Hindi", code: "HIN-101", tone: "pink", icon: Languages, graded: true },
  { id: "cs", name: "Computer Science", code: "CSC-101", tone: "lilac", icon: Laptop, graded: false, room: "Computer Lab" },
  { id: "art", name: "Art", code: "ART-101", tone: "yellow", icon: Palette, graded: false, room: "Art Studio" },
  { id: "mus", name: "Music", code: "MUS-101", tone: "green", icon: Music, graded: false, room: "Music Room" },
  { id: "pe", name: "Physical Education", code: "PED-101", tone: "peach", icon: Dumbbell, graded: false, room: "Main Ground" },
];

export const gradedSubjects = subjects.filter((subject) => subject.graded);

export function subjectById(id: string): Subject {
  return subjects.find((subject) => subject.id === id)!;
}

// --- Teachers ---------------------------------------------------------------

export type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjectId: string;
  qualification: string;
  joined: string;
  status: "in" | "leave";
  checkIn: string | null;
};

// Three teachers per subject, in `subjects` order.
const TEACHER_NAMES = [
  "Ayesha Rahman", "Vikram Iyer", "Leela Krishnan",
  "Rhea Kapoor", "Daniel Thomas", "Mira Joseph",
  "Arvind Menon", "Sana Qureshi", "Tarun Bose",
  "Nalini Rao", "Joseph Mathew", "Preeti Saxena",
  "Hari Prasad", "Divya Nambiar", "Salma Begum",
  "Gautam Sen", "Uma Pillai", "Ritu Malhotra",
  "Kiran Desai", "Feroz Khan", "Anita Dutta",
  "Sunita Verma", "Mohan Tripathi", "Kavita Joshi",
  "Neeraj Bansal", "Pallavi Shetty", "Rizwan Siddiqui",
  "Tara Chatterjee", "Manish Gill", "Ishita Roy",
  "Elena D'Souza", "Prakash Nair", "Lata Hegde",
  "Rohit Chauhan", "Meghna Sharma", "Arjun Dey",
];

const ON_LEAVE = new Set([7, 15, 22, 31]);
const QUALIFICATIONS = ["M.Sc, B.Ed", "M.A, B.Ed", "Ph.D", "M.Ed", "B.Ed"];

export const teachers: Teacher[] = TEACHER_NAMES.map((name, index) => {
  const onLeave = ON_LEAVE.has(index);
  const slug = name.toLowerCase().replaceAll("'", "").replaceAll(" ", ".");
  return {
    id: `t${index}`,
    name,
    email: `${slug}@school.test`,
    phone: `+91 90000 1${String(index).padStart(4, "0")}`,
    subjectId: subjects[Math.floor(index / 3)]!.id,
    qualification: QUALIFICATIONS[index % QUALIFICATIONS.length]!,
    joined: String(2008 + (hash(name) % 17)),
    status: onLeave ? "leave" : "in",
    checkIn: onLeave ? null : `07:${String(35 + (hash(name) % 24)).padStart(2, "0")}`,
  };
});

export function teacherById(id: string): Teacher {
  return teachers.find((teacher) => teacher.id === id)!;
}

// --- Classes ----------------------------------------------------------------

export type SchoolClass = {
  id: string;
  grade: number;
  section: string;
  name: string;
  short: string;
  room: string;
  tone: Tone;
  classTeacherId: string;
};

const SECTIONS = ["A", "B", "C"];
export const GRADES = [5, 6, 7, 8, 9, 10, 11, 12];

export const classes: SchoolClass[] = GRADES.flatMap((grade, gradeIndex) =>
  SECTIONS.map((section, sectionIndex) => {
    const index = gradeIndex * SECTIONS.length + sectionIndex;
    return {
      id: `${grade}${section.toLowerCase()}`,
      grade,
      section,
      name: `Grade ${grade}-${section}`,
      short: `${grade}-${section}`,
      room: `Room ${grade}0${sectionIndex + 1}`,
      tone: TONES[index % TONES.length]!,
      classTeacherId: `t${index}`,
    };
  })
);

export function classById(id: string): SchoolClass {
  return classes.find((schoolClass) => schoolClass.id === id)!;
}

// --- Timetable --------------------------------------------------------------

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const PERIODS = [
  { id: 0, label: "Period 1", start: "08:30", end: "09:15" },
  { id: 1, label: "Period 2", start: "09:15", end: "10:00" },
  { id: 2, label: "Period 3", start: "10:20", end: "11:05" },
  { id: 3, label: "Period 4", start: "11:05", end: "11:50" },
  { id: 4, label: "Period 5", start: "12:30", end: "13:15" },
  { id: 5, label: "Period 6", start: "13:15", end: "14:00" },
  { id: 6, label: "Period 7", start: "14:00", end: "14:45" },
];

/** Shown after these periods. */
export const BREAKS: Record<number, string> = {
  1: "Break · 10:00 – 10:20",
  3: "Lunch · 11:50 – 12:30",
};

export type Slot = {
  id: string;
  day: number;
  period: number;
  classId: string;
  subjectId: string;
  teacherId: string;
  room: string;
};

/**
 * Subjects rotate so that only classes 12 apart share a subject in any period, and
 * those two always get different teachers: nobody is ever double-booked.
 */
function teacherIndex(classIndex: number, subjectIndex: number) {
  const pool = (Math.floor(classIndex / 12) + ((classIndex % 12) % 3)) % 3;
  return subjectIndex * 3 + pool;
}

function buildSlot(classIndex: number, day: number, period: number): Slot {
  const schoolClass = classes[classIndex]!;
  // Twice the day, so the week's slots reach all 12 subjects for every class.
  const subjectIndex = (classIndex + day * 2 + period) % subjects.length;
  const subject = subjects[subjectIndex]!;
  const room = subject.room
    ? `${subject.room}${subject.room.endsWith("Ground") ? "" : ` ${Math.floor(classIndex / 12) + 1}`}`
    : schoolClass.room;
  return {
    id: `${schoolClass.id}-${day}-${period}`,
    day,
    period,
    classId: schoolClass.id,
    subjectId: subject.id,
    teacherId: `t${teacherIndex(classIndex, subjectIndex)}`,
    room,
  };
}

export const allSlots: Slot[] = classes.flatMap((_, classIndex) =>
  DAYS.flatMap((__, day) => PERIODS.map((period) => buildSlot(classIndex, day, period.id)))
);

export function classTimetable(classId: string): Slot[] {
  return allSlots.filter((slot) => slot.classId === classId);
}

export function teacherTimetable(teacherId: string): Slot[] {
  return allSlots.filter((slot) => slot.teacherId === teacherId);
}

/** Classes a teacher takes, at least one period a week. */
export function teacherClassIds(teacherId: string): string[] {
  return [...new Set(teacherTimetable(teacherId).map((slot) => slot.classId))];
}

/** Who teaches each subject to a class. */
export function classSubjectTeachers(classId: string): { subjectId: string; teacherId: string }[] {
  const classIndex = classes.findIndex((schoolClass) => schoolClass.id === classId);
  return subjects.map((subject, subjectIndex) => ({
    subjectId: subject.id,
    teacherId: `t${teacherIndex(classIndex, subjectIndex)}`,
  }));
}

// --- Students ---------------------------------------------------------------

export type Student = {
  id: string;
  admissionNo: string;
  name: string;
  classId: string;
  roll: number;
  dob: string;
  house: string;
  bloodGroup: string;
  attendance: number;
  routeId: string | null;
  status: "active" | "new";
  guardian: { name: string; phone: string; email: string };
  address: string;
};

const FIRST_NAMES = [
  "Aarav", "Ananya", "Arjun", "Diya", "Ishaan", "Kavya", "Rohan", "Saanvi", "Vihaan", "Zara", "Aditya", "Meera",
  "Kabir", "Nisha", "Reyansh", "Tara", "Yusuf", "Priya", "Dev", "Aisha", "Neel", "Riya", "Omar", "Sneha",
  "Krish", "Ira", "Farhan", "Lavanya", "Samar", "Anika", "Vivaan", "Myra", "Harsh", "Fatima", "Karan", "Pooja",
  "Siddharth", "Tanvi", "Imran", "Nandini", "Rahul", "Shreya", "Varun", "Aditi", "Manav", "Sara", "Yash", "Kiara",
];

const LAST_NAMES = [
  "Sharma", "Iyer", "Mehta", "Kapoor", "Verma", "Nair", "Gupta", "Reddy", "Joshi", "Khan",
  "Rao", "Pillai", "Singh", "Fernandes", "Patel", "Menon", "Ali", "Das", "Malhotra", "Siddiqui",
  "Chatterjee", "Banerjee", "Sheikh", "Kulkarni", "Agarwal", "Bhatt", "Qureshi", "Shetty", "Kohli", "Bose",
];

const GUARDIAN_NAMES = ["Neha", "Rajesh", "Farida", "Suresh", "Lakshmi", "Anil", "Geeta", "Sanjay", "Zainab", "Mahesh", "Rekha", "Vinod"];
const HOUSES = ["Banyan", "Neem", "Peepal", "Ashoka"];
const BLOOD_GROUPS = ["O+", "A+", "B+", "AB+", "O-", "A-"];
const AREAS = ["Indiranagar", "Koramangala", "Jayanagar", "Whitefield", "HSR Layout", "Malleshwaram"];

export const CLASS_SIZE = 26;
export const ROUTE_IDS = ["r1", "r2", "r3", "r4", "r5", "r6"];

export const students: Student[] = classes.flatMap((schoolClass, classIndex) => {
  const roster = Array.from({ length: CLASS_SIZE }, (_, seat) => {
    const n = classIndex * CLASS_SIZE + seat;
    // Unique across the school: the last name shifts every time the first names wrap.
    const round = Math.floor(n / FIRST_NAMES.length);
    return {
      n,
      first: FIRST_NAMES[n % FIRST_NAMES.length]!,
      last: LAST_NAMES[(round + n) % LAST_NAMES.length]!,
    };
  }).sort((a, b) => `${a.first} ${a.last}`.localeCompare(`${b.first} ${b.last}`));

  return roster.map(({ n, first, last }, index) => {
    const seed = hash(`${first}-${last}-${n}`);
    const guardianFirst = GUARDIAN_NAMES[seed % GUARDIAN_NAMES.length]!;
    return {
      id: `s${n}`,
      admissionNo: `ADM-${2026 - (schoolClass.grade - 5)}-${String(n + 1).padStart(4, "0")}`,
      name: `${first} ${last}`,
      classId: schoolClass.id,
      roll: index + 1,
      dob: `${2026 - schoolClass.grade - 5}-${String((seed % 12) + 1).padStart(2, "0")}-${String((seed % 27) + 1).padStart(2, "0")}`,
      house: HOUSES[seed % HOUSES.length]!,
      bloodGroup: BLOOD_GROUPS[seed % BLOOD_GROUPS.length]!,
      attendance: 78 + (seed % 22),
      routeId: seed % 100 < 40 ? ROUTE_IDS[seed % ROUTE_IDS.length]! : null,
      status: "active" as const,
      guardian: {
        name: `${guardianFirst} ${last}`,
        phone: `+91 90000 2${String(n).padStart(4, "0")}`,
        email: `${guardianFirst}.${last}${n}@mail.test`.toLowerCase(),
      },
      address: `${(seed % 200) + 1}, ${AREAS[seed % AREAS.length]!}, Bengaluru`,
    };
  });
});

export function studentById(id: string, list: Student[] = students): Student {
  return list.find((student) => student.id === id)!;
}

export function studentsInClass(classId: string, list: Student[] = students): Student[] {
  return list.filter((student) => student.classId === classId);
}

/** The student behind the sample student and parent logins. */
export const demoStudent: Student = studentsInClass("10a")[0]!;

// --- Today's attendance -----------------------------------------------------

export type AttendanceStatus = "present" | "late" | "absent";
export type AttendanceMarks = Record<string, AttendanceStatus>;

/** Registers still open this morning. */
const OPEN_REGISTERS = new Set(["6c", "7a", "9b", "10c", "11b"]);

function seedAttendance() {
  const marks: Record<string, AttendanceMarks> = {};
  const submitted: Record<string, boolean> = {};
  let index = 0;
  let absences = 0;

  for (const schoolClass of classes) {
    submitted[schoolClass.id] = !OPEN_REGISTERS.has(schoolClass.id);
    marks[schoolClass.id] = {};
    if (OPEN_REGISTERS.has(schoolClass.id)) continue;

    for (const student of studentsInClass(schoolClass.id)) {
      let status: AttendanceStatus = "present";
      if (index % 8 === 3 && absences < 60) {
        status = "absent";
        absences += 1;
      } else if (index % 19 === 5) {
        status = "late";
      }
      marks[schoolClass.id]![student.id] = status;
      index += 1;
    }
  }
  return { marks, submitted };
}

export const seededAttendance = seedAttendance();

export type AttendancePoint = {
  label: string;
  present: number;
  late: number;
  absent: number;
};

export const schoolAttendanceWeek: AttendancePoint[] = [
  { label: "Mon", present: 90, late: 4, absent: 6 },
  { label: "Tue", present: 93, late: 3, absent: 4 },
  { label: "Wed", present: 91, late: 3, absent: 6 },
  { label: "Thu", present: 92, late: 3, absent: 5 },
  { label: "Fri", present: 87, late: 3, absent: 10 },
];

export const studentAttendanceWeeks: AttendancePoint[] = [
  { label: "W2", present: 100, late: 0, absent: 0 },
  { label: "W3", present: 90, late: 10, absent: 0 },
  { label: "W4", present: 100, late: 0, absent: 0 },
  { label: "W5", present: 80, late: 0, absent: 20 },
  { label: "W6", present: 100, late: 0, absent: 0 },
  { label: "W7", present: 95, late: 5, absent: 0 },
];

// --- Grades -----------------------------------------------------------------

export type Assessment = { id: string; name: string; date: string };

export const assessments: Assessment[] = [
  { id: "ct1", name: "Class Test 1", date: "2026-04-24" },
  { id: "ut1", name: "Unit Test 1", date: "2026-05-14" },
];

export const gradeScale = [
  { grade: "A+", min: 90 },
  { grade: "A", min: 80 },
  { grade: "B+", min: 70 },
  { grade: "B", min: 60 },
  { grade: "C", min: 50 },
  { grade: "D", min: 40 },
  { grade: "F", min: 0 },
];

export function gradeFor(score: number): string {
  return gradeScale.find((step) => score >= step.min)!.grade;
}

/** Marks out of 100. A student's ability stays fairly steady across subjects. */
export function scoreFor(studentId: string, subjectId: string, assessmentId: string): number {
  const base = 40 + Math.floor(Math.sqrt(hash(studentId) % 3249));
  const swing = (hash(`${studentId}/${subjectId}/${assessmentId}`) % 21) - 10;
  return Math.max(18, Math.min(100, base + swing));
}

export function studentAverage(studentId: string, assessmentId: string): number {
  const total = gradedSubjects.reduce((sum, subject) => sum + scoreFor(studentId, subject.id, assessmentId), 0);
  return Math.round(total / gradedSubjects.length);
}

export function classAverage(classId: string, assessmentId = "ut1"): number {
  const roster = studentsInClass(classId);
  return Math.round(roster.reduce((sum, student) => sum + studentAverage(student.id, assessmentId), 0) / roster.length);
}

export type TrendPoint = { label: string; value: number };

export function schoolAverage(assessmentId = "ut1"): number {
  const total = classes.reduce((sum, schoolClass) => sum + classAverage(schoolClass.id, assessmentId), 0);
  return Math.round(total / classes.length);
}

/** Weekly average so far; the latest week is the Unit Test 1 average. */
export const schoolGradeTrend: TrendPoint[] = [
  { label: "W1", value: 65 },
  { label: "W2", value: 71 },
  { label: "W3", value: 68 },
  { label: "W4", value: 74 },
  { label: "W5", value: 71 },
  { label: "W6", value: 75 },
  { label: "W7", value: schoolAverage() },
];

// --- Exams ------------------------------------------------------------------

export type Exam = {
  id: string;
  title: string;
  subjectId: string;
  classId: string;
  date: string;
  start: string;
  end: string;
  room: string;
  type: "Written" | "Practical" | "Oral";
  maxMarks: number;
  invigilatorId: string;
  topics: string[];
};

type ExamSeed = [string, string, string, string, string, Exam["type"], string[]];

const EXAM_SEEDS: ExamSeed[] = [
  ["5a", "eng", "2026-05-11", "08:30", "10:00", "Written", ["Grammar", "Comprehension"]],
  ["12a", "phy", "2026-05-11", "10:30", "12:30", "Written", ["Electrostatics", "Current electricity"]],
  ["10a", "hin", "2026-05-12", "08:30", "10:00", "Written", ["Gadya", "Vyakaran"]],
  ["8b", "math", "2026-05-12", "10:30", "12:00", "Written", ["Linear equations", "Mensuration"]],
  ["10a", "hist", "2026-05-13", "08:30", "10:00", "Written", ["Nationalism in India", "Print culture"]],
  ["11c", "chem", "2026-05-13", "10:30", "12:00", "Practical", ["Titration", "Salt analysis"]],
  ["9c", "math", "2026-05-14", "08:30", "10:00", "Written", ["Polynomials", "Coordinate geometry"]],
  ["10a", "math", "2026-05-15", "08:30", "10:00", "Written", ["Quadratic equations", "Trigonometry"]],
  ["9b", "phy", "2026-05-15", "11:00", "12:30", "Written", ["Motion", "Gravitation"]],
  ["8a", "eng", "2026-05-15", "12:30", "14:00", "Written", ["Poetry", "Essay writing"]],
  ["7c", "hist", "2026-05-15", "13:30", "14:30", "Oral", ["Medieval India", "Map work"]],
  ["10a", "phy", "2026-05-18", "08:30", "10:00", "Written", ["Light", "Electricity"]],
  ["10c", "math", "2026-05-18", "10:30", "12:00", "Written", ["Statistics", "Probability"]],
  ["10a", "chem", "2026-05-19", "08:30", "10:00", "Practical", ["Acids and bases", "Carbon compounds"]],
  ["6a", "geo", "2026-05-19", "10:30", "11:30", "Written", ["Maps", "Our country"]],
  ["10a", "eng", "2026-05-21", "08:30", "10:00", "Written", ["Prose", "Letter writing"]],
  ["11a", "cs", "2026-05-21", "10:30", "12:00", "Practical", ["Python basics", "SQL"]],
  ["12c", "bio", "2026-05-22", "08:30", "10:30", "Written", ["Genetics", "Ecology"]],
];

export const exams: Exam[] = EXAM_SEEDS.map(([classId, subjectId, date, start, end, type, topics], index) => ({
  id: `e${index}`,
  title: "Unit Test 1",
  classId,
  subjectId,
  date,
  start,
  end,
  type,
  topics,
  maxMarks: 100,
  room: type === "Written" ? `Exam Hall ${index % 2 === 0 ? "A" : "B"}` : subjectById(subjectId).room ?? classById(classId).room,
  invigilatorId: `t${(index * 5) % 36}`,
}));

// --- Assignments ------------------------------------------------------------

export type Assignment = {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  assigned: string;
  due: string;
  submitted: number;
  status: "open" | "grading" | "closed";
  /** The sample student has handed this one in. */
  handedIn?: boolean;
};

export const seededAssignments: Assignment[] = [
  { id: "a1", title: "Quadratic equations worksheet", description: "Solve exercises 4.2 and 4.3. Show all working.", subjectId: "math", classId: "10c", teacherId: "t0", assigned: "2026-05-11", due: "2026-05-18", submitted: 19, status: "open" },
  { id: "a2", title: "Electricity numericals", description: "Ten problems on Ohm's law and series circuits from chapter 12.", subjectId: "phy", classId: "10a", teacherId: "t7", assigned: "2026-05-12", due: "2026-05-20", submitted: 8, status: "open" },
  { id: "a3", title: "Letter to the editor", description: "150 words on water conservation in your city.", subjectId: "eng", classId: "10a", teacherId: "t4", assigned: "2026-05-04", due: "2026-05-12", submitted: 26, status: "grading", handedIn: true },
  { id: "a4", title: "Carbon compounds chart", description: "Illustrate homologous series on an A3 sheet.", subjectId: "chem", classId: "10c", teacherId: "t9", assigned: "2026-05-08", due: "2026-05-19", submitted: 14, status: "open" },
  { id: "a5", title: "Statistics project", description: "Survey 30 people and present the mean, median and mode.", subjectId: "math", classId: "9c", teacherId: "t0", assigned: "2026-05-01", due: "2026-05-13", submitted: 25, status: "grading" },
  { id: "a6", title: "Rivers of India map", description: "Mark the major river systems on an outline map.", subjectId: "geo", classId: "7b", teacherId: "t19", assigned: "2026-05-06", due: "2026-05-16", submitted: 21, status: "open" },
  { id: "a7", title: "Book review", description: "Review any book from the Grade 8 library shelf.", subjectId: "eng", classId: "8a", teacherId: "t3", assigned: "2026-04-27", due: "2026-05-08", submitted: 26, status: "closed" },
  { id: "a8", title: "Plant cell model", description: "Build a labelled 3D model of a plant cell.", subjectId: "bio", classId: "6a", teacherId: "t12", assigned: "2026-05-05", due: "2026-05-22", submitted: 6, status: "open" },
  { id: "a9", title: "Python loops practice", description: "Complete the eight loop exercises on the class portal.", subjectId: "cs", classId: "11a", teacherId: "t25", assigned: "2026-05-10", due: "2026-05-17", submitted: 17, status: "open" },
  { id: "a11", title: "Trigonometry practice", description: "Exercise 8.3, all questions. Check your answers at the back.", subjectId: "math", classId: "10a", teacherId: "t1", assigned: "2026-05-12", due: "2026-05-20", submitted: 11, status: "open" },
  { id: "a10", title: "Linear equations drill", description: "Exercise 2.4, questions 1 to 20.", subjectId: "math", classId: "8a", teacherId: "t0", assigned: "2026-05-02", due: "2026-05-09", submitted: 24, status: "closed" },
];
