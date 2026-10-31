"use client";

import { useMemo, useState } from "react";
import { BellRing, Download, IndianRupee, Printer, ReceiptText } from "lucide-react";

import { BarList } from "@/components/dashboard/charts";
import {
  Drawer,
  EmptyState,
  Field,
  FormDrawer,
  Pagination,
  ProgressBar,
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
  usePage,
} from "@/components/dashboard/controls";
import { PageHeader, Panel, StatCard, StatRow } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { INVOICE_STATUS, InvoicePill } from "@/components/fees/invoice-pill";
import { downloadCSV, formatCompactINR, formatDate, formatINR } from "@/lib/format";
import {
  GRADES,
  PAYMENT_MODES,
  TODAY_ISO,
  classById,
  classes,
  feeComponents,
  invoiceStatus,
  studentById,
  term,
  termFee,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/mock-data";
import type { SessionUser } from "@/lib/session";
import { invoicesStore, logActivity, newId, paymentsStore, studentsStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type StatusFilter = "all" | InvoiceStatus;
type Tab = "ledger" | "structure";

/** Records a payment against an invoice, capped at what's left to pay. */
function recordPayment(invoice: Invoice, studentName: string, amount: number, mode: string, actor: string, paidByFamily: boolean) {
  const applied = Math.min(amount, invoice.amount - invoice.paid);
  invoicesStore.set((list) => list.map((item) => (item.id === invoice.id ? { ...item, paid: item.paid + applied } : item)));
  paymentsStore.set((list) => [
    { id: newId("pay"), invoiceId: invoice.id, studentName, amount: applied, mode, date: TODAY_ISO },
    ...list,
  ]);
  logActivity({
    actor,
    text: paidByFamily ? `paid ${formatINR(applied)} for ${studentName}` : `recorded ${formatINR(applied)} from ${studentName}`,
    kind: "fee",
    tone: "blue",
  });
  toast(paidByFamily ? `Thanks! ${formatINR(applied)} paid for ${studentName}` : `${formatINR(applied)} recorded for ${studentName}`);
}

export function FeesView({ user, initialQuery }: { user: SessionUser; initialQuery: string }) {
  if (user.studentId) return <FamilyFees user={user} />;
  return <OfficeFees user={user} initialQuery={initialQuery} />;
}

function PaymentForm({
  invoice,
  studentName,
  open,
  onOpenChange,
  actor,
  title,
  submitLabel,
  note,
}: {
  invoice: Invoice | null;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actor: string;
  title: string;
  submitLabel: string;
  note?: string;
}) {
  const balance = invoice ? invoice.amount - invoice.paid : 0;

  return (
    <FormDrawer
      key={invoice?.id}
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={invoice ? `${studentName} · ${formatINR(balance)} left to pay` : undefined}
      submitLabel={submitLabel}
      onSubmit={(data) => {
        if (!invoice) return;
        recordPayment(invoice, studentName, Number(data.get("amount")), String(data.get("mode")), actor, Boolean(note));
        onOpenChange(false);
      }}
    >
      <Field label="Amount (₹)" required hint={`Up to ${formatINR(balance)}.`}>
        <TextInput name="amount" type="number" inputMode="numeric" required min={1} max={balance} defaultValue={balance} />
      </Field>
      <Field label="Paid by" required>
        <SelectInput name="mode" className="w-full" defaultValue={PAYMENT_MODES[0]}>
          {PAYMENT_MODES.map((mode) => (
            <option key={mode}>{mode}</option>
          ))}
        </SelectInput>
      </Field>
      {note && <p className="rounded-3xl bg-pastel-yellow/40 px-4 py-3 text-sm">{note}</p>}
    </FormDrawer>
  );
}

function OfficeFees({ user, initialQuery }: { user: SessionUser; initialQuery: string }) {
  const invoices = invoicesStore.useStore();
  const students = studentsStore.useStore();
  const payments = paymentsStore.useStore();
  const [tab, setTab] = useState<Tab>("ledger");
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [classFilter, setClassFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [payingId, setPayingId] = useState<string | null>(null);

  const studentMap = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const student = studentMap.get(invoice.studentId);
      if (!student) return false;
      if (status !== "all" && invoiceStatus(invoice) !== status) return false;
      if (classFilter !== "all" && student.classId !== classFilter) return false;
      return !search || student.name.toLowerCase().includes(search) || student.admissionNo.toLowerCase().includes(search);
    });
  }, [invoices, studentMap, query, status, classFilter]);

  const { visible, page: safePage, pageCount } = usePage(rows, page, PAGE_SIZE);

  const billed = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const collected = invoices.reduce((sum, invoice) => sum + invoice.paid, 0);
  const overdue = invoices.filter((invoice) => invoiceStatus(invoice) === "overdue");
  const overdueAmount = overdue.reduce((sum, invoice) => sum + invoice.amount - invoice.paid, 0);
  const statusCount = (value: InvoiceStatus) => invoices.filter((invoice) => invoiceStatus(invoice) === value).length;

  const byGrade = GRADES.map((grade) => {
    const list = invoices.filter((invoice) => {
      const student = studentMap.get(invoice.studentId);
      return student && classById(student.classId).grade === grade;
    });
    const total = list.reduce((sum, invoice) => sum + invoice.amount, 0);
    const paid = list.reduce((sum, invoice) => sum + invoice.paid, 0);
    const rate = total ? Math.round((paid / total) * 100) : 0;
    return { label: `Grade ${grade}`, value: rate, display: `${rate}%` };
  });

  const paying = invoices.find((invoice) => invoice.id === payingId) ?? null;

  function exportCSV() {
    downloadCSV("fees.csv", [
      ["Admission no", "Student", "Class", "Invoice", "Amount", "Paid", "Balance", "Due", "Status"],
      ...rows.map((invoice) => {
        const student = studentMap.get(invoice.studentId)!;
        return [
          student.admissionNo,
          student.name,
          classById(student.classId).name,
          invoice.title,
          invoice.amount,
          invoice.paid,
          invoice.amount - invoice.paid,
          invoice.dueDate,
          INVOICE_STATUS[invoiceStatus(invoice)].label,
        ];
      }),
    ]);
    toast(`Exported ${rows.length} invoices`);
  }

  function remindAll() {
    logActivity({ actor: user.name, text: `sent ${overdue.length} fee reminders`, kind: "fee", tone: "yellow" });
    toast(`Reminders sent to ${overdue.length} families`);
  }

  return (
    <>
      <PageHeader
        eyebrow={term.name}
        title="Fees"
        description="Track what's been collected, record payments, and chase what's overdue."
        actions={
          <>
            <button type="button" onClick={exportCSV} className={buttonClass("outline")}>
              <Download aria-hidden /> Export CSV
            </button>
            <button type="button" onClick={remindAll} disabled={overdue.length === 0} className={buttonClass("dark")}>
              <BellRing aria-hidden /> Remind {overdue.length} overdue
            </button>
          </>
        }
      />

      <StatRow label="Fee summary">
        <StatCard label="Collected" value={formatCompactINR(collected)} hint={`of ${formatCompactINR(billed)} billed`} fill={toneStyles.green.fill} doodle="star" />
        <StatCard label="Collection rate" value={`${Math.round((collected / billed) * 100)}%`} hint="this term" fill={toneStyles.yellow.fill} />
        <StatCard label="Outstanding" value={formatCompactINR(billed - collected)} hint="still to come in" fill={toneStyles.blue.fill} doodle="heart" />
        <StatCard label="Overdue" value={formatCompactINR(overdueAmount)} hint={`${overdue.length} families`} fill={toneStyles.peach.fill} />
      </StatRow>

      <Segmented
        label="Fee views"
        value={tab}
        onChange={setTab}
        options={[
          { value: "ledger", label: "Ledger" },
          { value: "structure", label: "Fee structure" },
        ]}
      />

      {tab === "ledger" ? (
        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <Panel
            title="Ledger"
            description={`${rows.length} invoices`}
            action={
              <div className={filterRowClass}>
                <SearchField
                  value={query}
                  onChange={(value) => {
                    setQuery(value);
                    setPage(0);
                  }}
                  placeholder="Find a student"
                  className="sm:w-56"
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
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </SelectInput>
              </div>
            }
          >
            <Segmented
              label="Filter by status"
              className="mb-3"
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(0);
              }}
              options={[
                { value: "all", label: "All", count: invoices.length },
                { value: "overdue", label: "Overdue", count: statusCount("overdue") },
                { value: "partial", label: "Part paid", count: statusCount("partial") },
                { value: "pending", label: "Not due", count: statusCount("pending") },
                { value: "paid", label: "Paid", count: statusCount("paid") },
              ]}
            />

            {rows.length === 0 ? (
              <EmptyState title="No invoices match that" />
            ) : (
              <>
                <div className="relative -mx-2 overflow-x-auto">
                  <table className={cn(tableClass, "min-w-[760px]")}>
                    <thead>
                      <tr>
                        <th scope="col" className={thClass}>Student</th>
                        <th scope="col" className={thClass}>Due</th>
                        <th scope="col" className={thClass}>Paid</th>
                        <th scope="col" className={thClass}>Status</th>
                        <th scope="col" className={thClass}><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((invoice) => {
                        const student = studentMap.get(invoice.studentId)!;
                        const invoiceState = invoiceStatus(invoice);
                        return (
                          <tr key={invoice.id} className={rowClass}>
                            <td className={tdClass}>
                              <span className="flex items-center gap-3">
                                <UserAvatar name={student.name} />
                                <span className="min-w-0">
                                  <span className="block font-medium">{student.name}</span>
                                  <span className="block text-xs text-muted-foreground">{classById(student.classId).name}</span>
                                </span>
                              </span>
                            </td>
                            <td className={cn(tdClass, "tabular-nums text-muted-foreground")}>{formatDate(invoice.dueDate)}</td>
                            <td className={tdClass}>
                              <span className="flex items-center gap-2">
                                <ProgressBar value={(invoice.paid / invoice.amount) * 100} label={`${student.name} payment progress`} className="w-16" />
                                <span className="tabular-nums">
                                  <span className="font-medium">{formatINR(invoice.paid)}</span>
                                  <span className="text-muted-foreground"> / {formatINR(invoice.amount)}</span>
                                </span>
                              </span>
                            </td>
                            <td className={tdClass}><InvoicePill invoice={invoice} /></td>
                            <td className={cn(tdClass, "text-right")}>
                              {invoiceState !== "paid" && (
                                <span className="inline-flex gap-1.5">
                                  <button type="button" onClick={() => setPayingId(invoice.id)} className={buttonClass("soft", "sm")}>
                                    <IndianRupee aria-hidden /> Record
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toast(`Reminder sent to ${student.guardian.name}`)}
                                    className={buttonClass("soft", "sm")}
                                    aria-label={`Send reminder to ${student.guardian.name}`}
                                    title="Send reminder"
                                  >
                                    <BellRing aria-hidden />
                                  </button>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination page={safePage} pageCount={pageCount} total={rows.length} pageSize={PAGE_SIZE} onChange={setPage} />
              </>
            )}
          </Panel>

          <div className="flex flex-col gap-6">
            <Panel title="Collected by grade" description="Share of this term's fees">
              <BarList label="Collection rate by grade" items={byGrade} barClassName="bg-status-good" />
            </Panel>
            <Panel title="Recent payments" description={payments.length ? "Recorded this session" : undefined}>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Payments you record will appear here.</p>
              ) : (
                <ul className="space-y-2">
                  {payments.slice(0, 5).map((payment) => (
                    <li key={payment.id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/[0.04] px-3 py-2 text-sm">
                      <span className="min-w-0 truncate font-medium">{payment.studentName}</span>
                      <span className="shrink-0 tabular-nums">{formatINR(payment.amount)} · {payment.mode}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      ) : (
        <Panel title="Fee structure" description="Per term, by grade" bodyClassName="p-3 md:p-4">
          <div className="overflow-x-auto">
            <table className={cn(tableClass, "min-w-[720px]")}>
              <thead>
                <tr>
                  <th scope="col" className={thClass}>Grade</th>
                  {feeComponents.map((item) => (
                    <th key={item.id} scope="col" className={cn(thClass, "text-right")}>{item.label}</th>
                  ))}
                  <th scope="col" className={cn(thClass, "text-right")}>Term total</th>
                </tr>
              </thead>
              <tbody>
                {GRADES.map((grade) => (
                  <tr key={grade} className={rowClass}>
                    <th scope="row" className={cn(tdClass, "text-left font-medium")}>Grade {grade}</th>
                    {feeComponents.map((item) => (
                      <td key={item.id} className={cn(tdClass, "text-right tabular-nums")}>
                        {formatINR(item.base + item.perGrade * (grade - 5))}
                      </td>
                    ))}
                    <td className={cn(tdClass, "text-right font-semibold tabular-nums")}>{formatINR(termFee(grade))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <PaymentForm
        invoice={paying}
        studentName={paying ? studentMap.get(paying.studentId)!.name : ""}
        open={paying !== null}
        onOpenChange={(open) => !open && setPayingId(null)}
        actor={user.name}
        title="Record payment"
        submitLabel="Record payment"
      />
    </>
  );
}

function FamilyFees({ user }: { user: SessionUser }) {
  const invoices = invoicesStore.useStore();
  const payments = paymentsStore.useStore();
  const students = studentsStore.useStore();
  const student = studentById(user.studentId!, students);
  const invoice = invoices.find((item) => item.studentId === student.id)!;
  const grade = classById(student.classId).grade;
  const balance = invoice.amount - invoice.paid;
  const myPayments = payments.filter((payment) => payment.invoiceId === invoice.id);
  const earlier = invoice.paid - myPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const [paying, setPaying] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow={`${student.name} · ${classById(student.classId).name}`}
        title="Fees"
        description="This term's fee, what's been paid, and receipts."
        actions={
          balance > 0 && (
            <button type="button" onClick={() => setPaying(true)} className={buttonClass("dark")}>
              <IndianRupee aria-hidden /> Pay {formatINR(balance)}
            </button>
          )
        }
      />

      <StatRow label="Fee summary">
        <StatCard label="Term fee" value={formatINR(invoice.amount)} hint={invoice.title} fill={toneStyles.blue.fill} />
        <StatCard label="Paid" value={formatINR(invoice.paid)} hint={`${Math.round((invoice.paid / invoice.amount) * 100)}% of the term`} fill={toneStyles.green.fill} doodle="star" />
        <StatCard label="Balance" value={formatINR(balance)} hint={balance > 0 ? `Due ${formatDate(invoice.dueDate)}` : "All paid up"} fill={toneStyles.yellow.fill} doodle="heart" />
        <StatCard label="Status" value={INVOICE_STATUS[invoiceStatus(invoice)].label} hint={student.name} fill={toneStyles.pink.fill} />
      </StatRow>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="What it covers" description={`Grade ${grade}, per term`}>
          <ul className="space-y-2 text-sm">
            {feeComponents.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 rounded-2xl bg-black/[0.04] px-4 py-2.5">
                <span>{item.label}</span>
                <span className="font-medium tabular-nums">{formatINR(item.base + item.perGrade * (grade - 5))}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 px-4 pt-1 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatINR(invoice.amount)}</span>
            </li>
          </ul>
        </Panel>
        <Panel
          title="Receipts"
          action={
            invoice.paid > 0 && (
              <button type="button" onClick={() => setReceiptOpen(true)} className={buttonClass("outline", "sm")}>
                <ReceiptText aria-hidden /> View receipt
              </button>
            )
          }
        >
          {invoice.paid === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {myPayments.map((payment) => (
                <li key={payment.id} className="flex justify-between gap-3 rounded-2xl bg-black/[0.04] px-4 py-2.5">
                  <span>{formatDate(payment.date)} · {payment.mode}</span>
                  <span className="font-medium tabular-nums">{formatINR(payment.amount)}</span>
                </li>
              ))}
              {earlier > 0 && (
                <li className="flex justify-between gap-3 rounded-2xl bg-black/[0.04] px-4 py-2.5">
                  <span>Earlier this term</span>
                  <span className="font-medium tabular-nums">{formatINR(earlier)}</span>
                </li>
              )}
            </ul>
          )}
        </Panel>
      </div>

      <PaymentForm
        invoice={invoice}
        studentName={student.name}
        open={paying}
        onOpenChange={setPaying}
        actor={user.name}
        title="Pay fees"
        submitLabel="Pay now"
        note="This is a sample flow, so no money changes hands."
      />

      <Drawer
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        title="Fee receipt"
        description={`${student.name} · ${student.admissionNo}`}
        printable
        footer={
          <button type="button" onClick={() => window.print()} className={buttonClass("dark", "sm")}>
            <Printer aria-hidden /> Print receipt
          </button>
        }
      >
        <dl className="space-y-2 rounded-[28px] bg-white p-4 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Class</dt><dd className="font-medium">{classById(student.classId).name}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Invoice</dt><dd className="font-medium">{invoice.title}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Billed</dt><dd className="font-medium tabular-nums">{formatINR(invoice.amount)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Paid</dt><dd className="font-medium tabular-nums">{formatINR(invoice.paid)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Balance</dt><dd className="font-medium tabular-nums">{formatINR(balance)}</dd></div>
        </dl>
      </Drawer>
    </>
  );
}
