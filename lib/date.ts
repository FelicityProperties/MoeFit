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

/** "Today", "Yesterday", "Mon, May 19", or full date for older days. */
export function prettyDayLabel(key: string): string {
  const today = toDateKey();
  if (key === today) return "Today";
  const d = fromDateKey(key);
  const yest = toDateKey(addDays(new Date(), -1));
  if (key === yest) return "Yesterday";
  const diffDays = Math.round(
    (new Date().setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / 86400000
  );
  if (diffDays > 0 && diffDays <= 7) {
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
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

// --- Schedule clock helpers (hour + optional minute) ---

export function minutesOfDay(hour: number, minute = 0): number {
  return hour * 60 + minute;
}

/** "8am", "8:30am", "1:15pm" */
export function formatClock(hour: number, minute = 0): string {
  const ampm = hour < 12 ? "am" : "pm";
  const hr = hour % 12 === 0 ? 12 : hour % 12;
  const mm = minute > 0 ? `:${String(minute).padStart(2, "0")}` : "";
  return `${hr}${mm}${ampm}`;
}

/** "08:30" for <input type="time"> */
export function toTimeValue(hour: number, minute = 0): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parseTimeValue(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(":").map((n) => Number(n));
  return {
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 0,
    minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}
