"use client";

import { useSyncExternalStore } from "react";

type Updater<T> = T | ((previous: T) => T);

/**
 * A small client-side store. Modules read and write the same value, so an event added
 * on the dashboard shows up on the calendar, and edits survive moving between pages.
 * Values live in memory only: a full reload returns to the sample data.
 */
export function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const set = (next: Updater<T>) => {
    value = typeof next === "function" ? (next as (previous: T) => T)(value) : next;
    listeners.forEach((listener) => listener());
  };

  const useStore = () =>
    useSyncExternalStore(
      subscribe,
      () => value,
      () => initial
    );

  return { useStore, set, get: () => value };
}
