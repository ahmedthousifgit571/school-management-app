"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Bell, BookMarked, GraduationCap, LogOut, Menu, MessageCircle, School, Search, Settings, UsersRound } from "lucide-react";

import { logout } from "@/app/login/actions";
import { buttonClass, iconButtonClass } from "@/components/dashboard/controls";
import { toneStyles } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { books, classes, classById, notifications, subjectById } from "@/lib/mock-data";
import { isOffice, navItems, type Role } from "@/lib/navigation";
import { roleLabel, type SessionUser } from "@/lib/session";
import { studentsStore, teachersStore, threadsForRole, threadsStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

const SCOPES = [
  { id: "all", label: "All" },
  { id: "students", label: "Students", href: "/dashboard/students", icon: GraduationCap },
  { id: "teachers", label: "Teachers", href: "/dashboard/teachers", icon: UsersRound },
  { id: "classes", label: "Classes", href: "/dashboard/classes", icon: School },
  { id: "library", label: "Books", href: "/dashboard/library", icon: BookMarked },
] as const;

type ScopeId = (typeof SCOPES)[number]["id"];

function hasAccess(href: string, role: Role) {
  return navItems.find((item) => item.href === href)?.roles.includes(role) ?? false;
}

const RESULTS_PER_GROUP = 4;

function GlobalSearch({ role }: { role: Role }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeId>("all");
  const [open, setOpen] = useState(false);
  const students = studentsStore.useStore();
  const teachers = teachersStore.useStore();

  const scopes = SCOPES.filter((item) => item.id === "all" || hasAccess(item.href, role));

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    const matches = (...fields: string[]) => fields.some((field) => field.toLowerCase().includes(term));
    const results: Record<Exclude<ScopeId, "all">, { key: string; title: string; detail: string }[]> = {
      students: students
        .filter((student) => matches(student.name, student.admissionNo))
        .map((student) => ({ key: student.name, title: student.name, detail: `${classById(student.classId).name} · ${student.admissionNo}` })),
      teachers: teachers
        .filter((teacher) => matches(teacher.name, subjectById(teacher.subjectId).name))
        .map((teacher) => ({ key: teacher.name, title: teacher.name, detail: subjectById(teacher.subjectId).name })),
      classes: classes
        .filter((item) => matches(item.name, item.short))
        .map((item) => ({ key: item.name, title: item.name, detail: item.room })),
      library: books
        .filter((book) => matches(book.title, book.author))
        .map((book) => ({ key: book.title, title: book.title, detail: book.author })),
    };
    return SCOPES.filter((item) => item.id !== "all")
      .filter((item) => (scope === "all" || scope === item.id) && hasAccess(item.href, role))
      .map((item) => ({ ...item, results: results[item.id].slice(0, RESULTS_PER_GROUP) }))
      .filter((group) => group.results.length > 0);
  }, [query, scope, role, students, teachers]);

  const showResults = open && query.trim().length > 0;

  return (
    <div
      className="relative min-w-0 flex-1 md:max-w-2xl"
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <div className="flex h-12 items-center gap-1 rounded-full border-[1.5px] border-black/10 bg-white p-1 focus-within:border-ink">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-ink bg-pastel-pink">
          <Search className="size-4" aria-hidden />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the school…"
          aria-label="Search students, teachers, classes and books"
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <div role="group" aria-label="Search in" className="hidden shrink-0 items-center gap-1 xl:flex">
          {scopes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={scope === item.id}
              onClick={() => setScope(item.id)}
              className={cn(
                "h-8 cursor-pointer rounded-full border-[1.5px] px-3 text-xs font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink",
                scope === item.id ? "border-ink bg-ink text-white" : "border-black/10 text-ink hover:border-ink"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {showResults && (
        <div className="absolute inset-x-0 top-14 z-40 max-h-[70vh] overflow-y-auto rounded-[28px] border-[1.5px] border-black/10 bg-white p-2 shadow-xl">
          {groups.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nothing matches “{query.trim()}”.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="py-1">
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground">{group.label}</p>
                <ul>
                  {group.results.map((result) => (
                    <li key={result.key}>
                      <Link
                        href={`${group.href}?q=${encodeURIComponent(result.title)}`}
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                        }}
                        className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-black/[0.05] focus-visible:outline-2 focus-visible:outline-ink"
                      >
                        <group.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{result.title}</span>
                        <span className="hidden truncate text-xs text-muted-foreground sm:block">{result.detail}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const popupClass =
  "z-50 w-80 max-w-[calc(100vw-2rem)] rounded-[28px] border-[1.5px] border-black/10 bg-white p-3 shadow-xl outline-none transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0";

function NotificationsMenu({ user }: { user: SessionUser }) {
  const audience = isOffice(user.role) ? "office" : user.role === "TEACHER" ? "teacher" : "family";
  const items = notifications.filter((item) => item.audience.includes(audience));
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={`Notifications, ${items.length} unread`}
        className={cn(iconButtonClass("dark"), "relative")}
      >
        <Bell aria-hidden />
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full border-[1.5px] border-ink bg-pastel-pink text-[11px] font-bold text-ink"
        >
          {items.length}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={10} align="end" className="z-50">
          <Popover.Popup className={popupClass}>
            <Popover.Title className="px-2 py-1 font-heading text-lg font-medium">Notifications</Popover.Title>
            <ul className="mt-1 space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 rounded-2xl p-2 transition-colors hover:bg-black/[0.05] focus-visible:outline-2 focus-visible:outline-ink"
                  >
                    <span
                      aria-hidden
                      className={cn("mt-1 size-3 shrink-0 rounded-full border-[1.5px] border-ink", toneStyles[item.tone].solid)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.title}</span>
                      <span className="block text-xs text-muted-foreground">{item.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function AccountMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger aria-label="Account and settings" className={iconButtonClass("dark")}>
        <Settings aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={10} align="end" className="z-50">
          <Popover.Popup className={popupClass}>
            <div className="flex items-center gap-3 p-2">
              <UserAvatar name={user.name} size="lg" />
              <div className="min-w-0">
                <Popover.Title className="truncate font-heading text-lg font-medium leading-tight">{user.name}</Popover.Title>
                <p className="truncate text-xs text-muted-foreground">
                  {user.title ?? roleLabel(user.role)} · {user.email}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-2 p-1">
              {isOffice(user.role) && (
                <Link href="/dashboard/settings" onClick={() => setOpen(false)} className={buttonClass("soft")}>
                  <Settings aria-hidden />
                  School settings
                </Link>
              )}
              <form action={logout} className="contents">
                <button type="submit" className={buttonClass("outline")}>
                  <LogOut aria-hidden />
                  Log out or switch role
                </button>
              </form>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function DashboardHeader({ user }: { user: SessionUser }) {
  const { toggleSidebar } = useSidebar();
  const unread = threadsForRole(threadsStore.useStore(), user.role).reduce((sum, thread) => sum + thread.unread, 0);

  return (
    <header className="sticky top-0 z-20 flex shrink-0 items-center gap-2 bg-canvas/95 px-4 py-3 md:gap-3 md:px-6 print:hidden">
      <button type="button" onClick={toggleSidebar} aria-label="Open menu" className={cn(iconButtonClass(), "md:hidden")}>
        <Menu aria-hidden />
      </button>

      <GlobalSearch role={user.role} />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <NotificationsMenu user={user} />
        <Link
          href="/dashboard/messaging"
          aria-label={unread > 0 ? `Messages, ${unread} unread` : "Messages"}
          className={cn(iconButtonClass("dark"), "hidden sm:inline-flex")}
        >
          <MessageCircle aria-hidden />
        </Link>
        <AccountMenu user={user} />
      </div>
    </header>
  );
}
