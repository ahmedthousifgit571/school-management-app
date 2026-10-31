"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

import { login, type LoginState } from "@/app/login/actions";
import { Field, Pill, TextInput, buttonClass } from "@/components/dashboard/controls";
import { UserAvatar } from "@/components/dashboard/user-avatar";
import type { DemoAccount } from "@/lib/demo-accounts";
import { cn } from "@/lib/utils";

const INITIAL_STATE: LoginState = { error: null };

export function LoginForm({ accounts, demoPassword }: { accounts: DemoAccount[]; demoPassword: string }) {
  const [state, action, pending] = useActionState(login, INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const [chosenEmail, setChosenEmail] = useState<string | null>(null);

  return (
    <div className="mt-5 space-y-4">
      {state.error && (
        <p role="alert" className="rounded-3xl bg-pastel-peach/50 px-4 py-3 text-sm font-medium">
          {state.error}
        </p>
      )}

      <form action={action} aria-label="Demo accounts">
        <input type="hidden" name="password" value={demoPassword} />
        <ul className="space-y-2">
          {accounts.map((account) => {
            const loading = pending && chosenEmail === account.email;
            return (
              <li key={account.role}>
                <button
                  type="submit"
                  name="email"
                  value={account.email}
                  disabled={pending}
                  onClick={() => setChosenEmail(account.email)}
                  aria-label={`Log in as ${account.label}, ${account.name}`}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-[24px] border-[1.5px] border-black/10 bg-white p-2.5 pr-4 text-left transition-colors duration-200 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-wait disabled:opacity-60"
                >
                  <UserAvatar name={account.name} tone={account.tone} size="lg" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-semibold">{account.name}</span>
                      <Pill tone={account.tone} className="py-0.5">{account.label}</Pill>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{account.summary}</span>
                  </span>
                  {loading ? (
                    <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden />
                  ) : (
                    <ArrowRight className="size-4 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </form>

      <details className="group rounded-[24px] border-[1.5px] border-black/10 bg-white px-4 py-3">
        <summary className="cursor-pointer rounded-full text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
          Or type an email and password
        </summary>
        <form action={action} className="mt-3 space-y-3">
          <Field label="Email" required hint={`Use ${accounts[1]!.email} or another role, such as teacher@school.test.`}>
            <TextInput name="email" type="email" autoComplete="username" required placeholder="principal@school.test" />
          </Field>
          <Field label="Password" required hint={`Use ${demoPassword}. The sample API accepts any password.`}>
            <span className="relative block">
              <TextInput
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.06] focus-visible:outline-2 focus-visible:outline-ink"
              >
                {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </span>
          </Field>
          <button
            type="submit"
            disabled={pending}
            onClick={() => setChosenEmail(null)}
            className={cn(buttonClass("dark"), "w-full")}
          >
            {pending && chosenEmail === null && <LoaderCircle className="animate-spin" aria-hidden />}
            {pending && chosenEmail === null ? "Logging in…" : "Log in"}
          </button>
        </form>
      </details>
    </div>
  );
}
