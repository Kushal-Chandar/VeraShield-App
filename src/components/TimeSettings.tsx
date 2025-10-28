import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { timeValidation } from "@/utils/inputValidation";
import { bluetoothService } from "@/lib/bluetooth";

interface TimeSettingsProps {
  currentTime: string;                 // "HH:MM"
  onTimeChange: (time: string) => void;
}

const DISPLAY_TICK_MS = 1000;          // update the on-screen clock every second
const DEVICE_SYNC_TICK_MS = 60_000;    // push to device every 60s when auto-sync is ON

function applyTimeToDate(base: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(base);
  d.setSeconds(0, 0);
  if (Number.isFinite(h)) d.setHours(h);
  if (Number.isFinite(m)) d.setMinutes(m);
  return d;
}

const TimeSettings = ({ currentTime, onTimeChange }: TimeSettingsProps) => {
  const [manualTime, setManualTime] = useState(currentTime);
  const [isAutoSync, setIsAutoSync] = useState(true);
  const [isConnected, setIsConnected] = useState<boolean>(bluetoothService.isDeviceConnected());

  const displayTimerRef = useRef<number | null>(null);
  const deviceTimerRef = useRef<number | null>(null);

  // NEW: if user set time while disconnected, push once on next connect
  const pendingManualPushRef = useRef(false);

  const { toast } = useToast();

  // keep connection state fresh
  useEffect(() => {
    const unsubscribe = bluetoothService.onConnectionChange?.((c) => setIsConnected(c));
    setIsConnected(bluetoothService.isDeviceConnected());
    return () => { try { unsubscribe?.(); } catch { } };
  }, []);

  // keep local manual input synced if parent currentTime changes (and we're auto-syncing)
  useEffect(() => {
    if (isAutoSync) setManualTime(currentTime);
  }, [currentTime, isAutoSync]);

  // Tick: update on-screen clock each second (no BLE)
  useEffect(() => {
    if (!isAutoSync) return;
    displayTimerRef.current = window.setInterval(() => {
      const now = new Date().toLocaleTimeString("en-US", {
        hour12: false, hour: "2-digit", minute: "2-digit",
      });
      onTimeChange(now);       // parent display state
      setManualTime(now);      // keep input in sync
    }, DISPLAY_TICK_MS) as unknown as number;
    return () => {
      if (displayTimerRef.current) window.clearInterval(displayTimerRef.current);
      displayTimerRef.current = null;
    };
  }, [isAutoSync, onTimeChange]);

  // Push to device on an interval (when auto-sync is ON and connected)
  useEffect(() => {
    async function pushOnce() {
      if (!isConnected) return;
      try {
        await bluetoothService.syncTimeFromDate(new Date()); // exact current time
      } catch {
        // silent; we retry on the next tick
      }
    }

    if (isAutoSync) {
      void pushOnce(); // push immediately once when toggled ON / on connect
      deviceTimerRef.current = window.setInterval(() => { void pushOnce(); }, DEVICE_SYNC_TICK_MS) as unknown as number;
      return () => {
        if (deviceTimerRef.current) window.clearInterval(deviceTimerRef.current);
        deviceTimerRef.current = null;
      };
    }

    if (deviceTimerRef.current) window.clearInterval(deviceTimerRef.current);
    deviceTimerRef.current = null;
  }, [isAutoSync, isConnected]);

  // NEW: if in manual mode and a manual push was queued while offline, push once on connect
  useEffect(() => {
    async function pushIfPending() {
      if (!isAutoSync && isConnected && pendingManualPushRef.current) {
        try {
          const sanitized = timeValidation.sanitizeTimeInput(manualTime);
          if (timeValidation.isValidTimeFormat(sanitized) && timeValidation.isReasonableTime(sanitized)) {
            const target = applyTimeToDate(new Date(), sanitized);
            await bluetoothService.syncTimeFromDate(target);
            toast({ title: "Time Synced", description: `Device time set to ${sanitized}` });
          }
        } catch (e: any) {
          toast({ title: "Sync Failed", description: e?.message || "Could not write time to device", variant: "destructive" });
        } finally {
          pendingManualPushRef.current = false;
        }
      }
    }
    void pushIfPending();
  }, [isConnected, isAutoSync, manualTime, toast]);

  const handleManualTimeSet = async () => {
    const sanitizedTime = timeValidation.sanitizeTimeInput(manualTime);

    if (!timeValidation.isValidTimeFormat(sanitizedTime) || !timeValidation.isReasonableTime(sanitizedTime)) {
      toast({ title: "Invalid Time", description: "Please enter a valid time in HH:MM format", variant: "destructive" });
      return;
    }

    onTimeChange(sanitizedTime);
    setManualTime(sanitizedTime);
    setIsAutoSync(false); // manual mode

    if (!isConnected) {
      pendingManualPushRef.current = true; // queue a one-shot sync on next connection
      toast({ title: "Time Updated Locally", description: "Will sync to device when connected" });
      return;
    }

    try {
      const target = applyTimeToDate(new Date(), sanitizedTime);
      await bluetoothService.syncTimeFromDate(target);
      toast({ title: "Time Synced", description: `Device time set to ${sanitizedTime}` });
    } catch (e: any) {
      toast({ title: "Sync Failed", description: e?.message || "Could not write time to device", variant: "destructive" });
    }
  };

  const handleAutoSync = async () => {
    setIsAutoSync(true);

    const nowStr = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
    onTimeChange(nowStr);
    setManualTime(nowStr);

    if (isConnected) {
      try {
        await bluetoothService.syncTimeFromDate(new Date());
        toast({ title: "Auto Sync Enabled", description: "Clock will auto-sync to device periodically" });
      } catch (e: any) {
        toast({ title: "Auto Sync Enabled (device not updated)", description: e?.message || "Will retry periodically" });
      }
    } else {
      toast({ title: "Auto Sync Enabled", description: "Will sync automatically when the device connects" });
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Time Settings
        </CardTitle>
        <CardDescription>
          {isConnected ? "Syncs with your connected device" : "Set the time; it will sync when you connect"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Time Display */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border">
          <div className="text-center">
            <p className="text-sm text-blue-700 mb-1">Current {isConnected ? "Device" : "Local"} Time</p>
            <p className="text-2xl font-bold text-blue-800">{currentTime}</p>
            <p className="text-xs text-blue-600 mt-1">
              {isAutoSync ? (isConnected ? "Auto-synced to device" : "Auto-synced locally (device offline)") : "Manual"}
            </p>
          </div>
        </div>

        {/* Manual Time Setting */}
        <div className="space-y-3">
          <Label htmlFor="manual-time" className="text-sm font-medium">Set Time Manually:</Label>
          <div className="flex gap-2">
            <Input
              id="manual-time"
              type="time"
              value={manualTime}
              onChange={(e) => setManualTime(timeValidation.sanitizeTimeInput(e.target.value))}
              className="flex-1"
              disabled={isAutoSync}
              pattern="[0-9]{2}:[0-9]{2}"
              maxLength={5}
            />
            <Button
              onClick={handleManualTimeSet}
              size="sm"
              disabled={isAutoSync}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              Set
            </Button>
          </div>
        </div>

        {/* Auto Sync Toggle Button */}
        <Button
          onClick={isAutoSync ? () => setIsAutoSync(false) : handleAutoSync}
          variant={isAutoSync ? "secondary" : "outline"}
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {isAutoSync ? "Disable Auto Sync" : "Enable Auto Sync"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TimeSettings;
