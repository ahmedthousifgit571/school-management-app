"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE } from "@/lib/auth";
import { accountForEmail } from "@/lib/demo-accounts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const ONE_DAY = 60 * 60 * 24;

export type LoginState = { error: string | null };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password to continue." };
  }

  const account = accountForEmail(email);
  if (!account) {
    return { error: `${email} isn't a demo account. Pick one of the accounts above.` };
  }

  let token: string;
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: account.role }),
    });
    const data = await response.json();
    if (!response.ok) return { error: data.message ?? "That login didn't work. Try again." };
    token = data.token;
  } catch {
    return { error: `Can't reach the API at ${API_URL}. Start it with "npm run dev" from the repo root.` };
  }

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_DAY,
  });
  redirect("/dashboard");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
