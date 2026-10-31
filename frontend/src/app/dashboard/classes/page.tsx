import type { Metadata } from "next";
import { Suspense } from "react";

import { PageFallback } from "@/components/dashboard/page-fallback";
import { ClassesView } from "@/components/classes/classes-view";
import { requireAccess } from "@/lib/auth";
import { firstParam } from "@/lib/format";

export const metadata: Metadata = { title: "Classes" };

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/classes">["searchParams"] }) {
  const user = await requireAccess("/dashboard/classes");
  const q = firstParam((await searchParams).q) ?? "";

  return <ClassesView key={q} user={user} initialQuery={q} />;
}

export default function ClassesPage({ searchParams }: PageProps<"/dashboard/classes">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
