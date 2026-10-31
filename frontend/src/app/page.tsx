import { redirect } from "next/navigation";

// No public landing page yet — send visitors to the dashboard.
// Point this at /login once auth is wired up.
export default function Home() {
  redirect("/dashboard");
}
