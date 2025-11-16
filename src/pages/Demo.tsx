import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, HelpCircle, RefreshCw, AlertTriangle, TrendingUp, Clock, Phone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TimeSettings from "@/components/TimeSettings";
import { useToast } from "@/hooks/use-toast";
import DeviceStatusCard from "@/components/DeviceStatusCard";
import SmartSchedulingPanel from "@/components/SmartSchedulingPanel";

type IntensityKey = "Low" | "Medium" | "High";

// Demo Device Info
const DEMO_DEVICE_INFO = {
  modelNumber: "VeraShield-2100",
  manufacturerName: "Mosquito Labs Inc.",
  serialNumber: "VSH-2024-001234",
  firmwareRevision: "2.1.5",
  hardwareRevision: "1.2",
  softwareRevision: "2.1.5",
};

// Demo Usage Stats
const DEMO_STATS = {
  totalSprays: 24,
  sprayHours: 3.45,
  lastUsed: "Today at 8:30 PM",
};

// Troubleshooting items
const TROUBLESHOOTING_ITEMS = [
  {
    issue: "Device won't connect to Bluetooth",
    solutions: [
      "Ensure device can connect (Blue LED should blink)",
      "Make sure your phone's Bluetooth is enabled",
      "Clear app cache and restart the application",
      "If the Blue LED is not blinking restart device",
      "Check if device is within 10 meters range",
    ],
  },
  {
    issue: "Spray not working",
    solutions: [
      "Check if repellent cartridge needs replacement",
      "Ensure spray nozzle is not blocked",
      "Check if device is properly scheduled",
      "Perform manual spray test from device",
    ],
  },
  {
    issue: "App crashes or freezes",
    solutions: [
      "Force close and restart the app",
      "Update to the latest app version",
      "Restart your smartphone",
      "Clear app data and re-pair device",
      "Reinstall the application if problem persists",
    ],
  },
];

