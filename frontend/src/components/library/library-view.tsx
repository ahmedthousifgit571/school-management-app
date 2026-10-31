"use client";

import { useState } from "react";
import { BookMarked, Undo2 } from "lucide-react";

import {
  EmptyState,
  Field,
  FormDrawer,
  Pill,
  SearchField,
  Segmented,
  SelectInput,
  TextInput,
  buttonClass,
  filterRowClass,
  rowClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/dashboard/controls";
import { PageHeader, Panel, StatCard, StatRow, cardOutline } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { addDays, daysBetween, formatDate, formatINR } from "@/lib/format";
import {
  FINE_PER_DAY,
  TODAY_ISO,
  books,
  classById,
  type Book,
  type Loan,
} from "@/lib/mock-data";
import { canManage } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";
import { loansStore, logActivity, newId, studentsStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

const LOAN_DAYS = 14;

type Tab = "catalogue" | "loans";

function fineFor(loan: Loan) {
  return Math.max(0, daysBetween(loan.due, TODAY_ISO)) * FINE_PER_DAY;
}

export function LibraryView({ user, initialQuery }: { user: SessionUser; initialQuery: string }) {
  const loans = loansStore.useStore();
  const students = studentsStore.useStore();
  const [tab, setTab] = useState<Tab>("catalogue");
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [issuing, setIssuing] = useState<Book | null>(null);
  const [reserved, setReserved] = useState<string[]>([]);

  const manage = canManage(user.role);
  const activeLoans = loans.filter((loan) => !loan.returned);
  const scopedLoans = user.studentId ? activeLoans.filter((loan) => loan.studentId === user.studentId) : activeLoans;
  const overdue = scopedLoans.filter((loan) => loan.due < TODAY_ISO);
  const fines = overdue.reduce((sum, loan) => sum + fineFor(loan), 0);

  const available = (book: Book) => book.copies - activeLoans.filter((loan) => loan.bookId === book.id).length;
  const categories = [...new Set(books.map((book) => book.category))].sort();
  const search = query.trim().toLowerCase();
  const visibleBooks = books.filter((book) => {
    if (category !== "all" && book.category !== category) return false;
    return !search || book.title.toLowerCase().includes(search) || book.author.toLowerCase().includes(search);
  });

  const bookById = (id: string) => books.find((book) => book.id === id)!;
  const studentOf = (id: string) => students.find((student) => student.id === id)!;

  function issue(data: FormData) {
    if (!issuing) return;
    const admissionNo = String(data.get("student")).split(" · ")[0]!.trim();
    const student = students.find((item) => item.admissionNo === admissionNo);
    if (!student) {
      toast("Pick a student from the list");
      return;
    }
    loansStore.set((list) => [
      { id: newId("l"), bookId: issuing.id, studentId: student.id, issued: TODAY_ISO, due: String(data.get("due")) },
      ...list,
    ]);
    logActivity({ actor: "Library", text: `issued “${issuing.title}” to ${student.name}`, kind: "library", tone: "lilac" });
    toast(`“${issuing.title}” issued to ${student.name}`);
    setIssuing(null);
  }

  function giveBack(loan: Loan) {
    const fine = fineFor(loan);
    loansStore.set((list) => list.map((item) => (item.id === loan.id ? { ...item, returned: TODAY_ISO } : item)));
    toast(`“${bookById(loan.bookId).title}” returned${fine ? `, ${formatINR(fine)} fine` : ""}`);
  }

  return (
    <>
      <PageHeader
        eyebrow={`${books.reduce((sum, book) => sum + book.copies, 0)} copies on the shelves`}
        title="Library"
        description={manage ? "Browse the catalogue, issue books, and handle returns and fines." : "Browse the catalogue, reserve a book, and keep track of what you've borrowed."}
      />

      <StatRow label="Library summary">
        <StatCard label="Titles" value={String(books.length)} hint={`${categories.length} categories`} fill={toneStyles.lilac.fill} doodle="star" />
        <StatCard label={user.studentId ? "On loan" : "Books out"} value={String(scopedLoans.length)} hint={`${LOAN_DAYS}-day loans`} fill={toneStyles.blue.fill} />
        <StatCard label="Overdue" value={String(overdue.length)} hint={`${formatINR(FINE_PER_DAY)} a day`} fill={toneStyles.peach.fill} doodle="heart" />
        <StatCard label="Fines due" value={formatINR(fines)} hint="so far" fill={toneStyles.yellow.fill} />
      </StatRow>

      <Segmented
        label="Library views"
        value={tab}
        onChange={setTab}
        options={[
          { value: "catalogue", label: "Catalogue", count: books.length },
          { value: "loans", label: user.studentId ? "My loans" : "Loans", count: scopedLoans.length },
        ]}
      />

      {tab === "catalogue" ? (
        <Panel
          title="Catalogue"
          description={`${visibleBooks.length} titles`}
          action={
            <div className={filterRowClass}>
              <SearchField value={query} onChange={setQuery} placeholder="Title or author" className="sm:w-64" />
              <SelectInput aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </SelectInput>
            </div>
          }
        >
          {visibleBooks.length === 0 ? (
            <EmptyState title="No books match that" />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleBooks.map((book) => {
                const left = available(book);
                const isReserved = reserved.includes(book.id);
                return (
                  <li key={book.id} className={cn("flex gap-3 p-3", cardOutline, "rounded-[28px]")}>
                    <span className={cn("flex h-24 w-[4.25rem] shrink-0 items-center justify-center rounded-r-2xl rounded-l-md border-[1.5px] border-ink", toneStyles[book.tone].fill)}>
                      <BookMarked className="size-6" aria-hidden />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="line-clamp-2 font-medium leading-snug">{book.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                      <p className="text-xs text-muted-foreground">Shelf {book.shelf}</p>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-1.5 pt-1">
                        <Pill tone={left > 0 ? "green" : "peach"}>{left > 0 ? `${left} of ${book.copies} in` : "All out"}</Pill>
                        {manage ? (
                          <button type="button" disabled={left === 0} onClick={() => setIssuing(book)} className={buttonClass("dark", "sm")}>
                            Issue
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isReserved}
                            onClick={() => {
                              setReserved((list) => [...list, book.id]);
                              toast(`“${book.title}” reserved for you`);
                            }}
                            className={buttonClass("outline", "sm")}
                          >
                            {isReserved ? "Reserved" : "Reserve"}
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      ) : (
        <Panel title={user.studentId ? "My loans" : "Books out"} bodyClassName="p-3 md:p-4">
          {scopedLoans.length === 0 ? (
            <EmptyState title="Nothing on loan" hint="Books you borrow will show up here." />
          ) : (
            <div className="relative overflow-x-auto">
              <table className={cn(tableClass, "min-w-[680px]")}>
                <thead>
                  <tr>
                    <th scope="col" className={thClass}>Book</th>
                    {!user.studentId && <th scope="col" className={thClass}>Borrower</th>}
                    <th scope="col" className={thClass}>Due</th>
                    <th scope="col" className={thClass}>Status</th>
                    {manage && <th scope="col" className={thClass}><span className="sr-only">Actions</span></th>}
                  </tr>
                </thead>
                <tbody>
                  {[...scopedLoans].sort((a, b) => a.due.localeCompare(b.due)).map((loan) => {
                    const student = studentOf(loan.studentId);
                    const fine = fineFor(loan);
                    return (
                      <tr key={loan.id} className={rowClass}>
                        <td className={cn(tdClass, "font-medium")}>{bookById(loan.bookId).title}</td>
                        {!user.studentId && (
                          <td className={tdClass}>
                            {student.name}
                            <span className="text-muted-foreground"> · {classById(student.classId).short}</span>
                          </td>
                        )}
                        <td className={cn(tdClass, "tabular-nums text-muted-foreground")}>{formatDate(loan.due)}</td>
                        <td className={tdClass}>
                          {fine > 0 ? <Pill tone="peach">Overdue · {formatINR(fine)}</Pill> : <Pill tone="green">On time</Pill>}
                        </td>
                        {manage && (
                          <td className={cn(tdClass, "text-right")}>
                            <button type="button" onClick={() => giveBack(loan)} className={buttonClass("soft", "sm")}>
                              <Undo2 aria-hidden /> Return
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      <FormDrawer
        key={issuing?.id}
        open={issuing !== null}
        onOpenChange={(open) => !open && setIssuing(null)}
        title="Issue book"
        description={issuing?.title}
        submitLabel="Issue book"
        onSubmit={issue}
      >
        <Field label="Student" required hint="Start typing a name or admission number.">
          <TextInput name="student" required list="library-students" autoComplete="off" />
        </Field>
        <datalist id="library-students">
          {students.map((student) => (
            <option key={student.id} value={`${student.admissionNo} · ${student.name}`} />
          ))}
        </datalist>
        <Field label="Due back" required>
          <TextInput name="due" type="date" required min={TODAY_ISO} defaultValue={addDays(TODAY_ISO, LOAN_DAYS)} />
        </Field>
      </FormDrawer>
    </>
  );
}
