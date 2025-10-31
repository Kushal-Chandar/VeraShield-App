// src/hooks/useFirmwareStats.tsx
import { useCallback, useState } from "react";
import { bluetoothService } from "@/lib/bluetooth";
import {
  TIMEFRAMES,
  TimeframeKey,
  time7ToDate,
  entryDurationSec,
  cutoffDateForDays,
} from "@/utils/statsUtils";

type UiEntry = Record<string, any> & { t: Date; intensity: number; durationSec?: number };

export function useFirmwareStats() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<UiEntry[]>([]);
  const [tfKey, setTfKey] = useState<TimeframeKey>("all");

  const load = useCallback(async (key: TimeframeKey = tfKey) => {
    setLoading(true);
    setError(null);
    try {
      const cutoff = cutoffDateForDays(TIMEFRAMES.find(t => t.key === key)!.days);
      const collected: UiEntry[] = [];

      // Ask FW for "as much as possible" per read by passing window=0 (it will cap by MTU).
      // First slice from start=0 gives us both 'total' and the first batch of entries.
      let start = 0;
      let total = 0;

      // ---- First slice
      {
        const slice = await bluetoothService.readStatistics(start, 0);
        total = slice.total ?? 0;

        const got = slice.window ?? (slice.entries?.length ?? 0);
        for (let i = 0; i < got; i++) {
          const raw = slice.entries[i];
          const dt = time7ToDate(raw.time7);
          if (!dt) continue;

          const intensity = (raw.intensity2b ?? 0) & 0x03;
          const durationSec = entryDurationSec({ ...raw, intensity2b: intensity });

          if (!cutoff || dt >= cutoff) {
            collected.push({ ...raw, t: dt, intensity, durationSec });
          }
        }
        start += got;
      }

      // ---- Remaining slices
      while (start < total) {
        const slice = await bluetoothService.readStatistics(start, 0); // 0 => FW decides effective window per MTU
        const got = slice.window ?? (slice.entries?.length ?? 0);
        if (got <= 0) break;

        for (let i = 0; i < got; i++) {
          const raw = slice.entries[i];
          const dt = time7ToDate(raw.time7);
          if (!dt) continue;

          const intensity = (raw.intensity2b ?? 0) & 0x03;
          const durationSec = entryDurationSec({ ...raw, intensity2b: intensity });

          if (!cutoff || dt >= cutoff) {
            collected.push({ ...raw, t: dt, intensity, durationSec });
          }
        }

        start += got; // step by what we actually received
      }

      setEntries(collected);
    } catch (e: any) {
      setError(e?.message || "Failed to load statistics");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [tfKey]);

  return { loading, error, entries, tfKey, setTfKey, load };
}
