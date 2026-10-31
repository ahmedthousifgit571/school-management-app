"use client";

import { useState } from "react";
import { ArrowRight, Phone, RotateCcw, UserPlus, X } from "lucide-react";

import {
  Field,
  FormDrawer,
  Pill,
  SelectInput,
  TextInput,
  buttonClass,
} from "@/components/dashboard/controls";
import { PageHeader, Panel, StatCard, StatRow } from "@/components/dashboard/panel";
import { toneStyles } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import { daysBetween, formatDate } from "@/lib/format";
import {
  ADMISSION_STAGES,
  GRADES,
  TODAY_ISO,
  classes,
  newStudentInvoice,
  type AdmissionStage,
  type Application,
  type Student,
} from "@/lib/mock-data";
import { applicationsStore, invoicesStore, logActivity, newId, studentsStore, toast } from "@/lib/stores";
import { cn } from "@/lib/utils";

const NEXT_LABEL: Partial<Record<AdmissionStage, string>> = {
  applied: "Get documents",
  documents: "Book interview",
  interview: "Send offer",
  offer: "Enrol student",
};

function nextStage(stage: AdmissionStage): AdmissionStage | null {
  const index = ADMISSION_STAGES.findIndex((item) => item.id === stage);
  return ADMISSION_STAGES[index + 1]?.id ?? null;
}

