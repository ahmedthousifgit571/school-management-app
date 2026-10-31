import type { Metadata } from "next";
import { Suspense } from "react";

import { PageFallback } from "@/components/dashboard/page-fallback";
import { StudentsView } from "@/components/students/students-view";
import { requireAccess } from "@/lib/auth";
import { firstParam } from "@/lib/format";

export const metadata: Metadata = { title: "Students" };

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/students">["searchParams"] }) {
  const user = await requireAccess("/dashboard/students");
  const q = firstParam((await searchParams).q) ?? "";

  return <StudentsView key={q} user={user} initialQuery={q} />;
}

export default function StudentsPage({ searchParams }: PageProps<"/dashboard/students">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
