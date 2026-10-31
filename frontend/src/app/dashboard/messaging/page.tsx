import type { Metadata } from "next";

import { MessagingView } from "@/components/messaging/messaging-view";
import { requireAccess } from "@/lib/auth";

export const metadata: Metadata = { title: "Messaging" };

export default async function MessagingPage() {
  const user = await requireAccess("/dashboard/messaging");

  return <MessagingView user={user} />;
}
