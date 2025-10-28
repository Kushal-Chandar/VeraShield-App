export type TimeframeKey = "7d" | "30d" | "90d" | "all";
export const TIMEFRAMES: { key: TimeframeKey; label: string; days: number | "all" }[] = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "all", label: "All time", days: "all" },
];

export function time7ToDate(time7: number[]): Date | null {
  if (!Array.isArray(time7) || time7.length !== 7) return null;
  const year = 2000 + (time7[0] & 0xff);
  const mon0 = time7[1] & 0xff;
  const mday = time7[2] & 0xff;
  const hour = time7[3] & 0xff;
  const min = time7[4] & 0xff;
  const sec = time7[5] & 0xff;
  if (mon0 > 11 || mday < 1 || mday > 31 || hour > 23 || min > 59 || sec > 60) return null;
  return new Date(year, mon0, mday, hour, min, sec);
}

export function formatSince(d: Date) {
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  const days = Math.floor(h / 24);
  return `${days} days ago`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function dayKeyLocal(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export type Metrics = {
  totalSprays: number;
  totalRuntime: string;
  averageDaily: number;
  peakHour: string;
  currentStreak: number;
  lastUsed: string;
  intensityMix: { low: number; medium: number; high: number };
};

export function computeMetrics(entries: { t: Date; intensity: number }[]): Metrics {
  if (entries.length === 0) {
    return {
      totalSprays: 0,
      totalRuntime: "—",
      averageDaily: 0,
      peakHour: "--:--",
      currentStreak: 0,
      lastUsed: "—",
      intensityMix: { low: 0, medium: 0, high: 0 },
    };
  }

  const sorted = [...entries].sort((a, b) => a.t.getTime() - b.t.getTime());
  const totalSprays = sorted.length;
  const first = sorted[0].t;
  const last = sorted[sorted.length - 1].t;

  const msPerDay = 86400000;
  const spanDays = Math.max(
    1,
    Math.round((startOfDay(last).getTime() - startOfDay(first).getTime()) / msPerDay) + 1
  );
  const averageDaily = +((totalSprays / spanDays).toFixed(1));

  const hourBins = new Array<number>(24).fill(0);
  for (const e of sorted) hourBins[e.t.getHours()]++;
  const peakIdx = hourBins.reduce((best, v, i, arr) => (v > arr[best] ? i : best), 0);
  const peakHour = `${pad2(peakIdx)}:00`;

  const daySet = new Set(sorted.map((e) => dayKeyLocal(e.t)));
  let streak = 0;
  let cursor = startOfDay(new Date());
  while (true) {
    const key = dayKeyLocal(cursor);
    if (daySet.has(key)) {
      streak++;
      cursor = new Date(cursor.getTime() - msPerDay);
    } else break;
  }

  const lastUsed = formatSince(last);

  // If you know per-intensity duration, adjust below:
  const SECONDS_PER_SPRAY = 2;
  const totalRuntimeSec = totalSprays * SECONDS_PER_SPRAY;
  const h = Math.floor(totalRuntimeSec / 3600);
  const m = Math.floor((totalRuntimeSec % 3600) / 60);
  const s = totalRuntimeSec % 60;
  const totalRuntime = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;

  let low = 0,
    med = 0,
    high = 0;
  for (const e of entries) {
    if (e.intensity === 1) low++;
    else if (e.intensity === 2) med++;
    else if (e.intensity === 3) high++;
  }

  return { totalSprays, totalRuntime, averageDaily, peakHour, currentStreak: streak, lastUsed, intensityMix: { low, medium: med, high } };
}
