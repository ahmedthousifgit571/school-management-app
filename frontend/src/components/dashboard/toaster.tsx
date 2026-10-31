"use client";

import { CheckCircle2 } from "lucide-react";

import { useToasts } from "@/lib/stores";

export function Toaster() {
  const toasts = useToasts();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4 print:hidden"
    >
      {toasts.map((item) => (
        <p
          key={item.id}
          className="inline-flex max-w-md items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
        >
          <CheckCircle2 className="size-4 shrink-0 text-pastel-green" aria-hidden />
          {item.message}
        </p>
      ))}
    </div>
  );
}
