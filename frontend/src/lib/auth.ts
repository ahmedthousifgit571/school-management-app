import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { accountForRole } from "@/lib/demo-accounts";
import { ALL_ROLES, navItems, type Role } from "@/lib/navigation";
import type { SessionUser } from "@/lib/session";

export const SESSION_COOKIE = "session";

function roleFromToken(token: string): Role | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString());
    return ALL_ROLES.includes(payload.role) ? payload.role : null;
  } catch {
    return null;
  }
}

/**
 * The signed-in user, from the JWT that /login stored in the session cookie.
 * With no cookie this falls back to the principal, so the dashboard opens straight
 * away while auth is still a mock. The token is only decoded here, not verified:
 * the API must verify it once there are real endpoints behind it.
 */
export async function getCurrentUser(): Promise<SessionUser> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const role = token ? roleFromToken(token) : null;
  return accountForRole(role ?? "ADMIN");
}

/** The signed-in user, or back to the dashboard if their role can't open this section. */
export async function requireAccess(href: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  const allowed = navItems.find((item) => item.href === href)?.roles.includes(user.role);
  if (!allowed) redirect("/dashboard");
  return user;
}
