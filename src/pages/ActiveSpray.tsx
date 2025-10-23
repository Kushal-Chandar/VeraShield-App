
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Droplets, CheckCircle2 } from "lucide-react";

const ActiveSpray = () => {
  const navigate = useNavigate();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const SPRAY_DURATION = 1800; // 30 minutes in seconds
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => {
        if (prev >= SPRAY_DURATION) {
          setIsComplete(true);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const progress = Math.min((timeElapsed / SPRAY_DURATION) * 100, 100);
  
  // Helper function to format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className="mobile-container bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <div className="container mx-auto px-4 py-6 max-w-md safe-area-inset">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')} 
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            MosquitoShield
          </h1>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                {isComplete ? "Spray Complete" : "Spray Active"}
              </CardTitle>
              <Badge 
                className={isComplete ? "bg-green-500" : "bg-blue-500 animate-pulse"}
              >
                {isComplete ? "Completed" : "Active"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Animation */}
            <div className="flex justify-center py-6">
              {isComplete ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="h-24 w-24 text-green-500 animate-scale-in" />
                  <p className="text-lg font-medium text-gray-700 mt-4">Spray cycle completed</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-lg font-medium text-blue-700">{Math.round(progress)}%</p>
                  </div>
                  <svg className="h-40 w-40" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-200 stroke-current"
                      strokeWidth="6"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                    />
                    <circle
                      className="text-blue-500 stroke-current animate-pulse"
                      strokeWidth="6"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      strokeDasharray={`${2.5 * Math.PI * 40}`}
                      strokeDashoffset={`${2.5 * Math.PI * 40 * (1 - progress / 100)}`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-ping absolute h-16 w-16 rounded-full bg-blue-400 opacity-30"></div>
                    <Droplets className="h-12 w-12 text-blue-500 relative animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">Spray Duration</p>
                <p className="text-xl font-bold">
                  {isComplete ? "30m" : `${formatTime(timeElapsed)} / 30m`}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-700">Status</p>
                <p className="text-xl font-bold">{isComplete ? "Finished" : "Spraying..."}</p>
              </div>
            </div>

            {/* Actions */}
            <Button 
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
              onClick={() => navigate('/')}
            >
              Return to Control Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActiveSpray;
