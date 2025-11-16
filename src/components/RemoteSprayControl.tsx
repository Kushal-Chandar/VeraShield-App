import React, { useEffect, useState } from "react";
import { bluetoothService } from "@/lib/bluetooth";
import { useToast } from "@/hooks/use-toast";

type IntensityKey = "Low" | "Medium" | "High";

// Map UI choice to 2-bit intensity (firmware reads lower 2 bits)
// 1=Low, 2=Medium, 3=High
const INTENSITY_VALUE: Record<IntensityKey, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

export default function RemoteSprayControl() {
  const [connected, setConnected] = useState<boolean>(
    bluetoothService.isDeviceConnected()
  );
  const [intensity, setIntensity] = useState<IntensityKey>("Low");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const off = bluetoothService.onConnectionChange((c) => setConnected(c));
    return off;
  }, []);

  function handleIntensityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as IntensityKey;
    setIntensity(value);

    if (value === "High") {
      // Match SmartSchedulingPanel style
      toast({
        title: "⚠️ High intensity selected",
        description:
          "High intensity sprays can be harmful for the environment. Use only when really needed.",
        variant: "destructive",
      });
    }
  }

  async function handleSpray() {
    if (!connected) {
      setMsg("Please connect to a Machhar device first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await bluetoothService.remoteSpray(INTENSITY_VALUE[intensity]);
      setMsg(`Spray triggered: ${intensity}`);
    } catch (e: any) {
      setMsg(e?.message ?? "Failed to trigger spray");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4 rounded-2xl shadow border bg-white/70 dark:bg-neutral-900/60">
      <h2 className="text-xl font-semibold mb-3">Remote Spray</h2>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <label className="flex-1">
          <span className="block text-sm mb-1">Intensity</span>
          <select
            className="w-full rounded-lg border px-3 py-2 bg-white dark:bg-neutral-800"
            value={intensity}
            onChange={handleIntensityChange}
            disabled={!connected || busy}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </label>

        <button
          onClick={handleSpray}
          disabled={!connected || busy}
          className="rounded-xl px-4 py-2 font-medium shadow-sm border
                     disabled:opacity-50 disabled:cursor-not-allowed
                     bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {busy ? "Spraying..." : "Spray"}
        </button>
      </div>

      <div className="mt-3 text-sm">
        <span
          className={
            connected
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-amber-700 dark:text-amber-400"
          }
        >
          {connected ? "Device connected" : "No device connected"}
        </span>
      </div>

      {msg && (
        <div className="mt-2 text-sm text-sky-700 dark:text-sky-400">
          {msg}
        </div>
      )}
    </div>
  );
}
