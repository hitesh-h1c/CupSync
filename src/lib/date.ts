/**
 * Calendar-date helpers. All "calendar days" in Cup Sync are represented as
 * `YYYY-MM-DD` strings in **IST** (Asia/Kolkata) so day boundaries, billing
 * months, and the 22:00 IST email all agree regardless of server timezone.
 *
 * Rate `effectiveFrom` and delivery dates are stored as UTC-midnight Dates of
 * their calendar day, so comparisons line up with the date-key strings.
 */
const IST_TZ = "Asia/Kolkata";

const keyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today (or a given instant) as an IST `YYYY-MM-DD` string. */
export function istDateKey(d: Date = new Date()): string {
  return keyFormatter.format(d);
}

/** Current IST month as `YYYY-MM`. */
export function currentISTMonth(): string {
  return istDateKey().slice(0, 7);
}

/** The month (`YYYY-MM`) part of a date key. */
export function monthOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** UTC-midnight Date for a calendar day — used for storage + comparisons. */
export function dateKeyToUTCDate(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

/** Human display, e.g. "14 Jun 2026". */
export function formatDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateKeyToUTCDate(dateKey));
}

/** Weekday for a date key, e.g. "Mon". */
export function weekdayOf(dateKey: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    timeZone: "UTC",
  }).format(dateKeyToUTCDate(dateKey));
}

/** Human month display, e.g. "June 2026". */
export function formatMonth(monthKey: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${monthKey}-01T00:00:00.000Z`));
}

/** Validate a `YYYY-MM` string. */
export function isValidMonthKey(s: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

/** Validate a `YYYY-MM-DD` string. */
export function isValidDateKey(s: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s);
}

/** Shift a `YYYY-MM` month key by a number of months. */
export function shiftMonth(monthKey: string, delta: number): string {
  const d = new Date(`${monthKey}-01T00:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}

/** [startUTC, endUTC) bounds for a month key, for Date-range queries. */
export function monthRangeUTC(monthKey: string): { start: Date; end: Date } {
  const start = new Date(`${monthKey}-01T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}
