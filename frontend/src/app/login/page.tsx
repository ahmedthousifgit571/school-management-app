import type { Metadata } from "next";

import { Burst, Heart, PlusBlob, Star } from "@/components/dashboard/doodles";
import { LoginForm } from "@/app/login/login-form";
import { Wordmark } from "@/components/wordmark";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo-accounts";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-svh flex-1 gap-3 bg-canvas p-3 lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden rounded-[32px] bg-ink p-10 text-white lg:flex">
        <Wordmark className="text-5xl" />
        <Star className="absolute right-16 top-16 size-14 rotate-12 text-pastel-yellow motion-safe:animate-float" />
        <Heart className="absolute right-44 top-40 size-10 -rotate-12 text-pastel-pink motion-safe:animate-float" />
        <Burst className="absolute -bottom-10 right-10 size-52 text-pastel-blue" />
        <PlusBlob className="absolute left-24 top-56 size-20 text-pastel-green" outlined={false} />
        <div className="relative max-w-md">
          <h1 className="font-heading text-5xl font-medium leading-tight tracking-tight">
            One cheerful place to run the whole school.
          </h1>
          <p className="mt-4 text-white/75">
            Timetables, attendance, grades, fees, buses and every message in between.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Wordmark className="text-4xl lg:hidden" />
          <h2 className="mt-4 font-heading text-4xl font-medium tracking-tight lg:mt-0">Pick a role to explore</h2>
          <p className="mt-1 text-muted-foreground">These are demo accounts. One click signs you in.</p>
          <LoginForm accounts={DEMO_ACCOUNTS} demoPassword={DEMO_PASSWORD} />
        </div>
      </section>
    </main>
  );
}
