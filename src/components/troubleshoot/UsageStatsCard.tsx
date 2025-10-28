// src/components/troubleshoot/UsageStatsCard.tsx
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Droplets, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { TIMEFRAMES, TimeframeKey, computeMetrics } from "@/utils/statsUtils";
import { useFirmwareStats } from "@/hooks/useFirmwareStats";

export default function UsageStatsCard({ isConnected }: { isConnected: boolean }) {
  const { loading, error, lifetimeTotal, entries, tfKey, setTfKey, load } = useFirmwareStats();

  useEffect(() => {
    if (isConnected) void load(tfKey);
  }, [isConnected, tfKey, load]);

  const metrics = computeMetrics(entries);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Usage
          </CardTitle>

          <div className="flex gap-2">
            {TIMEFRAMES.map((t) => (
              <Button key={t.key} size="sm" variant={tfKey === t.key ? "default" : "outline"} onClick={() => setTfKey(t.key as TimeframeKey)} disabled={!isConnected || loading}>
                {t.key.toUpperCase()}
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={() => load(tfKey)} disabled={!isConnected || loading}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {isConnected ? (error ? <span className="text-red-600">{error}</span> : "Computed from device events") : "Connect device to view usage"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-sm text-gray-500">Loading stats…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-blue-700">Lifetime Sprays</p>
                </div>
                <p className="text-xl font-bold text-blue-800">{lifetimeTotal}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-700">Sprays in {TIMEFRAMES.find(t => t.key === tfKey)?.label}</p>
                </div>
                <p className="text-xl font-bold text-green-800">{metrics.totalSprays}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-purple-50 rounded-lg border">
                <div className="text-xs text-purple-700 mb-1">Average per Day</div>
                <div className="text-xl font-bold text-purple-800">{metrics.averageDaily}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border">
                <div className="text-xs text-amber-700 mb-1">Peak Hour</div>
                <div className="text-xl font-bold text-amber-800">{metrics.peakHour}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded border text-center">
                <div className="text-xs text-gray-600">Low</div>
                <div className="font-semibold">{metrics.intensityMix.low}</div>
              </div>
              <div className="p-2 rounded border text-center">
                <div className="text-xs text-gray-600">Medium</div>
                <div className="font-semibold">{metrics.intensityMix.medium}</div>
              </div>
              <div className="p-2 rounded border text-center">
                <div className="text-xs text-gray-600">High</div>
                <div className="font-semibold">{metrics.intensityMix.high}</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Used</span>
              <Badge variant="outline">{metrics.lastUsed}</Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
