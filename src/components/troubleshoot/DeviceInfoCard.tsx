import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Wifi, AlertTriangle } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";
import bluetoothService, { DeviceInfo } from "@/lib/bluetooth";

export default function DeviceInfoCard({ isConnected }: { isConnected: boolean }) {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!isConnected) { setInfo(null); return; }
    setLoading(true); setError(null);
    try { setInfo(await bluetoothService.getDeviceInfo()); }
    catch (e: any) { setError(e?.message ?? "Failed to load device info"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [isConnected]);

  const connectionLabel = isConnected ? (info?.modelNumber ? `Connected to ${info.modelNumber}` : "Connected") : "Disconnected";

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Device Information
            {loading && <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <CardDescription>
          {isConnected ? "Live data from connected device" : "Connect device to view live information"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <div className="text-center py-8 text-gray-500">
            <Wifi className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Connect to your Machhar device to view detailed information</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div><span className="font-medium text-gray-700">Model:</span><p className="text-gray-600">{info?.modelNumber || "—"}</p></div>
            <div><span className="font-medium text-gray-700">Manufacturer:</span><p className="text-gray-600">{info?.manufacturerName || "—"}</p></div>
            <div><span className="font-medium text-gray-700">Serial Number:</span><p className="text-gray-600">{info?.serialNumber || "—"}</p></div>
            <div><span className="font-medium text-gray-700">Firmware Version:</span><p className="text-gray-600">{info?.firmwareRevision || "—"}</p></div>
            <div><span className="font-medium text-gray-700">Hardware Revision:</span><p className="text-gray-600">{info?.hardwareRevision || "—"}</p></div>
            <div><span className="font-medium text-gray-700">Software Revision:</span><p className="text-gray-600">{info?.softwareRevision || "—"}</p></div>
            <div><span className="font-medium text-gray-700">Connection Status:</span><p className="text-gray-600">{connectionLabel}</p></div>

            <Separator className="my-2" />
            <div><span className="font-medium text-gray-700">Operating Temperature:</span><p className="text-gray-600">-10°C to 50°C (14°F to 122°F)</p></div>
            <div><span className="font-medium text-gray-700">Storage Temperature:</span><p className="text-gray-600">-20°C to 60°C (-4°F to 140°F)</p></div>
            <div><span className="font-medium text-gray-700">Humidity Range:</span><p className="text-gray-600">10% to 90% RH (non-condensing)</p></div>
            <div><span className="font-medium text-gray-700">Certifications:</span><p className="text-gray-600">FCC ID: 2A123-MRS2100, CE, RoHS</p></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
