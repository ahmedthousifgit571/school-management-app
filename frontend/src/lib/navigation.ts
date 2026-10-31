import {
  BookMarked,
  Bus,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  NotebookPen,
  School,
  Settings,
  UserPlus,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// Mirrors the Role enum in backend/prisma/schema.prisma.
export type Role = "SUPERADMIN" | "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export const ALL_ROLES: Role[] = [
  "SUPERADMIN",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "PARENT",
];

const OFFICE: Role[] = ["SUPERADMIN", "ADMIN"];
const STAFF: Role[] = [...OFFICE, "TEACHER"];

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "General",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
      { title: "Timetable", href: "/dashboard/timetable", icon: CalendarRange, roles: ALL_ROLES },
      { title: "Students", href: "/dashboard/students", icon: GraduationCap, roles: STAFF },
      { title: "Grades", href: "/dashboard/grades", icon: FileText, roles: ALL_ROLES },
      { title: "Assignments", href: "/dashboard/assignments", icon: ClipboardList, roles: ALL_ROLES },
      { title: "Messaging", href: "/dashboard/messaging", icon: MessageCircle, roles: ALL_ROLES },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Teachers", href: "/dashboard/teachers", icon: UsersRound, roles: OFFICE },
      { title: "Classes", href: "/dashboard/classes", icon: School, roles: STAFF },
      { title: "Attendance", href: "/dashboard/attendance", icon: ClipboardCheck, roles: ALL_ROLES },
      { title: "Exams", href: "/dashboard/exams", icon: NotebookPen, roles: ALL_ROLES },
      { title: "Calendar", href: "/dashboard/calendar", icon: CalendarDays, roles: ALL_ROLES },
    ],
  },
  {
    label: "Campus office",
    items: [
      { title: "Admissions", href: "/dashboard/admissions", icon: UserPlus, roles: OFFICE },
      { title: "Fees", href: "/dashboard/fees", icon: Wallet, roles: [...OFFICE, "STUDENT", "PARENT"] },
      { title: "Library", href: "/dashboard/library", icon: BookMarked, roles: ALL_ROLES },
      { title: "Transport", href: "/dashboard/transport", icon: Bus, roles: ALL_ROLES },
      { title: "Settings", href: "/dashboard/settings", icon: Settings, roles: OFFICE },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);

export function getNavGroups(role: Role): NavGroup[] {
  return navGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => item.roles.includes(role)) }))
    .filter((group) => group.items.length > 0);
}

export function canManage(role: Role): boolean {
  return STAFF.includes(role);
}

export function isOffice(role: Role): boolean {
  return OFFICE.includes(role);
}
