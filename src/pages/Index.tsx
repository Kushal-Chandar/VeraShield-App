import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Zap, HelpCircle } from "lucide-react";
import BluetoothPairing from "@/components/BluetoothPairing";
import BluetoothService, { DeviceData } from "@/services/bluetooth/bluetoothService";
import TimeSettings from "@/components/TimeSettings";
import Troubleshoot from "@/pages/Troubleshoot";
import { useToast } from "@/hooks/use-toast";
import DeviceStatusCard from "@/components/DeviceStatusCard";
import RemoteSprayControl from "@/components/RemoteSprayControl";
import SmartSchedulingPanel from "@/components/SmartSchedulingPanel";

const Index = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  // const [isConnected, setIsConnected] = useState(true);
  const [deviceName, setDeviceName] = useState("");
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
  );
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const { toast } = useToast();

  const bluetoothService = BluetoothService;

  useEffect(() => {
    let mounted = true;
    bluetoothService
      .isDeviceConnected()
      .then((connected) => {
        if (mounted) setIsConnected(connected);
      })
      .catch(() => {
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const loadDeviceData = async () => {
      const data = await bluetoothService.readDeviceData();
      setDeviceData(data);
    };
    loadDeviceData();
  }, [isConnected]);


  const handleConnect = async (name: string) => {
    setIsConnected(true);
    setDeviceName(name);

    try {
      const data = await bluetoothService.refreshDeviceData();
      setDeviceData(data);
      toast({
        title: "Device Connected",
        description: `Connected to ${name} - Data synchronized`,
      });
    } catch (error) {
      toast({
        title: "Connection Warning",
        description: `${error} Connected but couldn't read device data`,
        variant: "destructive",
      });
    }
  };


  return (
    <div className="mobile-container bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <div className="container mx-auto px-4 max-w-md safe-area-inset">
        {/* VeraShield Header with proper top spacing */}
        <div className="text-center pt-8 pb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
            VeraShield
          </h1>
          <p className="text-gray-600">Smart Mosquito Repellent Control</p>
        </div>

        <Tabs defaultValue="control" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="control" className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Control</span>
            </TabsTrigger>
            <TabsTrigger value="troubleshoot" className="flex items-center gap-1">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Troubleshoot</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="space-y-6">
            {/* Bluetooth Pairing */}
            {!isConnected && (
              <BluetoothPairing onConnect={handleConnect} />
            )}

            {/* Device Status */}
            <DeviceStatusCard
              isConnected={isConnected}
              deviceName={deviceName}
              batteryLevel={deviceData?.batteryLevel}
            />

            {/* Quick Actions - Only show when connected */}
            {isConnected && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RemoteSprayControl />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsConnected(false);
                      setDeviceName("");
                    }}
                  >
                    Disconnect Device
                  </Button>
                </CardContent>
              </Card>
            )}


            {/* Time Settings - Always visible */}
            <TimeSettings
              currentTime={currentTime}
              onTimeChange={setCurrentTime}
            />

            <SmartSchedulingPanel defaultTime="20:00" />
          </TabsContent>

          <TabsContent value="troubleshoot">
            <Troubleshoot />
          </TabsContent>


        </Tabs>

        {/* Bottom padding for proper spacing */}
        <div className="pb-8"></div>
      </div>
    </div>
  );
};

export default Index;
