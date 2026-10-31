// Fees, admissions, library, transport and staff leave sample data.
import type { Tone } from "@/components/dashboard/tone";
import { TODAY_ISO, classById, demoStudent, hash, students, type Student } from "@/lib/mock-data/academics";

// --- Fees -------------------------------------------------------------------

export const feeComponents = [
  { id: "tuition", label: "Tuition", base: 14000, perGrade: 1500 },
  { id: "lab", label: "Lab & computers", base: 2000, perGrade: 250 },
  { id: "library", label: "Library", base: 800, perGrade: 0 },
  { id: "activities", label: "Sports & activities", base: 1500, perGrade: 100 },
];

export const PAYMENT_MODES = ["UPI", "Cash", "Bank transfer", "Card"];

export function termFee(grade: number): number {
  return feeComponents.reduce((sum, item) => sum + item.base + item.perGrade * (grade - 5), 0);
}

export type InvoiceStatus = "paid" | "partial" | "pending" | "overdue";

export type Invoice = {
  id: string;
  studentId: string;
  title: string;
  amount: number;
  paid: number;
  dueDate: string;
};

export function invoiceFor(student: Student): Invoice {
  const grade = classById(student.classId).grade;
  const amount = termFee(grade);
  const roll = hash(`fee-${student.id}`) % 100;
  let paid = amount;
  if (roll >= 86) paid = 0;
  else if (roll >= 72) paid = Math.round((amount * (40 + (roll % 30))) / 100 / 100) * 100;
  return {
    id: `inv-${student.id}`,
    studentId: student.id,
    title: "Term 1 fee",
    amount,
    paid,
    // Senior grades pay later in the term.
    dueDate: grade >= 9 ? "2026-05-31" : "2026-04-30",
  };
}

// The sample student owes a balance, so the student and parent logins can try paying it.
export const seededInvoices: Invoice[] = students.map((student) =>
  student.id === demoStudent.id ? { ...invoiceFor(student), paid: 15000 } : invoiceFor(student)
);

/** First invoice for someone joining mid-term: nothing paid, due at the end of the month. */
export function newStudentInvoice(student: Student): Invoice {
  return { ...invoiceFor(student), paid: 0, dueDate: "2026-05-31" };
}

export function invoiceStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.paid >= invoice.amount) return "paid";
  if (invoice.dueDate < TODAY_ISO) return "overdue";
  return invoice.paid > 0 ? "partial" : "pending";
}

export type Payment = {
  id: string;
  invoiceId: string;
  studentName: string;
  amount: number;
  mode: string;
  date: string;
};

// --- Admissions -------------------------------------------------------------

export const ADMISSION_STAGES = [
  { id: "applied", label: "Applied", tone: "blue" },
  { id: "documents", label: "Documents", tone: "yellow" },
  { id: "interview", label: "Interview", tone: "lilac" },
  { id: "offer", label: "Offer sent", tone: "pink" },
  { id: "enrolled", label: "Enrolled", tone: "green" },
] as const;

export type AdmissionStage = (typeof ADMISSION_STAGES)[number]["id"] | "rejected";

export type Application = {
  id: string;
  applicant: string;
  grade: number;
  guardian: string;
  phone: string;
  appliedOn: string;
  previousSchool: string;
  stage: AdmissionStage;
};

export const seededApplications: Application[] = [
  { id: "ap1", applicant: "Aanya Bhatt", grade: 5, guardian: "Rekha Bhatt", phone: "+91 90000 30001", appliedOn: "2026-05-14", previousSchool: "Little Oaks Primary", stage: "applied" },
  { id: "ap2", applicant: "Rudra Nair", grade: 6, guardian: "Anil Nair", phone: "+91 90000 30002", appliedOn: "2026-05-13", previousSchool: "St. Mary's Convent", stage: "applied" },
  { id: "ap3", applicant: "Maya Fernandes", grade: 8, guardian: "Geeta Fernandes", phone: "+91 90000 30003", appliedOn: "2026-05-12", previousSchool: "Greenfield School", stage: "applied" },
  { id: "ap4", applicant: "Zayan Ali", grade: 5, guardian: "Zainab Ali", phone: "+91 90000 30004", appliedOn: "2026-05-11", previousSchool: "Bright Minds", stage: "documents" },
  { id: "ap5", applicant: "Tisha Reddy", grade: 7, guardian: "Sanjay Reddy", phone: "+91 90000 30005", appliedOn: "2026-05-08", previousSchool: "Vidya Mandir", stage: "documents" },
  { id: "ap6", applicant: "Advik Rao", grade: 9, guardian: "Mahesh Rao", phone: "+91 90000 30006", appliedOn: "2026-05-07", previousSchool: "National Public School", stage: "documents" },
  { id: "ap7", applicant: "Inaya Sheikh", grade: 6, guardian: "Farida Sheikh", phone: "+91 90000 30007", appliedOn: "2026-05-05", previousSchool: "Sunrise Academy", stage: "interview" },
  { id: "ap8", applicant: "Parth Kulkarni", grade: 11, guardian: "Suresh Kulkarni", phone: "+91 90000 30008", appliedOn: "2026-05-04", previousSchool: "Kendriya Vidyalaya", stage: "interview" },
  { id: "ap9", applicant: "Mishka Gupta", grade: 5, guardian: "Neha Gupta", phone: "+91 90000 30009", appliedOn: "2026-04-29", previousSchool: "Little Oaks Primary", stage: "offer" },
  { id: "ap10", applicant: "Shaurya Patel", grade: 8, guardian: "Rajesh Patel", phone: "+91 90000 30010", appliedOn: "2026-04-27", previousSchool: "Greenfield School", stage: "offer" },
  { id: "ap11", applicant: "Navya Iyer", grade: 7, guardian: "Lakshmi Iyer", phone: "+91 90000 30011", appliedOn: "2026-04-21", previousSchool: "Vidya Mandir", stage: "enrolled" },
  { id: "ap12", applicant: "Kian Mathew", grade: 10, guardian: "Vinod Mathew", phone: "+91 90000 30012", appliedOn: "2026-04-18", previousSchool: "St. Mary's Convent", stage: "rejected" },
];

