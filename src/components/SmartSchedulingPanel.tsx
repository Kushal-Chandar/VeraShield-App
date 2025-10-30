// src/components/SmartSchedulingPanel.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Plus, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bluetoothService as BluetoothService } from "@/lib/bluetooth";

type IntensityKey = "Low" | "Medium" | "High";
const INT_TO_CODE: Record<IntensityKey, 1 | 2 | 3> = { Low: 1, Medium: 2, High: 3 };
const CODE_TO_INT: Record<number, IntensityKey> = { 1: "Low", 2: "Medium", 3: "High" };

type Row = { id: string; time: string; intensity: IntensityKey };
const MAX_ROWS = 5;

/* ---------- Helpers ---------- */
function pad2(n: number) { return String(n).padStart(2, "0"); }
function uuid() { return Math.random().toString(36).slice(2, 10); }

function toNextOccurrence(hhmm: string): Date {
  const [hh, mm] = (hhmm || "20:00").split(":").map((v) => parseInt(v, 10));
  const now = new Date();
  const d = new Date(now);
  d.setSeconds(0, 0);
  d.setHours(Number.isFinite(hh) ? hh : 20);
  d.setMinutes(Number.isFinite(mm) ? mm : 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

const MONTH_IS_ZERO_BASED = true; // set to false if FW wants 1..12

function dateToTime7(d: Date): number[] {
  const year7 = Math.max(0, Math.min(255, d.getFullYear() - 1900));
  const mon = d.getMonth(); // 0..11
  const monProto = MONTH_IS_ZERO_BASED ? mon : mon + 1;

  // FW order: [sec, min, hour, mday, wday, month, year]
  return [d.getSeconds(), d.getMinutes(), d.getHours(), d.getDate(), d.getDay(), monProto, year7];
}


/** Snap "HH:MM" to the nearest lower 15-minute mark (00,15,30,45). */
function snapTo15(hhmm: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return "20:00";
  let h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  let min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  const snapped = Math.floor(min / 15) * 15;
  return `${pad2(h)}:${pad2(snapped)}`;
}

/** True if "HH:MM" sits on a 15-minute grid. */
function isOn15(hhmm: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return false;
  const mm = parseInt(m[2], 10);
  return mm % 15 === 0;
}

/** Returns a user-friendly list like "20:00 (Medium), 20:15 (Low)" */
function listSummary(rows: Row[]) {
  return rows.map(r => `${r.time} (${r.intensity})`).join(", ");
}

/* ---------- Component ---------- */
export default function SmartSchedulingPanel(props: { defaultTime?: string }) {
  const defaultHHMM = snapTo15(props.defaultTime ?? "20:00");
  const { toast } = useToast();

  const [isConnected, setIsConnected] = useState<boolean>(BluetoothService.isDeviceConnected());
  const [busy, setBusy] = useState(false);
  const [loadingFromDevice, setLoadingFromDevice] = useState(false);

  const [rows, setRows] = useState<Row[]>([{ id: uuid(), time: defaultHHMM, intensity: "Medium" }]);
  const [summary, setSummary] = useState<string>("");

  // Validation state
  const [dupTimes, setDupTimes] = useState<string[]>([]);
  const [offGridTimes, setOffGridTimes] = useState<string[]>([]);

  // Track user edits to avoid overwriting with auto-refresh after reconnects
  const [dirty, setDirty] = useState(false);
  const AUTO_OVERWRITE_ON_CONNECT = false; // set true if you want to always overwrite on connect

  // simple mounted guard to prevent double toasts
  const mountedRef = useRef(false);

  // Keep BLE connection state fresh; on connect, pull schedule
  useEffect(() => {
    const off = BluetoothService.onConnectionChange?.((c) => {
      setIsConnected(c);
      if (c) {
        // Only auto-refresh if user hasn't edited or if we allow overwrite
        if (AUTO_OVERWRITE_ON_CONNECT || !dirty) {
          void refreshFromDevice();
        }
      } else {
        setSummary("Device offline");
      }
    });
    // initial status
    setIsConnected(BluetoothService.isDeviceConnected());

    return () => { try { off?.(); } catch { } };
  }, [dirty]);

  // Initial load (in case already connected when component mounts)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (BluetoothService.isDeviceConnected()) {
        void refreshFromDevice();
      } else {
        setSummary("Device offline");
      }
    }
  }, []);

  // Validate on every rows change
  useEffect(() => {
    const times = rows.map(r => r.time);
    // duplicates
    const dupSet = new Set<string>();
    const seen = new Set<string>();
    times.forEach(t => {
      if (seen.has(t)) dupSet.add(t);
      else seen.add(t);
    });
    setDupTimes(Array.from(dupSet));

    // off-grid (not multiple of 15)
    setOffGridTimes(rows.filter(r => !isOn15(r.time)).map(r => r.time));
  }, [rows]);

  const canSave = useMemo(() => {
    if (!rows.length) return false;
    const formatOK = rows.every(r => /^\d{2}:\d{2}$/.test(r.time));
    return formatOK && dupTimes.length === 0 && offGridTimes.length === 0;
  }, [rows, dupTimes, offGridTimes]);

  async function refreshFromDevice() {
    if (!BluetoothService.isDeviceConnected()) {
      setSummary("Device offline");
      return;
    }
    setLoadingFromDevice(true);
    try {
      const sch = await BluetoothService.readSchedule();
      if (!sch?.count || !sch.entries?.length) {
        setSummary("No schedule entries on device");
        // Reset to single default row if nothing on device (optional)
        // setRows([{ id: uuid(), time: defaultHHMM, intensity: "Medium" }]);
        return;
      }

      const take: Row[] = sch.entries.slice(0, MAX_ROWS).map((e) => {
        // time7 (FW): [sec, min, hour, mday, wday, month, year]
        const hh = e.time7[2] ?? 20;
        const mm = e.time7[1] ?? 0;
        const t = snapTo15(`${pad2(hh)}:${pad2(mm)}`);
        const k: IntensityKey = CODE_TO_INT[e.intensity2b] ?? "Medium";
        return { id: uuid(), time: t, intensity: k };
      });

      setRows(take);
      setDirty(false);
      setSummary(`#${sch.count} on device; showing ${take.length}: ${listSummary(take)}`);

      // Friendly feedback (won’t spam on mount)
      toast({ title: "Schedule loaded", description: `Loaded ${take.length} entr${take.length > 1 ? "ies" : "y"} from device.` });
    } catch (err: any) {
      const msg = String(err?.message ?? "Could not read schedule");
      setSummary("Could not read schedule");
      toast({ title: "Read failed", description: msg, variant: "destructive" });
    } finally {
      setLoadingFromDevice(false);
    }
  }

  function addRow() {
    setDirty(true);
    if (rows.length >= MAX_ROWS) return;
    setRows(prev => {
      // choose a default that avoids duplicates if possible
      const candidatePool = [
        "18:00", "18:15", "18:30", "18:45",
        "19:00", "19:15", "19:30", "19:45",
        "20:00", "20:15", "20:30", "20:45",
        "21:00", "21:15", "21:30", "21:45",
      ];
      const used = new Set(prev.map(r => r.time));
      const pick = candidatePool.find(t => !used.has(t)) ?? defaultHHMM;
      return [...prev, { id: uuid(), time: pick, intensity: "Medium" }];
    });
  }

  function removeRow(id: string) {
    setDirty(true);
    setRows(prev => prev.filter(r => r.id !== id));
  }

  function setRow(id: string, patch: Partial<Row>) {
    setDirty(true);
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function handleSave() {
    if (!isConnected) {
      toast({ title: "Device not connected", description: "Connect to save schedule", variant: "destructive" });
      return;
    }
    if (!canSave) {
      const problems: string[] = [];
      if (offGridTimes.length) problems.push("Only 15-minute intervals are allowed (…:00, :15, :30, :45).");
      if (dupTimes.length) problems.push("Duplicate times are not allowed.");
      toast({ title: "Invalid schedule", description: problems.join(" "), variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      const entries = rows.map(r => {
        const when = toNextOccurrence(r.time);
        return { time7: dateToTime7(when), intensity2b: INT_TO_CODE[r.intensity] };
      });

      await BluetoothService.writeSchedule(entries);

      toast({ title: "Schedule saved", description: `Saved ${rows.length} entr${rows.length > 1 ? "ies" : "y"}: ${listSummary(rows)}` });
      setSummary(`${rows.length} saved: ${listSummary(rows)}`);
      setDirty(false);

      // After a successful write, read back to reflect FW’s canonical ordering/validation (optional but nice)
      await refreshFromDevice();
    } catch (e: any) {
      const msg = String(e?.message ?? "Could not write schedule to device");
      toast({ title: "Failed to save", description: msg, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Smart Scheduling
            </CardTitle>
            <CardDescription>
              {isConnected
                ? (loadingFromDevice ? "Reading device schedule…" : (summary || "Ready"))
                : "Set times and save when connected"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshFromDevice()}
              disabled={!isConnected || loadingFromDevice}
              title="Refresh from Device"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingFromDevice ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Rows */}
        <div className="space-y-3">
          {rows.map((r, idx) => {
            const isDup = dupTimes.includes(r.time);
            const isOffGrid = !isOn15(r.time);
            return (
              <div key={r.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor={`time-${r.id}`}>Time #{idx + 1}</Label>
                  <Input
                    id={`time-${r.id}`}
                    type="time"
                    step={900} /* 15 minutes */
                    value={r.time}
                    onChange={(e) => setRow(r.id, { time: e.target.value })}
                    onBlur={(e) => setRow(r.id, { time: snapTo15(e.target.value) })}
                    className={`w-full ${isDup || isOffGrid ? "border-red-500" : ""}`}
                    pattern="[0-9]{2}:[0-9]{2}"
                    maxLength={5}
                  />
                  {(isDup || isOffGrid) && (
                    <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>
                        {isOffGrid ? "Must be on a 15-minute interval. " : null}
                        {isDup ? "Duplicate time not allowed." : null}
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-40">
                  <Label htmlFor={`int-${r.id}`}>Intensity</Label>
                  <select
                    id={`int-${r.id}`}
                    className="w-full rounded-md border px-3 py-2 bg-white"
                    value={r.intensity}
                    onChange={(e) => setRow(r.id, { intensity: e.target.value as IntensityKey })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="mt-6"
                  onClick={() => removeRow(r.id)}
                  disabled={rows.length === 1}
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={addRow}
            disabled={rows.length >= MAX_ROWS}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Time
          </Button>

          <Button
            onClick={handleSave}
            disabled={!canSave || busy || !isConnected}
            className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
          >
            {busy ? "Saving…" : "Save to Device"}
          </Button>
        </div>

        <p className="text-xs text-gray-600">
          • Up to 5 entries • Only 15-minute steps (:00, :15, :30, :45) • No duplicate times
          {dirty ? " • You have unsaved edits" : ""}
        </p>
      </CardContent>
    </Card>
  );
}
