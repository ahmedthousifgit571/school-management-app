import type { Metadata } from "next";
import { Suspense } from "react";

import { PageFallback } from "@/components/dashboard/page-fallback";
import { TimetableView } from "@/components/timetable/timetable-view";
import { requireAccess } from "@/lib/auth";
import { firstParam } from "@/lib/format";

export const metadata: Metadata = { title: "Timetable" };

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/timetable">["searchParams"] }) {
  const user = await requireAccess("/dashboard/timetable");
  const { class: classId, teacher } = await searchParams;

  return (
    <TimetableView
      key={`${firstParam(classId)}-${firstParam(teacher)}`}
      user={user}
      initialClassId={firstParam(classId)}
      initialTeacherId={firstParam(teacher)}
    />
  );
}

export default function TimetablePage({ searchParams }: PageProps<"/dashboard/timetable">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
