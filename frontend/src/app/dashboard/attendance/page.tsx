import type { Metadata } from "next";
import { Suspense } from "react";

import { PageFallback } from "@/components/dashboard/page-fallback";
import { AttendanceView } from "@/components/attendance/attendance-view";
import { requireAccess } from "@/lib/auth";
import { firstParam } from "@/lib/format";

export const metadata: Metadata = { title: "Attendance" };

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/attendance">["searchParams"] }) {
  const user = await requireAccess("/dashboard/attendance");
  const classId = firstParam((await searchParams).class);

  return <AttendanceView key={classId} user={user} initialClassId={classId} />;
}

export default function AttendancePage({ searchParams }: PageProps<"/dashboard/attendance">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
