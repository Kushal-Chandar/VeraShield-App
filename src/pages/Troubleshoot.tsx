import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import bluetoothService from "@/lib/bluetooth";

import DeviceInfoCard from "@/components/troubleshoot/DeviceInfoCard";
import UsageStatsCard from "@/components/troubleshoot/UsageStatsCard";
import LedStatusCard from "@/components/troubleshoot/LedStatusCard";
import TroubleshootingGuide from "@/components/troubleshoot/TroubleshootingGuide";
import ContactSupportCard from "@/components/troubleshoot/ContactSupportCard";

export default function Troubleshoot() {
  const [isConnected, setIsConnected] = useState<boolean>(bluetoothService.isDeviceConnected());
  const [emergencyNote] = useState<string | null>(null);

  useEffect(() => {
    const off = bluetoothService.onConnectionChange?.((c) => setIsConnected(!!c));
    return () => { try { off?.(); } catch { } };
  }, []);

  return (
    <div className="space-y-6">
      {/* Emergency Contact */}
      <Alert className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-800">
          <strong>Emergency:</strong> If you experience any allergic reactions or health issues,
          stop using the device immediately and contact your healthcare provider.
        </AlertDescription>
      </Alert>

      {emergencyNote && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{emergencyNote}</AlertDescription>
        </Alert>
      )}

      <DeviceInfoCard isConnected={isConnected} />
      <UsageStatsCard isConnected={isConnected} />
      <LedStatusCard />
      <TroubleshootingGuide />
      <ContactSupportCard />
    </div>
  );
}
