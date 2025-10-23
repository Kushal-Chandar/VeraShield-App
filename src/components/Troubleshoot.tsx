import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  RefreshCw,
  Wifi,
  Clock,
  TrendingUp,
  Droplets,
} from "lucide-react";

import { Separator } from "@radix-ui/react-separator";
import { bluetoothService } from "@/lib/bluetooth";

type DeviceInfo = {
  modelNumber: string;
  manufacturerName: string;
  serialNumber: string;
  firmwareRevision: string;
  hardwareRevision: string;
  softwareRevision: string;
};

const Troubleshoot = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false); // ← default to false
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void checkConnectionAndLoadData();
  }, []);

  const checkConnectionAndLoadData = async () => {
    const connected = bluetoothService.isDeviceConnected();
    setIsConnected(connected);
    if (connected) {
      await loadDeviceData();
    } else {
      setDeviceInfo(null);
    }
  };

  const loadDeviceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await bluetoothService.getDeviceInfo();
      setDeviceInfo(info);
    } catch (e: unknown) {
      console.error("Error loading device data:", e);
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as any).message)
          : "Failed to load device data";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isConnected) {
      await loadDeviceData();
    } else {
      await checkConnectionAndLoadData();
    }
  };

  // 🔧 FIX: don't call a non-existent bluetoothService.getConnectionStatus()
  const getConnectionStatus = () => {
    if (isConnected) {
      return deviceInfo?.modelNumber ? `Connected to ${deviceInfo.modelNumber}` : "Connected";
    }
    return "Disconnected";
  };

  const troubleshootingSteps = [
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

  const userData = {
    name: "User",
    totalSprays: 127,
    totalRuntime: "42h 30m",
    averageDaily: 3.2,
    peakHour: "20:00",
    currentStreak: 7,
    lastUsed: "2 hours ago",
  };

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

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Live Device Information */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              Device Information
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
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
              <Wifi className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Connect to your Machhar device to view detailed information</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Model:</span>
                <p className="text-gray-600">{deviceInfo?.modelNumber || "Loading..."}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Manufacturer:</span>
                <p className="text-gray-600">{deviceInfo?.manufacturerName || "Loading..."}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Serial Number:</span>
                <p className="text-gray-600">{deviceInfo?.serialNumber || "Loading..."}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Firmware Version:</span>
                <p className="text-gray-600">{deviceInfo?.firmwareRevision || "Loading..."}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Hardware Revision:</span>
                <p className="text-gray-600">{deviceInfo?.hardwareRevision || "Loading..."}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Software Revision:</span>
                <p className="text-gray-600">{deviceInfo?.softwareRevision || "Loading..."}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Connection Status:</span>
                <p className="text-gray-600">{getConnectionStatus()}</p>
              </div>

              <Separator className="my-2" />
              <div>
                <span className="font-medium text-gray-700">Operating Temperature:</span>
                <p className="text-gray-600">-10°C to 50°C (14°F to 122°F)</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Storage Temperature:</span>
                <p className="text-gray-600">-20°C to 60°C (-4°F to 140°F)</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Humidity Range:</span>
                <p className="text-gray-600">10% to 90% RH (non-condensing)</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Certifications:</span>
                <p className="text-gray-600">FCC ID: 2A123-MRS2100, CE, RoHS</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Device Status Indicators */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">LED Status Indicators</CardTitle>
          <CardDescription>Understanding your device's visual signals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div>
                <span className="font-medium">Blinking Blue:</span>
                <span className="text-sm text-gray-600 ml-2">Device is ready to connect</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <span className="font-medium">Solid Green:</span>
                <span className="text-sm text-gray-600 ml-2">Battery at Good Level</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <div>
                <span className="font-medium">Solid Yellow:</span>
                <span className="text-sm text-gray-600 ml-2">Medium battery (below 60%)</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div>
                <span className="font-medium">Solid Red:</span>
                <span className="text-sm text-gray-600 ml-2">Low battery (below 30%)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Usage Statistics */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Usage Statistics
          </CardTitle>
          <CardDescription>Your spray usage overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-blue-700">Total Sprays</p>
              </div>
              <p className="text-xl font-bold text-blue-800">{userData.totalSprays}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-700">Total Runtime</p>
              </div>
              <p className="text-xl font-bold text-green-800">{userData.totalRuntime}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Used</span>
              <Badge variant="outline">{userData.lastUsed}</Badge>
            </div>
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
            {troubleshootingSteps.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left font-medium hover:no-underline">
                  {item.issue}
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-2">
                    {item.solutions.map((solution, sIndex) => (
                      <div key={sIndex} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
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

      {/* Contact Support */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Contact Support</CardTitle>
          <CardDescription>Get help from our technical support team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto p-4"
              onClick={() => console.log("Opening phone support")}
            >
              <Phone className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Phone Support</div>
                <div className="text-sm text-gray-600">1-800-SHIELD (24/7)</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto p-4"
              onClick={() => console.log("Opening email support")}
            >
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


    </div>
  );
};

export default Troubleshoot;