// --- Library ----------------------------------------------------------------

export const FINE_PER_DAY = 5;

export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  shelf: string;
  copies: number;
  tone: Tone;
};

export const books: Book[] = [
  { id: "b1", title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction", shelf: "F-12", copies: 6, tone: "yellow" },
  { id: "b2", title: "The Diary of a Young Girl", author: "Anne Frank", category: "Biography", shelf: "B-03", copies: 8, tone: "pink" },
  { id: "b3", title: "Wings of Fire", author: "A. P. J. Abdul Kalam", category: "Biography", shelf: "B-07", copies: 10, tone: "blue" },
  { id: "b4", title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", shelf: "S-21", copies: 4, tone: "lilac" },
  { id: "b5", title: "The Discovery of India", author: "Jawaharlal Nehru", category: "History", shelf: "H-05", copies: 5, tone: "peach" },
  { id: "b6", title: "Malgudi Days", author: "R. K. Narayan", category: "Fiction", shelf: "F-18", copies: 9, tone: "green" },
  { id: "b7", title: "The Jungle Book", author: "Rudyard Kipling", category: "Fiction", shelf: "F-02", copies: 7, tone: "green" },
  { id: "b8", title: "Charlotte's Web", author: "E. B. White", category: "Fiction", shelf: "F-04", copies: 6, tone: "yellow" },
  { id: "b9", title: "The Selfish Gene", author: "Richard Dawkins", category: "Science", shelf: "S-14", copies: 3, tone: "blue" },
  { id: "b10", title: "Sapiens", author: "Yuval Noah Harari", category: "History", shelf: "H-11", copies: 5, tone: "peach" },
  { id: "b11", title: "Godaan", author: "Munshi Premchand", category: "Hindi", shelf: "L-02", copies: 6, tone: "pink" },
  { id: "b12", title: "Gitanjali", author: "Rabindranath Tagore", category: "Poetry", shelf: "P-01", copies: 4, tone: "lilac" },
  { id: "b13", title: "Oxford Atlas for Schools", author: "Oxford University Press", category: "Reference", shelf: "R-09", copies: 12, tone: "blue" },
  { id: "b14", title: "Concepts of Physics", author: "H. C. Verma", category: "Science", shelf: "S-02", copies: 14, tone: "yellow" },
  { id: "b15", title: "Python Crash Course", author: "Eric Matthes", category: "Technology", shelf: "T-04", copies: 5, tone: "green" },
  { id: "b16", title: "The Alchemist", author: "Paulo Coelho", category: "Fiction", shelf: "F-22", copies: 7, tone: "peach" },
];

export type Loan = {
  id: string;
  bookId: string;
  studentId: string;
  issued: string;
  due: string;
  returned?: string;
};

export const seededLoans: Loan[] = [
  { id: "l1", bookId: "b1", studentId: "s234", issued: "2026-05-02", due: "2026-05-16" },
  { id: "l2", bookId: "b3", studentId: "s312", issued: "2026-04-28", due: "2026-05-12" },
  { id: "l3", bookId: "b14", studentId: "s430", issued: "2026-05-06", due: "2026-05-20" },
  { id: "l4", bookId: "b6", studentId: "s60", issued: "2026-04-25", due: "2026-05-09" },
  { id: "l5", bookId: "b7", studentId: "s12", issued: "2026-05-08", due: "2026-05-22" },
  { id: "l6", bookId: "b4", studentId: "s520", issued: "2026-04-30", due: "2026-05-14" },
  { id: "l7", bookId: "b10", studentId: "s600", issued: "2026-05-11", due: "2026-05-25" },
  { id: "l8", bookId: "b2", studentId: "s155", issued: "2026-05-04", due: "2026-05-18" },
  { id: "l9", bookId: "b15", studentId: "s488", issued: "2026-04-22", due: "2026-05-06" },
  { id: "l10", bookId: "b8", studentId: "s75", issued: "2026-05-12", due: "2026-05-26" },
  { id: "l11", bookId: "b16", studentId: "s267", issued: "2026-05-09", due: "2026-05-23" },
  { id: "l12", bookId: "b9", studentId: demoStudent.id, issued: "2026-04-28", due: "2026-05-12" },
  { id: "l13", bookId: "b14", studentId: demoStudent.id, issued: "2026-05-08", due: "2026-05-22" },
];

// --- Transport --------------------------------------------------------------

export type RouteStop = { name: string; time: string };

export type BusRoute = {
  id: string;
  name: string;
  bus: string;
  driver: string;
  phone: string;
  capacity: number;
  delayMinutes: number;
  tone: Tone;
  stops: RouteStop[];
};

export const routes: BusRoute[] = [
  { id: "r1", name: "Indiranagar loop", bus: "KA-01-F-2041", driver: "Ramesh Gowda", phone: "+91 90000 40001", capacity: 52, delayMinutes: 0, tone: "yellow", stops: [{ name: "CMH Road", time: "07:25" }, { name: "100 Feet Road", time: "07:35" }, { name: "Domlur Bridge", time: "07:50" }, { name: "School gate", time: "08:10" }] },
  { id: "r2", name: "Koramangala express", bus: "KA-01-F-2042", driver: "Shankar Murthy", phone: "+91 90000 40002", capacity: 52, delayMinutes: 0, tone: "pink", stops: [{ name: "Forum Mall", time: "07:20" }, { name: "Sony Signal", time: "07:32" }, { name: "Ejipura", time: "07:45" }, { name: "School gate", time: "08:12" }] },
  { id: "r3", name: "Jayanagar line", bus: "KA-01-F-2043", driver: "Basavaraj Patil", phone: "+91 90000 40003", capacity: 52, delayMinutes: 12, tone: "blue", stops: [{ name: "South End Circle", time: "07:10" }, { name: "4th Block", time: "07:22" }, { name: "Lalbagh West Gate", time: "07:38" }, { name: "Richmond Circle", time: "07:52" }, { name: "School gate", time: "08:15" }] },
  { id: "r4", name: "Whitefield shuttle", bus: "KA-01-F-2044", driver: "Abdul Rasheed", phone: "+91 90000 40004", capacity: 52, delayMinutes: 0, tone: "green", stops: [{ name: "ITPL Main Gate", time: "06:55" }, { name: "Hope Farm", time: "07:08" }, { name: "Marathahalli", time: "07:35" }, { name: "School gate", time: "08:14" }] },
  { id: "r5", name: "HSR ring", bus: "KA-01-F-2045", driver: "Venkatesh Naik", phone: "+91 90000 40005", capacity: 52, delayMinutes: 5, tone: "lilac", stops: [{ name: "27th Main", time: "07:15" }, { name: "Agara Lake", time: "07:28" }, { name: "Silk Board", time: "07:44" }, { name: "School gate", time: "08:13" }] },
  { id: "r6", name: "Malleshwaram line", bus: "KA-01-F-2046", driver: "Joseph D'Costa", phone: "+91 90000 40006", capacity: 52, delayMinutes: 0, tone: "peach", stops: [{ name: "Sankey Tank", time: "07:20" }, { name: "18th Cross", time: "07:30" }, { name: "Seshadripuram", time: "07:46" }, { name: "School gate", time: "08:11" }] },
];

export function routeById(id: string): BusRoute {
  return routes.find((route) => route.id === id)!;
}

// --- Staff leave ------------------------------------------------------------

export type LeaveRequest = {
  id: string;
  teacherId: string;
  from: string;
  to: string;
  reason: string;
  status: "pending" | "approved" | "declined";
};

export const seededLeave: LeaveRequest[] = [
  { id: "lv1", teacherId: "t4", from: "2026-05-18", to: "2026-05-19", reason: "Family function", status: "pending" },
  { id: "lv2", teacherId: "t11", from: "2026-05-20", to: "2026-05-20", reason: "Medical appointment", status: "pending" },
  { id: "lv3", teacherId: "t26", from: "2026-05-25", to: "2026-05-29", reason: "Conference in Pune", status: "pending" },
  { id: "lv4", teacherId: "t7", from: "2026-05-14", to: "2026-05-16", reason: "Viral fever", status: "approved" },
  { id: "lv5", teacherId: "t15", from: "2026-05-15", to: "2026-05-15", reason: "Personal", status: "approved" },
  { id: "lv6", teacherId: "t22", from: "2026-05-13", to: "2026-05-18", reason: "Family travel", status: "approved" },
  { id: "lv7", teacherId: "t31", from: "2026-05-15", to: "2026-05-15", reason: "Exam duty, outside school", status: "approved" },
];
