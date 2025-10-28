import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LedStatusCard() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">LED Status Indicators</CardTitle>
        <CardDescription>Understanding your device's visual signals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
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
        </div>
      </CardContent>
    </Card>
  );
}