const Demo = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [deviceName, setDeviceName] = useState("VeraShield Demo Device");
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
  );
  const { toast } = useToast();

  // Demo Remote Spray state
  const [sprayIntensity, setSprayIntensity] = useState<IntensityKey>("Low");
  const [sprayBusy, setSprayBusy] = useState(false);
  const [sprayMsg, setSprayMsg] = useState<string | null>(null);

  // Demo Device Info state
  const [infoLoading, setInfoLoading] = useState(false);

  // Simulate time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDisconnect = () => {
    setIsConnected(false);
    setDeviceName("");
    toast({
      title: "Demo: Device Disconnected",
      description: "This is a demonstration. Click 'Reconnect' to restore.",
    });
  };

  const handleReconnect = () => {
    setIsConnected(true);
    setDeviceName("VeraShield Demo Device");
    toast({
      title: "Demo: Device Reconnected",
      description: "Demo device is now connected.",
    });
  };

  // Demo Remote Spray
  const handleSprayIntensityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as IntensityKey;
    setSprayIntensity(value);

    if (value === "High") {
      toast({
        title: "⚠️ High intensity selected",
        description:
          "High intensity sprays can be harmful for the environment. Use only when really needed.",
        variant: "destructive",
      });
    }
  };

  const handleSpray = async () => {
    if (!isConnected) {
      setSprayMsg("Please connect to a device first.");
      return;
    }
    setSprayBusy(true);
    setSprayMsg(null);

    setTimeout(() => {
      setSprayMsg(`✅ Spray triggered: ${sprayIntensity} intensity`);
      toast({
        title: "Demo Spray Activated",
        description: `Remote spray at ${sprayIntensity} intensity`,
      });
      setSprayBusy(false);
    }, 800);
  };

  // Demo Device Info Refresh
  const handleRefreshInfo = async () => {
    if (!isConnected) return;
    setInfoLoading(true);

    setTimeout(() => {
      setInfoLoading(false);
      toast({
        title: "Device Info",
        description: "Device information refreshed successfully",
      });
    }, 500);
  };

  return (
    <div className="mobile-container bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <div className="container mx-auto px-4 max-w-md safe-area-inset">
        {/* Demo Banner */}
        <div className="mt-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium">
            🎮 Demo Mode - Interact with placeholder data
          </p>
        </div>

        {/* VeraShield Header */}
        <div className="text-center pt-4 pb-6">
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
            {/* Device Status */}
            <DeviceStatusCard
              useService={false}
              isConnected={isConnected}
              deviceName={deviceName}
              batteryLevel={isConnected ? 85 : null}
            />

            {/* Quick Actions - Only show when connected */}
            {isConnected && (
              <>
                {/* Demo Remote Spray Control */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-orange-500" />
                      Remote Spray
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                      <label className="flex-1">
                        <span className="block text-sm mb-1 font-medium">Intensity</span>
                        <select
                          className="w-full rounded-lg border px-3 py-2 bg-white"
                          value={sprayIntensity}
                          onChange={handleSprayIntensityChange}
                          disabled={sprayBusy}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </label>

                      <Button
                        onClick={handleSpray}
                        disabled={sprayBusy}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {sprayBusy ? "Spraying..." : "Spray"}
                      </Button>
                    </div>

                    {sprayMsg && (
                      <p className="text-sm text-sky-700 bg-sky-50 p-2 rounded">
                        {sprayMsg}
                      </p>
                    )}

                    <p className="text-sm text-emerald-700">✓ Device connected</p>
                  </CardContent>
                </Card>

                {/* Disconnect Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDisconnect}
                >
                  Disconnect Device (Demo)
                </Button>
              </>
            )}

            {/* Reconnect Button - Show when disconnected */}
            {!isConnected && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="pt-6">
                  <Button
                    onClick={handleReconnect}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    Reconnect Demo Device
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

          <TabsContent value="troubleshoot" className="space-y-6">
            {/* Emergency Contact */}
            <Alert className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-800">
                <strong>Emergency:</strong> If you experience any allergic reactions or health issues,
                stop using the device immediately and contact your healthcare provider.
              </AlertDescription>
            </Alert>

            {/* Device Info Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    Device Information
                    {infoLoading && <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={handleRefreshInfo} disabled={!isConnected || infoLoading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                <CardDescription>
                  {isConnected ? "Live data from connected device" : "Connect device to view live information"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isConnected ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Connect to your device to view detailed information</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div><span className="font-medium text-gray-700">Model:</span><p className="text-gray-600">{DEMO_DEVICE_INFO.modelNumber}</p></div>
                    <div><span className="font-medium text-gray-700">Manufacturer:</span><p className="text-gray-600">{DEMO_DEVICE_INFO.manufacturerName}</p></div>
                    <div><span className="font-medium text-gray-700">Serial Number:</span><p className="text-gray-600">{DEMO_DEVICE_INFO.serialNumber}</p></div>
                    <div><span className="font-medium text-gray-700">Firmware Version:</span><p className="text-gray-600">{DEMO_DEVICE_INFO.firmwareRevision}</p></div>
                    <div><span className="font-medium text-gray-700">Hardware Revision:</span><p className="text-gray-600">{DEMO_DEVICE_INFO.hardwareRevision}</p></div>
                    <div><span className="font-medium text-gray-700">Software Revision:</span><p className="text-gray-600">{DEMO_DEVICE_INFO.softwareRevision}</p></div>
                    <div><span className="font-medium text-gray-700">Connection Status:</span><p className="text-gray-600">Connected to {DEMO_DEVICE_INFO.modelNumber}</p></div>
                    <hr className="my-2" />
                    <div><span className="font-medium text-gray-700">Operating Temperature:</span><p className="text-gray-600">-10°C to 50°C (14°F to 122°F)</p></div>
                    <div><span className="font-medium text-gray-700">Storage Temperature:</span><p className="text-gray-600">-20°C to 60°C (-4°F to 140°F)</p></div>
                    <div><span className="font-medium text-gray-700">Humidity Range:</span><p className="text-gray-600">10% to 90% RH (non-condensing)</p></div>
                    <div><span className="font-medium text-gray-700">Certifications:</span><p className="text-gray-600">FCC ID: 2A123-MRS2100, CE, RoHS</p></div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Stats Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Usage
                </CardTitle>
                <CardDescription>
                  {isConnected ? "Demo usage statistics" : "Connect device to view usage"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConnected && (
                  <>
                    <div className="p-3 bg-green-50 rounded-lg border">
                      <p className="text-xs text-green-700 mb-1">Total Sprays (This Week)</p>
                      <p className="text-xl font-bold text-green-800">{DEMO_STATS.totalSprays}</p>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <p className="text-xs text-blue-700">Spray Hours (This Week)</p>
                      </div>
                      <p className="text-xl font-bold text-blue-800">{DEMO_STATS.sprayHours} h</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Sprayed At</span>
                      <Badge variant="outline">{DEMO_STATS.lastUsed}</Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* LED Status Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">LED Status Indicators</CardTitle>
                <CardDescription>Understanding your device's visual signals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div><span className="font-medium">Blinking Blue:</span><span className="text-sm text-gray-600 ml-2">Device is ready to connect</span></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div><span className="font-medium">Solid Green:</span><span className="text-sm text-gray-600 ml-2">Battery at Good Level</span></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <div><span className="font-medium">Solid Yellow:</span><span className="text-sm text-gray-600 ml-2">Medium battery (below 60%)</span></div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div><span className="font-medium">Solid Red:</span><span className="text-sm text-gray-600 ml-2">Low battery (below 30%)</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Troubleshooting Guide */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Troubleshooting Guide</CardTitle>
                <CardDescription>Step-by-step solutions for common problems</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {TROUBLESHOOTING_ITEMS.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-left font-medium hover:no-underline">
                        {item.issue}
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="space-y-2">
                          {item.solutions.map((solution, sIndex) => (
                            <div key={sIndex} className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{solution}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Contact Support Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Contact Support</CardTitle>
                <CardDescription>Get help from our technical support team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">Phone Support</div>
                      <div className="text-sm text-gray-600">1-800-SHIELD (24/7)</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start gap-3 h-auto p-4">
                    <Mail className="w-5 h-5 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium">Email Support</div>
                      <div className="text-sm text-gray-600">support@mosquitoshield.com</div>
                    </div>
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-800 border-0">Tip</Badge>
                  </div>
                  <p className="text-sm text-blue-700">
                    Have your device serial number ready when contacting support.
                    You can find it in the device settings or on the product label.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom padding */}
        <div className="pb-8"></div>
      </div>
    </div>
  );
};

export default Demo;