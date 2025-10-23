import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BluetoothIcon, Clock, Zap, Info, HelpCircle, User, Settings, Droplets } from "lucide-react";
import BluetoothService from "@/services/bluetooth/bluetoothService"; // 👈 default import (no braces)
import { useToast } from "@/hooks/use-toast";

import BluetoothPairing from "@/components/BluetoothPairing";
import Troubleshoot from "@/components/Troubleshoot";
import TimeSettings from "@/components/TimeSettings";
import DeviceStatusCard from "@/components/DeviceStatusCard";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
  );
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const bluetoothService = BluetoothService; // 👈 use it directly — it's already a singleton

  useEffect(() => {
    const loadDeviceData = async () => {
      const data = bluetoothService.getDeviceData();
      setDeviceData(data);
    };
    loadDeviceData();
  }, [isConnected]);

  const handleSprayNow = () => {
    toast({
      title: "Spray Activated",
      description: "Starting spray cycle now",
    });
    navigate("/active-spray");
  };

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
        description: "Connected but couldn't read device data",
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
              onRefresh={async () => {
                // optional: wire into your existing refresh logic
                if (isConnected) {
                  await loadDeviceData?.();
                } else {
                  await checkConnectionAndLoadData?.();
                }
              }}
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
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
                    onClick={handleSprayNow}
                  >
                    Spray Now
                  </Button>
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
            {/* Control Features - Always visible below device status */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-500" />
                  Control Features
                </CardTitle>
                <CardDescription>
                  Access spray control and scheduling features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                  onClick={() => navigate("/smart-scheduling")}
                  disabled={!isConnected}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Smart Scheduling
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  onClick={() => navigate("/intensity-control")}
                  disabled={!isConnected}
                >
                  <Droplets className="w-4 h-4 mr-2" />
                  Spray Intensity
                </Button>
              </CardContent>
            </Card>
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