export function AdmissionsView({ actor }: { actor: string }) {
  const applications = applicationsStore.useStore();
  const [adding, setAdding] = useState(false);

  const newThisWeek = applications.filter((item) => daysBetween(item.appliedOn, TODAY_ISO) <= 7).length;
  const active = applications.filter((item) => item.stage !== "enrolled" && item.stage !== "rejected").length;
  const offers = applications.filter((item) => item.stage === "offer").length;
  const enrolled = applications.filter((item) => item.stage === "enrolled").length;
  const rejected = applications.filter((item) => item.stage === "rejected");

  function moveTo(application: Application, stage: AdmissionStage) {
    applicationsStore.set((list) => list.map((item) => (item.id === application.id ? { ...item, stage } : item)));

    if (stage === "enrolled") {
      enrol(application);
      return;
    }
    if (stage !== "rejected") {
      const label = ADMISSION_STAGES.find((item) => item.id === stage)!.label;
      toast(`${application.applicant} moved to ${label}`);
    } else {
      toast(`${application.applicant}'s application was declined`);
    }
  }

  function enrol(application: Application) {
    const schoolClass = classes.find((item) => item.grade === application.grade)!;
    const students = studentsStore.get();
    const student: Student = {
      id: `adm-${application.id}`,
      admissionNo: `ADM-2026-A${application.id.slice(2).padStart(3, "0")}`,
      name: application.applicant,
      classId: schoolClass.id,
      roll: students.filter((item) => item.classId === schoolClass.id).length + 1,
      dob: "",
      house: "Neem",
      bloodGroup: "Not recorded",
      attendance: 100,
      routeId: null,
      status: "new",
      guardian: { name: application.guardian, phone: application.phone, email: "" },
      address: "",
    };
    studentsStore.set((list) => [student, ...list]);
    invoicesStore.set((list) => [newStudentInvoice(student), ...list]);
    logActivity({ actor, text: `enrolled ${application.applicant} in ${schoolClass.name}`, kind: "admission", tone: "green" });
    toast(`${application.applicant} enrolled in ${schoolClass.name}`);
  }

  function addApplication(data: FormData) {
    const applicant = String(data.get("applicant")).trim();
    applicationsStore.set((list) => [
      {
        id: newId("ap"),
        applicant,
        grade: Number(data.get("grade")),
        guardian: String(data.get("guardian")).trim(),
        phone: String(data.get("phone")).trim(),
        previousSchool: String(data.get("previousSchool")).trim(),
        appliedOn: TODAY_ISO,
        stage: "applied",
      },
      ...list,
    ]);
    logActivity({ actor: "Admissions desk", text: `received an application from ${applicant}`, kind: "admission", tone: "yellow" });
    toast(`Application added for ${applicant}`);
    setAdding(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="From enquiry to first day"
        title="Admissions"
        description="Move each application along. Enrolling creates the student's record and first fee invoice."
        actions={
          <button type="button" onClick={() => setAdding(true)} className={buttonClass("dark")}>
            <UserPlus aria-hidden /> New application
          </button>
        }
      />

      <StatRow label="Admissions summary">
        <StatCard label="In progress" value={String(active)} hint="applications" fill={toneStyles.blue.fill} doodle="star" />
        <StatCard label="New this week" value={String(newThisWeek)} hint="since last Friday" fill={toneStyles.yellow.fill} />
        <StatCard label="Offers out" value={String(offers)} hint="awaiting a reply" fill={toneStyles.pink.fill} doodle="heart" />
        <StatCard label="Enrolled" value={String(enrolled)} hint="for 2026–27" fill={toneStyles.green.fill} />
      </StatRow>

      <section aria-label="Admissions pipeline" className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        <ol className="grid min-w-[1040px] grid-cols-5 gap-3">
          {ADMISSION_STAGES.map((stage) => {
            const items = applications.filter((item) => item.stage === stage.id);
            return (
              <li key={stage.id} className="flex flex-col gap-2 rounded-[28px] border-[1.5px] border-black/10 bg-black/[0.03] p-2.5">
                <header className="flex items-center justify-between gap-2 px-1.5 py-1">
                  <h2 className="font-heading text-base font-medium">{stage.label}</h2>
                  <span className={cn("flex size-7 items-center justify-center rounded-full border-[1.5px] border-ink text-xs font-bold tabular-nums", toneStyles[stage.tone].fill)}>
                    {items.length}
                  </span>
                </header>
                <ul className="space-y-2">
                  {items.map((application) => {
                    const next = nextStage(application.stage);
                    const nextLabel = NEXT_LABEL[application.stage];
                    return (
                      <li key={application.id} className="space-y-2 rounded-[22px] bg-white p-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={application.applicant} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{application.applicant}</p>
                            <p className="text-xs text-muted-foreground">Grade {application.grade} · {formatDate(application.appliedOn)}</p>
                          </div>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{application.previousSchool}</p>
                        <a
                          href={`tel:${application.phone.replaceAll(" ", "")}`}
                          className="inline-flex items-center gap-1.5 rounded-full text-xs font-medium hover:underline focus-visible:outline-2 focus-visible:outline-ink"
                        >
                          <Phone className="size-3.5" aria-hidden /> {application.guardian}
                        </a>
                        {next && nextLabel ? (
                          <div className="flex gap-1.5 pt-1">
                            <button type="button" onClick={() => moveTo(application, next)} className={cn(buttonClass("dark", "sm"), "min-w-0 flex-1 px-2")}>
                              <span className="truncate">{nextLabel}</span>
                              <ArrowRight aria-hidden />
                            </button>
                            <button
                              type="button"
                              aria-label={`Decline ${application.applicant}`}
                              title="Decline"
                              onClick={() => moveTo(application, "rejected")}
                              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-black/15 transition-colors duration-200 hover:border-destructive hover:text-destructive focus-visible:outline-2 focus-visible:outline-ink"
                            >
                              <X className="size-4" aria-hidden />
                            </button>
                          </div>
                        ) : (
                          <Pill tone="green">On the roll</Pill>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>

      {rejected.length > 0 && (
        <Panel title="Declined" description="You can bring an application back at any time." bodyClassName="p-3 md:p-4">
          <ul className="space-y-1.5">
            {rejected.map((application) => (
              <li key={application.id} className="flex items-center gap-3 rounded-[24px] bg-black/[0.04] p-2 pr-2.5">
                <UserAvatar name={application.applicant} />
                <p className="min-w-0 flex-1 truncate text-sm">
                  <span className="font-medium">{application.applicant}</span>
                  <span className="text-muted-foreground"> · Grade {application.grade}</span>
                </p>
                <button type="button" onClick={() => moveTo(application, "applied")} className={buttonClass("soft", "sm")}>
                  <RotateCcw aria-hidden /> Reopen
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <FormDrawer open={adding} onOpenChange={setAdding} title="New application" submitLabel="Add application" onSubmit={addApplication}>
        <Field label="Applicant's name" required>
          <TextInput name="applicant" required autoComplete="off" />
        </Field>
        <Field label="Applying for" required>
          <SelectInput name="grade" className="w-full" defaultValue={GRADES[0]}>
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Guardian's name" required>
          <TextInput name="guardian" required autoComplete="off" />
        </Field>
        <Field label="Guardian's phone" required>
          <TextInput name="phone" type="tel" required placeholder="+91" autoComplete="off" />
        </Field>
        <Field label="Previous school">
          <TextInput name="previousSchool" autoComplete="off" />
        </Field>
      </FormDrawer>
    </>
  );
}
