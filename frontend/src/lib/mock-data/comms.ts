// Calendar events, notices, messages and the activity feed.
import type { Tone } from "@/components/dashboard/tone";
import { classById, exams, subjectById } from "@/lib/mock-data/academics";

// --- Calendar ---------------------------------------------------------------

export const EVENT_CATEGORIES = [
  { id: "exam", label: "Exams", tone: "pink" },
  { id: "meeting", label: "Meetings", tone: "yellow" },
  { id: "activity", label: "Activities", tone: "blue" },
  { id: "parents", label: "Parents", tone: "green" },
  { id: "holiday", label: "Holidays", tone: "peach" },
] as const satisfies readonly { id: string; label: string; tone: Tone }[];

export type EventCategory = (typeof EVENT_CATEGORIES)[number]["id"];

export function eventTone(category: EventCategory): Tone {
  return EVENT_CATEGORIES.find((item) => item.id === category)!.tone;
}

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  category: EventCategory;
  location?: string;
  /** Set on exams: only that class and its teachers need to see it. */
  classId?: string;
};

const SCHOOL_EVENTS: CalendarEvent[] = [
  { id: "ev1", title: "Staff meeting", date: "2026-05-15", time: "10:30", category: "meeting", location: "Conference room" },
  { id: "ev2", title: "Parent committee review", date: "2026-05-15", time: "15:30", category: "parents", location: "Principal's office" },
  { id: "ev3", title: "Science fair registrations close", date: "2026-05-08", time: "16:00", category: "activity", location: "Lab block" },
  { id: "ev4", title: "Founders' Day assembly", date: "2026-05-06", time: "08:30", category: "activity", location: "Main ground" },
  { id: "ev5", title: "Buddha Purnima", date: "2026-05-01", time: "08:00", category: "holiday" },
  { id: "ev6", title: "Parent–teacher meeting · Grades 6–10", date: "2026-05-16", time: "09:30", category: "parents", location: "Classrooms" },
  { id: "ev7", title: "Inter-house quiz finals", date: "2026-05-20", time: "13:00", category: "activity", location: "Auditorium" },
  { id: "ev8", title: "Board of governors", date: "2026-05-22", time: "16:00", category: "meeting", location: "Conference room" },
  { id: "ev9", title: "Summer break begins", date: "2026-05-30", time: "08:00", category: "holiday" },
  { id: "ev10", title: "Bus safety drill", date: "2026-05-26", time: "11:00", category: "activity", location: "Bus bay" },
];

export const seededEvents: CalendarEvent[] = [
  ...SCHOOL_EVENTS,
  ...exams.map((exam) => ({
    id: `ev-${exam.id}`,
    title: `${subjectById(exam.subjectId).name} exam · ${classById(exam.classId).short}`,
    date: exam.date,
    time: exam.start,
    category: "exam" as const,
    location: exam.room,
    classId: exam.classId,
  })),
];

// --- Notices ----------------------------------------------------------------

export type Notice = {
  id: string;
  title: string;
  body: string;
  date: string;
  audience: string;
  tone: Tone;
};

export const NOTICE_AUDIENCES = ["Everyone", "Staff", "Parents", "Students"];

export const seededNotices: Notice[] = [
  { id: "n1", title: "Unit Test 1 runs until 22 May", body: "Students should arrive by 8:15 AM on exam days. Calculators are not allowed unless stated on the timetable.", date: "2026-05-11", audience: "Everyone", tone: "pink" },
  { id: "n2", title: "Parent–teacher meeting on Saturday", body: "Meetings for Grades 6–10 run 9:30 AM to 1:00 PM in the classrooms. Slots are on the class notice boards.", date: "2026-05-13", audience: "Parents", tone: "green" },
  { id: "n3", title: "Route 3 running late this week", body: "Roadworks near Richmond Circle are adding about 10 minutes to the Jayanagar line each morning.", date: "2026-05-14", audience: "Parents", tone: "blue" },
  { id: "n4", title: "Term 1 fees for Grades 9–12 due 31 May", body: "Pay at the school office or online. Late payments attract a ₹50 per week fee.", date: "2026-05-08", audience: "Parents", tone: "yellow" },
  { id: "n5", title: "Summer break begins on 30 May", body: "School reopens on 15 June. Holiday homework will be shared through Assignments.", date: "2026-05-05", audience: "Everyone", tone: "peach" },
];

