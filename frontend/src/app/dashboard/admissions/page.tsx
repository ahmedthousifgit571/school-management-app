import type { Metadata } from "next";

import { AdmissionsView } from "@/components/admissions/admissions-view";
import { requireAccess } from "@/lib/auth";

export const metadata: Metadata = { title: "Admissions" };

export default async function AdmissionsPage() {
  const user = await requireAccess("/dashboard/admissions");

  return <AdmissionsView actor={user.name} />;
}
