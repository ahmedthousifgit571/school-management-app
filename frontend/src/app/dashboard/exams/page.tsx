import type { Metadata } from "next";

import { ExamsView } from "@/components/exams/exams-view";
import { requireAccess } from "@/lib/auth";

export const metadata: Metadata = { title: "Exams" };

export default async function ExamsPage() {
  const user = await requireAccess("/dashboard/exams");

  return <ExamsView user={user} />;
}
