import type { Metadata } from "next";

import { SettingsView } from "@/components/settings/settings-view";
import { requireAccess } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAccess("/dashboard/settings");

  return <SettingsView />;
}
