// src/hooks/useFirmwareStats.ts
import { useCallback, useState } from "react";
import bluetoothService, { ParsedStats } from "@/lib/bluetooth";
import { TIMEFRAMES, TimeframeKey, time7ToDate } from "@/utils/statsUtils";

export function useFirmwareStats() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const [entries, setEntries] = useState<{ t: Date; intensity: number }[]>([]);
  const [tfKey, setTfKey] = useState<TimeframeKey>("30d");

  const load = useCallback(async (key: TimeframeKey = tfKey) => {
    setLoading(true); setError(null);
    try {
      const tf = TIMEFRAMES.find(t => t.key === key)!;
      const PAGE = 63;

      // Probe to get total
      const probe = await bluetoothService.readStatistics(0, 1);
      const total = probe?.total ?? 0;

      const cutoff = (() => {
        if (tf.days === "all") return null;
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - (tf.days as number) + 1);
        return d;
      })();

      const collected: { t: Date; intensity: number }[] = [];

      // start at newest window and walk backwards
      let start = total > PAGE ? total - PAGE : 0;
      while (start >= 0) {
        const page: ParsedStats = await bluetoothService.readStatistics(start, PAGE);
        if (!page?.entries?.length) break;

        for (const e of page.entries) {
          const dt = time7ToDate(e.time7); if (!dt) continue;
          const intensity = (e.intensity2b ?? 0) & 0x03;
          if (!cutoff || dt >= cutoff) collected.push({ t: dt, intensity });
        }

        if (cutoff) {
          const oldest = page.entries[0];
          const oldestDt = oldest ? time7ToDate(oldest.time7) : null;
          if (oldestDt && oldestDt < cutoff) break;
        }

        start -= PAGE;
        if (start < 0) break;
      }

      setLifetimeTotal(total);
      setEntries(collected);
    } catch (e: any) {
      setError(e?.message || "Failed to load statistics");
      setLifetimeTotal(0);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [tfKey]);

  return {
    loading, error, lifetimeTotal, entries,
    tfKey, setTfKey, load,
  };
}
