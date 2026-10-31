import type { Metadata } from "next";
import { Suspense } from "react";

import { PageFallback } from "@/components/dashboard/page-fallback";
import { GradesView } from "@/components/grades/grades-view";
import { requireAccess } from "@/lib/auth";
import { firstParam } from "@/lib/format";

export const metadata: Metadata = { title: "Grades & reports" };

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/grades">["searchParams"] }) {
  const user = await requireAccess("/dashboard/grades");
  const { class: classId, student } = await searchParams;

  return (
    <GradesView
      key={`${firstParam(classId)}-${firstParam(student)}`}
      user={user}
      initialClassId={firstParam(classId)}
      initialStudentId={firstParam(student)}
    />
  );
}

export default function GradesPage({ searchParams }: PageProps<"/dashboard/grades">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
