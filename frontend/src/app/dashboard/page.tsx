import type { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/overview/dashboard-view";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return <DashboardView user={user} />;
}
