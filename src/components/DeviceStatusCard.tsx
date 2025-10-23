import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bluetooth, BatteryFull, BatteryMedium, BatteryLow } from "lucide-react";
import { bluetoothService } from "@/lib/bluetooth";

type Props = {
  useService?: boolean;

  // legacy props (used only when useService=false)
  isConnected?: boolean;
  deviceName?: string | null;
  batteryLevel?: number | null;

  // optional polling interval (ms) when useService=true; 0 disables
  pollIntervalMs?: number;
};

export default function DeviceStatusCard({
  useService = true,
  isConnected: isConnectedProp = false,
  deviceName: deviceNameProp,
  batteryLevel: batteryLevelProp,
  pollIntervalMs = 15000,
}: Props) {
  const [loading, setLoading] = useState(false);

  // live state (when useService=true)
  const [isConnected, setIsConnected] = useState(isConnectedProp);
  const [deviceLabel, setDeviceLabel] = useState<string | null | undefined>(deviceNameProp);
  const [batteryLevel, setBatteryLevel] = useState<number | null | undefined>(batteryLevelProp);

  const pollTimer = useRef<number | null>(null);

  const loadFromService = useCallback(async () => {
    setLoading(true);
    try {
      const connected = bluetoothService.isDeviceConnected();
      setIsConnected(connected);

      if (connected) {
        // Prefer human-readable label from Device Information service
        try {
          const info = await bluetoothService.getDeviceInfo();
          const label = [info.manufacturerName, info.modelNumber].filter(Boolean).join(" ").trim();
          setDeviceLabel(label || "Connected device");
        } catch {
          setDeviceLabel("Connected device");
        }

        // Real battery (0–100). No placeholders.
        try {
          const level = await bluetoothService.getBatteryLevel();
          const clamped = Number.isFinite(level) ? Math.max(0, Math.min(100, level)) : null;
          setBatteryLevel(clamped);
        } catch {
          setBatteryLevel(null);
        }
      } else {
        setDeviceLabel(null);
        setBatteryLevel(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // keep local state in sync with props when NOT using service
  useEffect(() => {
    if (!useService) {
      setIsConnected(isConnectedProp);
      setDeviceLabel(deviceNameProp);
      setBatteryLevel(batteryLevelProp);
    }
  }, [useService, isConnectedProp, deviceNameProp, batteryLevelProp]);

  // subscribe to connection changes (service mode)
  useEffect(() => {
    if (!useService || typeof bluetoothService.onConnectionChange !== "function") return;
    const unsubscribe = bluetoothService.onConnectionChange((connected) => {
      setIsConnected(connected);
      // refresh details on connect; clear on disconnect
      if (connected) {
        void loadFromService();
      } else {
        setDeviceLabel(null);
        setBatteryLevel(null);
      }
    });
    return () => {
      try { unsubscribe?.(); } catch { }
    };
  }, [useService, loadFromService]);

  // initial fetch + optional polling when using service
  useEffect(() => {
    if (!useService) return;

    void loadFromService();

    if (pollIntervalMs && pollIntervalMs > 0) {
      pollTimer.current = window.setInterval(() => void loadFromService(), pollIntervalMs);
    }
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    };
  }, [useService, loadFromService, pollIntervalMs]);

  const battery = useMemo(() => {
    const level =
      typeof batteryLevel === "number" && !Number.isNaN(batteryLevel)
        ? Math.max(0, Math.min(100, batteryLevel))
        : null;

    const state =
      !isConnected || level === null
        ? "unknown"
        : level > 60
          ? "good"
          : level > 30
            ? "moderate"
            : "low";

    const icon =
      state === "good" ? (
        <BatteryFull className="w-5 h-5 text-green-600" />
      ) : state === "moderate" ? (
        <BatteryMedium className="w-5 h-5 text-yellow-600" />
      ) : state === "low" ? (
        <BatteryLow className="w-5 h-5 text-red-600" />
      ) : (
        <BatteryMedium className="w-5 h-5 text-gray-400" />
      );

    const badgeClass =
      state === "good"
        ? "bg-green-500 text-white"
        : state === "moderate"
          ? "bg-yellow-500 text-white"
          : state === "low"
            ? "bg-red-500 text-white"
            : "bg-gray-200 text-gray-700";

    const label =
      state === "good" ? "Good" : state === "moderate" ? "Moderate" : state === "low" ? "Low" : "Unknown";

    return { level, state, icon, badgeClass, label };
  }, [batteryLevel, isConnected]);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bluetooth className={`w-5 h-5 ${isConnected ? "text-blue-600" : "text-gray-400"}`} />
            <CardTitle className="text-lg">Device Status</CardTitle>
          </div>

          <Badge
            variant={isConnected ? "default" : "secondary"}
            className={isConnected ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        <CardDescription>
          {isConnected ? (
            <>
              {deviceLabel ?? "Connected"}
              {battery.level !== null && <span className="ml-2 text-sm">• Battery: {battery.level}%</span>}
            </>
          ) : (
            "No device connected"
          )}
        </CardDescription>
      </CardHeader>

      {isConnected && (
        <CardContent className="pt-0">
          <div className="mt-2 p-3 rounded-lg border bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {battery.icon}
                <div className="font-medium">Battery</div>
              </div>
              <div className="text-sm text-gray-600">
                {battery.level !== null ? `${battery.level}%` : loading ? "Loading..." : "Unknown"}
              </div>
            </div>

            <div className="mt-2">
              <Progress value={battery.level ?? 0} className="h-2" />
            </div>

            <div className="mt-2">
              <Badge className={battery.badgeClass}>{battery.label}</Badge>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