// --- Messages ---------------------------------------------------------------

export type Message = { id: string; fromMe: boolean; text: string; time: string };

export type ThreadAudience = "office" | "teacher" | "family";

export type Thread = {
  id: string;
  name: string;
  subtitle: string;
  unread: number;
  audience: ThreadAudience;
  messages: Message[];
};

export const seededThreads: Thread[] = [
  {
    id: "th1",
    name: "Ayesha Rahman",
    subtitle: "Mathematics",
    audience: "office",
    unread: 2,
    messages: [
      { id: "m1", fromMe: false, text: "Good morning. The Grade 10-A maths paper is printed and sealed.", time: "8:02 AM" },
      { id: "m2", fromMe: true, text: "Thanks, Ayesha. Who is invigilating?", time: "8:05 AM" },
      { id: "m3", fromMe: false, text: "Vikram has it. I'll be on rounds in the exam hall.", time: "8:07 AM" },
      { id: "m4", fromMe: false, text: "Could we also talk about the 9-C results at the staff meeting?", time: "8:09 AM" },
    ],
  },
  {
    id: "th2",
    name: "Neha Sharma",
    subtitle: "Parent · Grade 5-A",
    audience: "office",
    unread: 1,
    messages: [
      { id: "m1", fromMe: false, text: "Hello, will the PTM slots be shared today? I need to plan around work.", time: "Yesterday" },
    ],
  },
  {
    id: "th3",
    name: "Arvind Menon",
    subtitle: "Physics",
    audience: "office",
    unread: 0,
    messages: [
      { id: "m1", fromMe: true, text: "Please send the lab equipment list before the science fair.", time: "Tue" },
      { id: "m2", fromMe: false, text: "Done, it's with the office now.", time: "Tue" },
    ],
  },
  {
    id: "th4",
    name: "Admissions desk",
    subtitle: "Office",
    audience: "office",
    unread: 0,
    messages: [
      { id: "m1", fromMe: false, text: "Three new applications came in this week. They're in the pipeline.", time: "Mon" },
    ],
  },
  {
    id: "th5",
    name: "Grade 10 teachers",
    subtitle: "Group · 9 people",
    audience: "office",
    unread: 0,
    messages: [
      { id: "m1", fromMe: false, text: "Report card remarks are due by 25 May, please.", time: "12 May" },
      { id: "m2", fromMe: true, text: "Noted. I'll sign them off on the 27th.", time: "12 May" },
    ],
  },
  {
    id: "th6",
    name: "Principal Sarah",
    subtitle: "Principal",
    audience: "teacher",
    unread: 1,
    messages: [
      { id: "m1", fromMe: true, text: "The Grade 10-A maths paper is printed and sealed.", time: "8:02 AM" },
      { id: "m2", fromMe: false, text: "Thanks, Ayesha. Let's discuss the 9-C results at the staff meeting.", time: "8:10 AM" },
    ],
  },
  {
    id: "th7",
    name: "Vikram Iyer",
    subtitle: "Mathematics",
    audience: "teacher",
    unread: 0,
    messages: [
      { id: "m1", fromMe: false, text: "Can you swap periods with me next Tuesday?", time: "Yesterday" },
      { id: "m2", fromMe: true, text: "Sure, I'll update the timetable office.", time: "Yesterday" },
    ],
  },
  {
    id: "th8",
    name: "Uma Pillai",
    subtitle: "Class teacher, Grade 10-A",
    audience: "family",
    unread: 1,
    messages: [
      { id: "m1", fromMe: false, text: "Unit Test 1 starts this week. The revision sheet is on Assignments.", time: "Yesterday" },
    ],
  },
  {
    id: "th9",
    name: "School office",
    subtitle: "Fees and admin",
    audience: "family",
    unread: 0,
    messages: [
      { id: "m1", fromMe: false, text: "The Term 1 fee receipt is ready to collect.", time: "Mon" },
      { id: "m2", fromMe: true, text: "Thank you, we'll pick it up on Friday.", time: "Mon" },
    ],
  },
];

