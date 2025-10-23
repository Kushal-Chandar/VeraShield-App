import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BluetoothIcon, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bluetoothService } from "@/lib/bluetooth";

interface BluetoothPairingProps {
  onConnect: (deviceName: string) => void;
}

type ScanDevice = { id: string; name: string; rssi?: number };

const BluetoothPairing = ({ onConnect }: BluetoothPairingProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<ScanDevice[]>([]);
  const { toast } = useToast();

  const scanForDevices = async () => {
    setIsScanning(true);
    setAvailableDevices([]);

    try {
      // best-effort initialize + permissions
      await bluetoothService.initialize?.();
      await bluetoothService.requestPermissions?.();

      const devices = await bluetoothService.scanForDevices();

      const filtered: ScanDevice[] = [];
      for (const d of devices) {
        try {
          // if (await bluetoothService.isMachharDevice(d.id)) {
          filtered.push({
            id: d.id,
            name: (d.name && d.name.trim()) || "Unknown",
            rssi: d.rssi,
          });
          // }
        } catch { }
      }
      setAvailableDevices(filtered);

      toast({
        title: "Scan complete",
        description: `Found ${filtered.length} device${filtered.length === 1 ? "" : "s"}`,
      });
    } catch (error: any) {
      toast({
        title: "Scan failed",
        description: error?.message || "Unable to scan for Bluetooth devices",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: ScanDevice) => {
    setConnectingId(device.id);
    try {
      // your service expects { id, name? }
      await bluetoothService.connect({ id: device.id, name: device.name });
      onConnect(device.name);
      toast({
        title: "Connected",
        description: `Connected to ${device.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error?.message || `Unable to connect to ${device.name}`,
        variant: "destructive",
      });
    } finally {
      setConnectingId(null);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BluetoothIcon className="w-5 h-5 text-blue-600" />
          Pair Device
        </CardTitle>
        <CardDescription>Connect your mosquito repellent device via Bluetooth</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          onClick={scanForDevices}
          disabled={isScanning}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Scan for Devices
            </>
          )}
        </Button>

        {availableDevices.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Available Devices</h4>
            {availableDevices.map((device) => {
              const isThisConnecting = connectingId === device.id;
              return (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <div className="flex flex-col">
                      <span className="font-medium">{device.name || "Unknown"}</span>
                      <span className="text-xs text-gray-500">
                        {device.id}
                        {typeof device.rssi === "number" ? ` • RSSI ${device.rssi} dBm` : ""}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={isThisConnecting}
                    onClick={() => connectToDevice(device)}
                    className="bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600"
                  >
                    {isThisConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting…
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {!isScanning && availableDevices.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <BluetoothIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No devices found. Make sure your device is in pairing mode and nearby.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BluetoothPairing;
