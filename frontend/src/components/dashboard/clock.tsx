"use client";

import { useSyncExternalStore } from "react";

// Time-of-day values must only be read in the browser: the pages are
// prerendered, so a server-side `new Date()` would be frozen at build time.
const noopSubscribe = () => () => {};

function currentGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function currentDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function Greeting({ name }: { name: string }) {
  const greeting = useSyncExternalStore(noopSubscribe, currentGreeting, () => "Welcome back");
  return (
    <>
      {greeting}, {name}
    </>
  );
}

export function TodayLabel({ fallback = "Today" }: { fallback?: string }) {
  return <>{useSyncExternalStore(noopSubscribe, currentDate, () => fallback)}</>;
}