// --- Activity feed ----------------------------------------------------------

export type ActivityKind = "attendance" | "fee" | "grade" | "admission" | "notice" | "library" | "assignment" | "event" | "staff";

export type Activity = {
  id: string;
  actor: string;
  text: string;
  kind: ActivityKind;
  when: string;
  tone: Tone;
  /** Who else sees this, beyond the office and the person who did it. */
  sharedWith?: ThreadAudience[];
};

export const seededActivities: Activity[] = [
  { id: "ac1", actor: "Nalini Rao", text: "submitted the Grade 8-A attendance", kind: "attendance", when: "18 min ago", tone: "green", sharedWith: ["teacher"] },
  { id: "ac2", actor: "Rekha Rao", text: "paid ₹18,300 for Term 1 fees", kind: "fee", when: "41 min ago", tone: "blue" },
  { id: "ac3", actor: "Rhea Kapoor", text: "published Grade 5-A English marks", kind: "grade", when: "1 hr ago", tone: "pink", sharedWith: ["teacher"] },
  { id: "ac4", actor: "Admissions desk", text: "received an application from Aanya Bhatt", kind: "admission", when: "3 hr ago", tone: "yellow" },
  { id: "ac5", actor: "Library", text: "flagged 3 overdue books for Grade 11", kind: "library", when: "Yesterday", tone: "lilac" },
  { id: "ac6", actor: "Principal Sarah", text: "shared the staff meeting agenda", kind: "notice", when: "2 hr ago", tone: "yellow", sharedWith: ["teacher"] },
  { id: "ac7", actor: "Vikram Iyer", text: "asked to swap Tuesday's period 3", kind: "staff", when: "Yesterday", tone: "lilac", sharedWith: ["teacher"] },
  { id: "ac8", actor: "Daniel Thomas", text: "graded Letter to the editor", kind: "grade", when: "1 hr ago", tone: "pink", sharedWith: ["family"] },
  { id: "ac9", actor: "Vikram Iyer", text: "shared the Unit Test 1 revision sheet", kind: "assignment", when: "Yesterday", tone: "yellow", sharedWith: ["family"] },
  { id: "ac10", actor: "School office", text: "posted the parent–teacher meeting slots", kind: "notice", when: "2 days ago", tone: "green", sharedWith: ["family"] },
  { id: "ac11", actor: "Library", text: "added new titles to the Fiction shelf", kind: "library", when: "3 days ago", tone: "lilac", sharedWith: ["family"] },
];

// --- Notifications ----------------------------------------------------------

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: Tone;
  audience: ("office" | "teacher" | "family")[];
};

export const notifications: NotificationItem[] = [
  { id: "no1", title: "5 registers still open", detail: "Grades 6-C, 7-A, 9-B, 10-C and 11-B", href: "/dashboard/attendance", tone: "green", audience: ["office", "teacher"] },
  { id: "no2", title: "3 leave requests to review", detail: "Daniel Thomas and two others", href: "/dashboard/teachers", tone: "yellow", audience: ["office"] },
  { id: "no3", title: "Route 3 is running 12 minutes late", detail: "Jayanagar line, near Richmond Circle", href: "/dashboard/transport", tone: "blue", audience: ["office", "teacher", "family"] },
  { id: "no4", title: "Maths exam today at 8:30 AM", detail: "Exam Hall B · Unit Test 1", href: "/dashboard/exams", tone: "pink", audience: ["family"] },
  { id: "no5", title: "Term 1 fee due on 31 May", detail: "Pay online or at the school office", href: "/dashboard/fees", tone: "yellow", audience: ["family"] },
  { id: "no6", title: "1 assignment ready to grade", detail: "Statistics project, Grade 9-C", href: "/dashboard/assignments", tone: "pink", audience: ["teacher"] },
];
