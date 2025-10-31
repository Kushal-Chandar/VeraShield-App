// src/components/UsageStatsCard.tsx
import { useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, RefreshCw, AlertTriangle, TrendingUp } from "lucide-react";
import { useFirmwareStats } from "@/hooks/useFirmwareStats";
import { TIMEFRAMES, TimeframeKey } from "@/utils/statsUtils";

export default function UsageStatsCard({ isConnected }: { isConnected: boolean }) {
  const { loading, error, entries, tfKey, setTfKey, load } = useFirmwareStats();

  useEffect(() => {
    if (isConnected) void load(tfKey);
  }, [isConnected, tfKey, load]);

  const { totalSprays, sprayHours, lastUsed } = useMemo(() => {
    let totalSec = 0;
    let latest: Date | null = null;

    for (const e of entries) {
      const s = typeof e?.durationSec === "number" ? e.durationSec : 0;
      totalSec += s;
      const t = e?.t instanceof Date ? e.t : null;
      if (t && (!latest || t > latest)) latest = t;
    }

    return {
      totalSprays: entries.length,
      sprayHours: +(totalSec / 3600).toFixed(2),
      lastUsed: latest ? latest.toLocaleString() : "—",
    };
  }, [entries]);

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
              <Button
                key={t.key}
                size="sm"
                variant={tfKey === (t.key as TimeframeKey) ? "default" : "outline"}
                onClick={() => setTfKey(t.key as TimeframeKey)}
                disabled={!isConnected || loading}
              >
                {t.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => load(tfKey)}
              disabled={!isConnected || loading}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CardDescription>
          {isConnected
            ? (error ? <span className="text-red-600">{error}</span> : `Filtered: ${TIMEFRAMES.find(t => t.key === tfKey)?.label}`)
            : "Connect device to view usage"}
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
            {/* Total sprays (by active filter) */}
            <div className="p-3 bg-green-50 rounded-lg border">
              <p className="text-xs text-green-700 mb-1">Total Sprays ({TIMEFRAMES.find(t => t.key === tfKey)?.label})</p>
              <p className="text-xl font-bold text-green-800">{totalSprays}</p>
            </div>

            {/* Spray hours (by active filter) */}
            <div className="p-3 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
                <p className="text-xs text-blue-700">Spray Hours ({TIMEFRAMES.find(t => t.key === tfKey)?.label})</p>
              </div>
              <p className="text-xl font-bold text-blue-800">{sprayHours} h</p>
            </div>

            {/* Last sprayed at */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Sprayed At</span>
              <Badge variant="outline">{lastUsed}</Badge>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
