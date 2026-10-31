import type { Metadata } from "next";

import { AssignmentsView } from "@/components/assignments/assignments-view";
import { requireAccess } from "@/lib/auth";

export const metadata: Metadata = { title: "Assignments" };

export default async function AssignmentsPage() {
  const user = await requireAccess("/dashboard/assignments");

  return <AssignmentsView user={user} />;
}
