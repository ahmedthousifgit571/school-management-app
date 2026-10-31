import type { Metadata } from "next";
import { Suspense } from "react";

import { PageFallback } from "@/components/dashboard/page-fallback";
import { FeesView } from "@/components/fees/fees-view";
import { requireAccess } from "@/lib/auth";
import { firstParam } from "@/lib/format";

export const metadata: Metadata = { title: "Fees" };

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/fees">["searchParams"] }) {
  const user = await requireAccess("/dashboard/fees");
  const q = firstParam((await searchParams).q) ?? "";

  return <FeesView key={q} user={user} initialQuery={q} />;
}

export default function FeesPage({ searchParams }: PageProps<"/dashboard/fees">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
