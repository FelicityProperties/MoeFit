// Small date helpers. We key all daily data by local yyyy-mm-dd strings so the
// "day" matches the user's wall clock, not UTC.

export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function lastNDays(n: number, end: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(toDateKey(addDays(end, -i)));
  }
  return out;
}

export function weekdayShort(key: string): string {
  return fromDateKey(key).toLocaleDateString(undefined, { weekday: "short" });
}

export function prettyDate(d: Date = new Date()): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function prettyTime(d: Date = new Date()): string {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** 0 = Monday ... 6 = Sunday (useful for weekly workout plans). */
export function mondayIndex(d: Date = new Date()): number {
  return (d.getDay() + 6) % 7;
}

export function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function nowHour(): number {
  return new Date().getHours();
}

/** Saturday or Sunday. */
export function isWeekend(d: Date = new Date()): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}
