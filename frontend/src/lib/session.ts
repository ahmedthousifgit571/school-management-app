import type { Role } from "@/lib/navigation";

export type SessionUser = {
  name: string;
  email: string;
  role: Role;
  /** Shown before the first name in greetings, e.g. "Principal". */
  title?: string;
  /** The teacher record this login maps to (TEACHER). */
  teacherId?: string;
  /** The student this login is, or is the guardian of (STUDENT / PARENT). */
  studentId?: string;
};

export function roleLabel(role: Role): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

/** "Principal Sarah", or just "Ayesha" when the login has no title. */
export function displayName(user: SessionUser): string {
  const first = user.name.split(" ")[0]!;
  return user.title ? `${user.title} ${first}` : first;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
