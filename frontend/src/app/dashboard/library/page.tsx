import type { Metadata } from "next";
import { Suspense } from "react";

import { PageFallback } from "@/components/dashboard/page-fallback";
import { LibraryView } from "@/components/library/library-view";
import { requireAccess } from "@/lib/auth";
import { firstParam } from "@/lib/format";

export const metadata: Metadata = { title: "Library" };

async function Content({ searchParams }: { searchParams: PageProps<"/dashboard/library">["searchParams"] }) {
  const user = await requireAccess("/dashboard/library");
  const q = firstParam((await searchParams).q) ?? "";

  return <LibraryView key={q} user={user} initialQuery={q} />;
}

export default function LibraryPage({ searchParams }: PageProps<"/dashboard/library">) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
