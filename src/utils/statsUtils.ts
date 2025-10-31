// src/utils/statsUtils.ts

/** Timeframe keys used across stats UI and hooks. */
export type TimeframeKey = "7d" | "30d" | "all";

export const TIMEFRAMES: { key: TimeframeKey; label: string; days: number | "all" }[] = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "all", label: "ALL", days: "all" },
];

/**
 * Convert a firmware “time7” value to a Date.
 * Supports:
 *  - Date object (pass-through)
 *  - ISO string
 *  - structured object { y, m, d, hh, mm, ss }
 * Extend here if your firmware uses a different shape.
 */
export function time7ToDate(t7: any): Date | null {
  // Accept Uint8Array(7), number[], or pass-through Date/string
  if (t7 instanceof Date) return t7;
  if (typeof t7 === "string") {
    const d = new Date(t7);
    return Number.isNaN(+d) ? null : d;
  }

  const a: number[] =
    t7 instanceof Uint8Array ? Array.from(t7) :
      Array.isArray(t7) ? t7 as number[] :
        null as any;

  if (!a || a.length !== 7) return null;

  const sec = a[0] & 0xff;
  const min = a[1] & 0xff;
  const hour = a[2] & 0xff;
  const mday = a[3] & 0xff;
  /* const wday = a[4] & 0xff; // not needed for Date */
  const mon = a[5] & 0xff;          // already 0..11 (same as JS)
  const year = 1900 + (a[6] & 0xff); // tm_year = years since 1900

  // Basic sanity (kept loose to avoid dropping real data)
  if (mon > 11 || mday < 1 || mday > 31 || hour > 23 || min > 59 || sec > 59) {
    return null;
  }

  const d = new Date(year, mon, mday, hour, min, sec, 0);
  return Number.isNaN(+d) ? null : d;
}

/**
 * Derive per-entry duration in seconds.
 * Priority:
 *  1) duration_ms | dur_ms | spray_ms from firmware
 *  2) fallback estimate from intensity (Low=1, Med=2, High=3):
 *     5 cycles × {7s, 9s, 12s} = {35, 45, 60}s
 */
export function entryDurationSec(e: any): number {
  if (typeof e?.duration_ms === "number") return Math.round(e.duration_ms / 1000);
  if (typeof e?.dur_ms === "number") return Math.round(e.dur_ms / 1000);
  if (typeof e?.spray_ms === "number") return Math.round(e.spray_ms / 1000);

  const i = ((e?.intensity ?? e?.intensity2b ?? 0) & 0x03) as number;
  return i === 3 ? 60 : i === 2 ? 45 : 35;
}

/** Common cutoff calculator: start-of-day inclusive window. */
export function cutoffDateForDays(days: number | "all"): Date | null {
  if (days === "all") return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days + 1);
  return d;
}
