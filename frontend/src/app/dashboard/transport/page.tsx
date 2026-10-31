import type { Metadata } from "next";

import { TransportView } from "@/components/transport/transport-view";
import { requireAccess } from "@/lib/auth";

export const metadata: Metadata = { title: "Transport" };

export default async function TransportPage() {
  const user = await requireAccess("/dashboard/transport");

  return <TransportView user={user} />;
}
