// Fixed locale so server-rendered and hydrated output always match.
const LOCALE = "en-IN";

/** Parses a YYYY-MM-DD string as a local date (never shifted by the timezone). */
export function parseISO(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

export function toISO(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return parseISO(iso).toLocaleDateString(LOCALE, options ?? { day: "numeric", month: "short" });
}

export function formatMonth(date: Date): string {
  return date.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
}

/** "08:30" → "8:30 AM" */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours! >= 12 ? "PM" : "AM";
  return `${hours! % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString(LOCALE);
}

export function daysBetween(fromISO: string, toIso: string): number {
  return Math.round((parseISO(toIso).getTime() - parseISO(fromISO).getTime()) / 86400000);
}

export function addDays(iso: string, days: number): string {
  const date = parseISO(iso);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

/** A single value from searchParams, ignoring repeated keys. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** Saves rows as a CSV file in the browser. */
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const body = rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
  downloadFile(filename, body, "text/csv;charset=utf-8");
}

export function downloadFile(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
