"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, FileText, Mail, MessageCircle, Phone, UserPlus } from "lucide-react";

import {
  Drawer,
  EmptyState,
  Field,
  FormDrawer,
  Pagination,
  Pill,
  ProgressBar,
  SearchField,
  SelectInput,
  TextInput,
  buttonClass,
  filterRowClass,
  rowClass,
  tableClass,
  tdClass,
  thClass,
  usePage,
} from "@/components/dashboard/controls";
import { InvoicePill } from "@/components/fees/invoice-pill";
import { PageHeader, Panel, StatCard, StatRow } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { downloadCSV, formatDate, formatNumber } from "@/lib/format";
import {
  classById,
  classes,
  gradeFor,
  newStudentInvoice,
  routeById,
  routes,
  studentAverage,
  teacherClassIds,
  type Student,
} from "@/lib/mock-data";
import { isOffice } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";
import { invoicesStore, logActivity, newId, studentsStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function averageFor(student: Student) {
  return student.status === "new" ? null : studentAverage(student.id, "ut1");
}

export function StudentsView({ user, initialQuery }: { user: SessionUser; initialQuery: string }) {
  const allStudents = studentsStore.useStore();
  const invoices = invoicesStore.useStore();
  const [query, setQuery] = useState(initialQuery);
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const visibleClassIds = user.teacherId ? teacherClassIds(user.teacherId) : classes.map((item) => item.id);
  const inScope = useMemo(
    () => allStudents.filter((student) => visibleClassIds.includes(student.classId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derived from the session, stable for this page
    [allStudents, user.teacherId]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return inScope.filter((student) => {
      if (classFilter !== "all" && student.classId !== classFilter) return false;
      if (!term) return true;
      return (
        student.name.toLowerCase().includes(term) ||
        student.admissionNo.toLowerCase().includes(term) ||
        student.guardian.name.toLowerCase().includes(term)
      );
    });
  }, [inScope, query, classFilter]);

  const { visible, page: safePage, pageCount } = usePage(filtered, page, PAGE_SIZE);
  const selected = allStudents.find((student) => student.id === selectedId) ?? null;
  const invoiceById = new Map(invoices.map((invoice) => [invoice.studentId, invoice]));

  const averageAttendance = Math.round(inScope.reduce((sum, student) => sum + student.attendance, 0) / Math.max(1, inScope.length));
  const riders = inScope.filter((student) => student.routeId).length;
  const newStudents = inScope.filter((student) => student.status === "new").length;

  function exportCSV() {
    downloadCSV("students.csv", [
      ["Admission no", "Name", "Class", "Roll", "Attendance %", "Guardian", "Phone", "Email"],
      ...filtered.map((student) => [
        student.admissionNo,
        student.name,
        classById(student.classId).name,
        student.roll,
        student.attendance,
        student.guardian.name,
        student.guardian.phone,
        student.guardian.email,
      ]),
    ]);
    toast(`Exported ${filtered.length} students`);
  }

  function addStudent(data: FormData) {
    const name = String(data.get("name")).trim();
    const classId = String(data.get("classId"));
    const route = String(data.get("route"));
    const student: Student = {
      id: newId("new"),
      admissionNo: `ADM-2026-N${String(newStudents + 1).padStart(3, "0")}`,
      name,
      classId,
      roll: allStudents.filter((item) => item.classId === classId).length + 1,
      dob: String(data.get("dob")),
      house: "Banyan",
      bloodGroup: String(data.get("bloodGroup")),
      attendance: 100,
      routeId: route === "none" ? null : route,
      status: "new",
      guardian: {
        name: String(data.get("guardian")).trim(),
        phone: String(data.get("phone")).trim(),
        email: String(data.get("email")).trim(),
      },
      address: String(data.get("address")).trim(),
    };
    studentsStore.set((list) => [student, ...list]);
    invoicesStore.set((list) => [newStudentInvoice(student), ...list]);
    logActivity({ actor: user.name, text: `enrolled ${name} in ${classById(classId).name}`, kind: "admission", tone: "green" });
    toast(`${name} added to ${classById(classId).name}`);
    setAdding(false);
    setPage(0);
  }

  return (
    <>
      <PageHeader
        eyebrow="Everyone on the roll"
        title="Students"
        description="Search the directory, open a profile, and enrol new students."
        actions={
          <>
            <button type="button" onClick={exportCSV} className={buttonClass("outline")}>
              <Download aria-hidden /> Export CSV
            </button>
            {isOffice(user.role) && (
              <button type="button" onClick={() => setAdding(true)} className={buttonClass("dark")}>
                <UserPlus aria-hidden /> Add student
              </button>
            )}
          </>
        }
      />

      <StatRow label="Student summary">
        <StatCard label="Enrolled" value={formatNumber(inScope.length)} hint={`across ${visibleClassIds.length} classes`} fill={toneStyles.yellow.fill} doodle="star" />
        <StatCard label="Average attendance" value={`${averageAttendance}%`} hint="this term" fill={toneStyles.green.fill} />
        <StatCard label="New this term" value={String(newStudents)} hint="joined since April" fill={toneStyles.pink.fill} doodle="heart" />
        <StatCard label="On a bus route" value={formatNumber(riders)} hint={`${routes.length} routes`} fill={toneStyles.blue.fill} />
      </StatRow>

      <Panel
        title="Directory"
        description={`${formatNumber(filtered.length)} ${filtered.length === 1 ? "student" : "students"}`}
        action={
          <div className={filterRowClass}>
            <SearchField
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(0);
              }}
              placeholder="Name, admission no, guardian"
              className="sm:w-72"
            />
            <SelectInput
              aria-label="Filter by class"
              value={classFilter}
              onChange={(event) => {
                setClassFilter(event.target.value);
                setPage(0);
              }}
            >
              <option value="all">All classes</option>
              {classes
                .filter((item) => visibleClassIds.includes(item.id))
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </SelectInput>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="No students match that"
            hint="Try a different name or clear the class filter."
            action={
              <button
                type="button"
                className={buttonClass("soft", "sm")}
                onClick={() => {
                  setQuery("");
                  setClassFilter("all");
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            <div className="-mx-2 overflow-x-auto">
              <table className={cn(tableClass, "min-w-[760px]")}>
                <thead>
                  <tr>
                    <th scope="col" className={thClass}>Student</th>
                    <th scope="col" className={thClass}>Class</th>
                    <th scope="col" className={thClass}>Attendance</th>
                    <th scope="col" className={thClass}>Grade</th>
                    {isOffice(user.role) && <th scope="col" className={thClass}>Fees</th>}
                    <th scope="col" className={thClass}>Guardian</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((student) => {
                    const average = averageFor(student);
                    const invoice = invoiceById.get(student.id);
                    return (
                      <tr key={student.id} className={rowClass}>
                        <td className={tdClass}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(student.id)}
                            className="flex cursor-pointer items-center gap-3 rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-ink"
                          >
                            <UserAvatar name={student.name} />
                            <span className="min-w-0">
                              <span className="block font-medium hover:underline">{student.name}</span>
                              <span className="block text-xs text-muted-foreground">{student.admissionNo}</span>
                            </span>
                          </button>
                        </td>
                        <td className={tdClass}>
                          <Pill tone={classById(student.classId).tone}>{classById(student.classId).short}</Pill>
                        </td>
                        <td className={tdClass}>
                          <div className="flex items-center gap-2">
                            <ProgressBar value={student.attendance} label={`${student.name} attendance`} className="w-20" />
                            <span className="font-medium tabular-nums">{student.attendance}%</span>
                          </div>
                        </td>
                        <td className={cn(tdClass, "font-heading font-semibold")}>{average === null ? "New" : gradeFor(average)}</td>
                        {isOffice(user.role) && (
                          <td className={tdClass}>{invoice && <InvoicePill invoice={invoice} />}</td>
                        )}
                        <td className={tdClass}>
                          <span className="block">{student.guardian.name}</span>
                          <span className="block text-xs tabular-nums text-muted-foreground">{student.guardian.phone}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={safePage} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </Panel>

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selected?.name ?? ""}
        description={selected ? `${classById(selected.classId).name} · Roll ${selected.roll} · ${selected.admissionNo}` : undefined}
        footer={
          selected && (
            <>
              <Link href={`/dashboard/grades?student=${selected.id}`} className={buttonClass("dark", "sm")}>
                <FileText aria-hidden /> Report card
              </Link>
              <Link href="/dashboard/messaging" className={buttonClass("outline", "sm")}>
                <MessageCircle aria-hidden /> Message guardian
              </Link>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-[28px] bg-white p-4">
              <UserAvatar name={selected.name} size="xl" />
              <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Attendance</dt>
                  <dd className="font-semibold tabular-nums">{selected.attendance}%</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Grade</dt>
                  <dd className="font-semibold">{averageFor(selected) === null ? "New" : gradeFor(averageFor(selected)!)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">House</dt>
                  <dd className="font-semibold">{selected.house}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Blood group</dt>
                  <dd className="font-semibold">{selected.bloodGroup}</dd>
                </div>
              </dl>
            </div>

            <section className="space-y-1 text-sm">
              <h3 className="font-heading text-lg font-medium">Details</h3>
              <p><span className="text-muted-foreground">Born:</span> {selected.dob ? formatDate(selected.dob, { day: "numeric", month: "long", year: "numeric" }) : "Not recorded"}</p>
              <p><span className="text-muted-foreground">Home:</span> {selected.address || "Not recorded"}</p>
              <p><span className="text-muted-foreground">Bus:</span> {selected.routeId ? `${routeById(selected.routeId).name} (${selected.routeId.toUpperCase()})` : "Makes own way"}</p>
            </section>

            <section className="space-y-2">
              <h3 className="font-heading text-lg font-medium">Guardian</h3>
              <p className="text-sm font-medium">{selected.guardian.name}</p>
              <div className="flex flex-wrap gap-2">
                <a href={`tel:${selected.guardian.phone.replaceAll(" ", "")}`} className={buttonClass("soft", "sm")}>
                  <Phone aria-hidden /> {selected.guardian.phone}
                </a>
                <a href={`mailto:${selected.guardian.email}`} className={buttonClass("soft", "sm")}>
                  <Mail aria-hidden /> Email
                </a>
              </div>
            </section>

            {invoiceById.get(selected.id) && isOffice(user.role) && (
              <section className="space-y-2">
                <h3 className="font-heading text-lg font-medium">Fees</h3>
                <InvoicePill invoice={invoiceById.get(selected.id)!} showBalance />
              </section>
            )}
          </div>
        )}
      </Drawer>

      <FormDrawer
        open={adding}
        onOpenChange={setAdding}
        title="Add student"
        description="Creates their record and their Term 1 fee invoice."
        submitLabel="Add student"
        onSubmit={addStudent}
      >
        <Field label="Full name" required>
          <TextInput name="name" required autoComplete="off" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Class" required>
            <SelectInput name="classId" className="w-full" defaultValue="5a">
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Date of birth" required>
            <TextInput name="dob" type="date" required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Blood group">
            <SelectInput name="bloodGroup" className="w-full" defaultValue="O+">
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((group) => (
                <option key={group}>{group}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Bus route">
            <SelectInput name="route" className="w-full" defaultValue="none">
              <option value="none">Makes own way</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>{route.name}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Field label="Guardian's name" required>
          <TextInput name="guardian" required autoComplete="off" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Guardian's phone" required>
            <TextInput name="phone" type="tel" required placeholder="+91" autoComplete="off" />
          </Field>
          <Field label="Guardian's email">
            <TextInput name="email" type="email" autoComplete="off" />
          </Field>
        </div>
        <Field label="Home address">
          <TextInput name="address" autoComplete="off" />
        </Field>
      </FormDrawer>
    </>
  );
}
