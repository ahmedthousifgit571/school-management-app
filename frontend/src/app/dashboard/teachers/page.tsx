import type { Metadata } from "next";
import { Suspense } from "react";

import { PageFallback } from "@/components/dashboard/page-fallback";
import { TeachersView } from "@/components/teachers/teachers-view";
import { requireAccess } from "@/lib/auth";
import { firstParam } from "@/lib/format";

export const metadata: Metadata = { title: "Teachers" };

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/teachers">["searchParams"] }) {
  const user = await requireAccess("/dashboard/teachers");
  const q = firstParam((await searchParams).q) ?? "";

  return <TeachersView key={q} actor={user.name} initialQuery={q} />;
}

export default function TeachersPage({ searchParams }: PageProps<"/dashboard/teachers">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
